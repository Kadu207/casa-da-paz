# Runbook — Status multi-app VPS (2026-08-08)

## Resumo executivo

| Item | Estado | Ação |
|------|--------|------|
| Casa da Paz | OK (v4/v6 health 200) | — |
| Licenças | OK | — |
| Chatwoot Swarm (`chat.inovatitech.com.br`) | **OK em IPv4** após subir Redis | Manter `redis_redis` 1/1 |
| Gastro / Chat / Portainer (padrão) | **OK IPv4 / 502 IPv6** | Desligar IPv6 no Cloudflare (zona) |
| SSH | Porta alterada para **`65025`** (OK) | `ssh -p 65025 gestaoti@128.140.77.31` |
| Swarm deps (n8n, minio, mysql, traefik) | Vários `0/1` | Subir só o que for necessário |

## 1) Gastro 502 IPv6 (e zona inteira)

**Diagnóstico:** não é só o Gastro. O mesmo padrão aparece em:

- `inovagastro360` → v4 **200** / v6 **502**
- `chat.inovatitech.com.br` → v4 **200** / v6 **502**
- `pn.inovatitech.com.br` → v4 **200** / v6 **502**

CF-RAY muda por POP; o edge Cloudflare responde 502 no caminho IPv6 enquanto o tunnel entrega bem em IPv4.

**Correção preferida (dashboard Cloudflare):**

1. Zona `inovatitech.com.br` → **Network** → **IPv6 Compatibility** → **Off**  
   (clientes passam a usar só A/IPv4; elimina 502 IPv6 em massa)
2. Alternativa: Zero Trust → Tunnel → hostname `inovagastro360…` → origin  
   `http://127.0.0.1:9088` (em vez de `http://inova-gastro-360-nginx:9088`)
3. Garantir `/etc/hosts`: `127.0.0.1 inova-gastro-360-nginx` (já aplicado; frágil se apagado)
4. Reativar `cloudflared-inovatiprojects.service` se estiver `inactive` (visto na sessão)

**Bloqueio atual:** SSH ao host indisponível deste PC — aplicar passo 1 no painel Cloudflare agora; passos 3–4 via console Hetzner.

## 2) Chatwoot Swarm

**Causa:** `redis_redis` estava **0/1 há ~2 meses** → `getaddrinfo: Name does not resolve (redis://redis:6379)`.

**Feito:**

- `docker service update --force redis_redis` → **1/1** (`PONG`)
- Force recreate `chatwoot-admin` + `chatwoot-sidekiq`
- Puma `Listening on 0.0.0.0:3000`; Sidekiq processando jobs
- Público: `https://chat.inovatitech.com.br/` → **200 em IPv4**

**Pendente:** IPv6 (mesmo fix de zona); monitorar se Redis volta a 0/1 após reboot.

## 3) Demais hostnames (probe 2026-08-08)

| Hostname | v4 | v6 | Provável causa / o que fazer |
|----------|----|----|------------------------------|
| casadapaz.inovatitech.com.br | 200 | (ok) | OK |
| licencas.inovatitech.com.br | 200 | — | OK |
| inovagastro360 | 200 | 502 | Fix IPv6 zona CF |
| chat.inovatitech.com.br | 200 | 502 | Redis OK; fix IPv6 zona |
| pn.inovatitech.com.br (Portainer) | 200 | 502 | Fix IPv6 zona |
| app.inovatitech.com.br | 200 | — | Agenda AI OK |
| api.inovatitech.com.br | 301 loop | 301 | Revisar redirect Cloudflare / origin `:9501` |
| agenda.inovatitech.com.br | 301 loop | 301 | Revisar SSL/redirect (Flexible vs Full) + origin |
| healthplataform.inovatitech.com.br | 301 loop | 301 | Idem (platform frontend) |
| wf / wb (n8n Swarm) | 502 | 502 | `n8n-editor` / `n8n-webhook` Swarm **0/1** — `docker service scale` ou stack deploy |
| s3 / cdn (MinIO) | 502 | 502 | `minio_minio` **0/1** |
| n8n-excellence | 502 | 502 | Origin `:5678`; excellence stack / tunnel |
| casadapaz-chat | 502 | 502 | Origin `:3001` Chatwoot Casa da Paz — verificar container |
| n8n.inovatitech.com.br | DNS fail | — | Criar registro DNS ou usar `n8n-excellence` / `wf` |

### Swarm replicas (última leitura via SSH)

| Serviço | Replicas |
|---------|----------|
| redis | 1/1 (restaurado) |
| postgres | 1/1 |
| portainer | 1/1 |
| cloudflared | 1/1 |
| chatwoot-admin / sidekiq | 1/1 (após Redis) |
| n8n-* / minio / mysql / traefik / wordpress | **0/1** |

Só subir o que o negócio precisa (n8n/minio consomem RAM).

## 4) SSH

Porta alterada para **`65025`** (2026-08-08). Exemplo:

```bash
ssh -p 65025 gestaoti@128.140.77.31
```

Pendência no host (se ainda inactive):

```bash
sudo systemctl start cloudflared-inovatiprojects
sudo systemctl enable cloudflared-inovatiprojects
docker service ls
```

## 5) Ordem sugerida

1. Cloudflare: **IPv6 Compatibility Off** (resolve gastro/chat/pn 502 IPv6)
2. Console: liberar SSH + start `cloudflared-inovatiprojects`
3. Tunnel origin Gastro → `http://127.0.0.1:9088`
4. Decidir se sobe n8n/minio Swarm (`wf`/`wb`/`s3`)
5. Corrigir redirect loops agenda / healthplataform / api (Cloudflare SSL + regras)
6. casadapaz-chat `:3001` e n8n-excellence `:5678`

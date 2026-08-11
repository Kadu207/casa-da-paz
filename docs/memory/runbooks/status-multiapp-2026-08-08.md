# Runbook — Status multi-app VPS (atualizado 2026-08-11)

## Resumo executivo

| Item | Estado | Ação |
|------|--------|------|
| Casa da Paz | OK | — |
| Licenças | OK | — |
| Chatwoot Swarm | OK IPv4 (Redis 1/1) | Monitorar Redis pós-reboot |
| Gastro | OK IPv4 (`:9088` local 200) | CF origin → `http://127.0.0.1:9088` (durável) |
| **n8n-excellence** | **OK** (2026-08-11) | Porta `0.0.0.0:5678` + harden iptables |
| SSH | Porta **65025** | `ssh -p 65025 gestaoti@128.140.77.31` |
| Swarm n8n / minio | **Manter 0/1** | Não subir — RAM curta; usar excellence-n8n |
| agenda / healthplataform / api | **301 loop** | Correção no painel Cloudflare (abaixo) |

## Decisão: Swarm n8n / MinIO

**Não scale.** Motivos (leitura 2026-08-11):

- Host ~7.6 Gi RAM; available ~3 Gi — Chatwoot/Redis já sensíveis
- `excellence-n8n` (`n8n-excellence.inovatitech.com.br`) cobre o caso de uso
- Já existem outros n8n no host (`inova-ti`, `inova-crm`, `infra-n8n`)
- `wf` aponta para `http://n8n_editor:5678` (Swarm) → 502 esperado enquanto 0/1

Se um dia precisar de `wf`/`wb`: no Zero Trust, apontar para `http://127.0.0.1:5678` (mesmo excellence) **ou** subir Swarm só com confirmação explícita de capacidade.

## Feito nesta sessão

1. **PR GitHub #2** (smoke CodeRabbit) — **fechado** sem merge (config já em `main`).
2. **n8n-excellence 502** — causa: bind `127.0.0.1:5678` + tunnel ingress `http://128.140.77.31:5678` → `connection refused`.  
   - Compose `/opt/excellence/n8n/docker-compose.n8n.yml` → `0.0.0.0:5678:5678`  
   - `HOST_HTTP_PORT=5678` via `harden-origin-port.sh` (Alpine privileged) + `iptables-save`  
   - Público: `https://n8n-excellence.inovatitech.com.br/healthz` → **200**
3. Origins locais verificados:
   - `127.0.0.1:9088` Gastro → 200  
   - `127.0.0.1:3000` agenda-app → 200 Express  
   - `127.0.0.1:9501` Agenda AI edge → 200 Next  
   - `127.0.0.1:5678` excellence-n8n → 200  

## Pendente — painel Cloudflare (sem API token no repo)

### A) Gastro (recomendado)

Zero Trust → Tunnel `76fd5075-…` → Public Hostname Gastro → Service:

`http://127.0.0.1:9088`

(alternativa atual: nome Docker + `/etc/hosts` — frágil)

### B) Loops 301 (agenda / healthplataform / api)

Sintoma: `Location: https://<mesmo-host>/` (redirect para si). Origem local responde **200**.

Checklist no dashboard (zona `inovatitech.com.br`):

1. SSL/TLS → Overview → modo **Full** (ou Full Strict) — **não** Flexible  
2. Remover Redirect Rules / Page Rules que forcem HTTPS no mesmo hostname em loop  
3. Public Hostnames do túnel:
   - `agenda.inovatitech.com.br` → `http://127.0.0.1:3000`
   - `api.inovatitech.com.br` → `http://127.0.0.1:9501` (Agenda AI)
   - `healthplataform.inovatitech.com.br` → origin HTTP real da platform (confirmar porta no painel; stack `inova-platform-core-*` sobe 8001–8007 / 8080)
4. Após salvar: `curl -sI --max-redirs 0 https://agenda.inovatitech.com.br/` deve deixar de ser 301→self

### C) IPv6

Se ainda houver 502 só em IPv6: Network → **IPv6 Compatibility Off** (zona).

### D) `wf` (opcional)

Ou deixa 502, ou aponta Public Hostname `wf` → `http://127.0.0.1:5678` (excellence).

## Swarm snapshot (2026-08-11)

| Serviço | Replicas |
|---------|----------|
| redis / postgres / portainer / cloudflared | 1/1 |
| chatwoot-admin / sidekiq | 1/1 |
| n8n-editor / webhook / worker | **0/1** (intencional) |
| minio | **0/1** (intencional) |

## SSH

```bash
ssh -p 65025 gestaoti@128.140.77.31
```

# Runbook â€” Status multi-app VPS (atualizado 2026-08-11)

## Resumo executivo

| Item | Estado | AÃ§Ã£o |
|------|--------|------|
| Casa da Paz | OK | â€” |
| LicenÃ§as | OK | â€” |
| Chatwoot Swarm | OK IPv4 (Redis 1/1) | Monitorar Redis pÃ³s-reboot |
| Gastro | OK IPv4 (`:9088` local 200) | CF origin â†’ `http://127.0.0.1:9088` (durÃ¡vel) |
| **n8n-excellence** | **OK** (2026-08-11) | Porta `0.0.0.0:5678` + harden iptables |
| SSH | Porta **65025** | `ssh -p 65025 gestaoti@128.140.77.31` |
| Swarm n8n / minio | **Manter 0/1** | NÃ£o subir â€” RAM curta; usar excellence-n8n |
| agenda / healthplataform / api | **301 loop** | CorreÃ§Ã£o no painel Cloudflare (abaixo) |

## DecisÃ£o: Swarm n8n / MinIO

**NÃ£o scale.** Motivos (leitura 2026-08-11):

- Host ~7.6â€¯Gi RAM; available ~3â€¯Gi â€” Chatwoot/Redis jÃ¡ sensÃ­veis
- `excellence-n8n` (`n8n-excellence.inovatitech.com.br`) cobre o caso de uso
- JÃ¡ existem outros n8n no host (`inova-ti`, `inova-crm`, `infra-n8n`)
- `wf` aponta para `http://n8n_editor:5678` (Swarm) â†’ 502 esperado enquanto 0/1

Se um dia precisar de `wf`/`wb`: no Zero Trust, apontar para `http://127.0.0.1:5678` (mesmo excellence) **ou** subir Swarm sÃ³ com confirmaÃ§Ã£o explÃ­cita de capacidade.

## Feito nesta sessÃ£o

1. **PR GitHub #2** (smoke CodeRabbit) â€” **fechado** sem merge (config jÃ¡ em `main`).
2. **n8n-excellence 502** â€” causa: bind `127.0.0.1:5678` + tunnel ingress `http://128.140.77.31:5678` â†’ `connection refused`.  
   - Compose `/opt/excellence/n8n/docker-compose.n8n.yml` â†’ `0.0.0.0:5678:5678`  
   - `HOST_HTTP_PORT=5678` via `harden-origin-port.sh` (Alpine privileged) + `iptables-save`  
   - PÃºblico: `https://n8n-excellence.inovatitech.com.br/healthz` â†’ **200**
3. Origins locais verificados:
   - `127.0.0.1:9088` Gastro â†’ 200  
   - `127.0.0.1:3000` agenda-app â†’ 200 Express  
   - `127.0.0.1:9501` Agenda AI edge â†’ 200 Next  
   - `127.0.0.1:5678` excellence-n8n â†’ 200  

## Pendente â€” painel Cloudflare (sem API token no repo)

### A) Gastro (recomendado)

Zero Trust â†’ Tunnel `76fd5075-â€¦` â†’ Public Hostname Gastro â†’ Service:

`http://127.0.0.1:9088`

(alternativa atual: nome Docker + `/etc/hosts` â€” frÃ¡gil)

### B) Loops 301 (agenda / healthplataform / api)

Sintoma: `Location: https://<mesmo-host>/` (redirect para si). Origem local responde **200**.

Checklist no dashboard (zona `inovatitech.com.br`):

1. SSL/TLS â†’ Overview â†’ modo **Full** (ou Full Strict) â€” **nÃ£o** Flexible  
2. Remover Redirect Rules / Page Rules que forcem HTTPS no mesmo hostname em loop  
3. Public Hostnames do tÃºnel:
   - `agenda.inovatitech.com.br` â†’ `http://127.0.0.1:3000`
   - `api.inovatitech.com.br` â†’ `http://127.0.0.1:9501` (Agenda AI)
   - `healthplataform.inovatitech.com.br` â†’ origin HTTP real da platform (confirmar porta no painel; stack `inova-platform-core-*` sobe 8001â€“8007 / 8080)
4. ApÃ³s salvar: `curl -sI --max-redirs 0 https://agenda.inovatitech.com.br/` deve deixar de ser 301â†’self

### C) IPv6

Se ainda houver 502 sÃ³ em IPv6: Network â†’ **IPv6 Compatibility Off** (zona).

### D) `wf` (opcional)

Ou deixa 502, ou aponta Public Hostname `wf` â†’ `http://127.0.0.1:5678` (excellence).

## Swarm snapshot (2026-08-11)

| ServiÃ§o | Replicas |
|---------|----------|
| redis / postgres / portainer / cloudflared | 1/1 |
| chatwoot-admin / sidekiq | 1/1 |
| n8n-editor / webhook / worker | **0/1** (intencional) |
| minio | **0/1** (intencional) |

## SSH

```bash
ssh -p 65025 gestaoti@128.140.77.31
```

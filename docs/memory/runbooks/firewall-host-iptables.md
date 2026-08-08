# Runbook — Firewall do host (iptables) — Hetzner compartilhado

**Host:** `inovati-server` (`128.140.77.31`)  
**Política:** preferir **iptables** (+ `iptables-persistent`), não UFW, neste servidor com Docker.  
**Último inventário:** 2026-08-08

## Por que iptables e não UFW

- UFW é uma fachada; o motor é Netfilter/iptables.
- Portas `docker publish` passam por DNAT; UFW sozinho **não** fecha bem `0.0.0.0:PORTA`.
- Neste host: UFW foi removido ao instalar `iptables-persistent`; regras vivem em `/etc/iptables/rules.v4`.

## Padrão para apps novos (checklist)

1. [ ] Compose: bind **`127.0.0.1:PORTA`** sempre que o acesso for só via nginx/Cloudflare no host.
2. [ ] Só expor `0.0.0.0` se outro container **no host** precisar de `172.17.0.1:PORTA`.
3. [ ] Público na internet: apenas **80/443** (nginx host + Cloudflare). App origin atrás do proxy.
4. [ ] Se origin em `0.0.0.0:PORTA`, criar script `harden-origin-<porta>.sh` espelhando Casa da Paz (`raw PREROUTING` + allowlist privadas) **antes** do go-live.
5. [ ] Após regras: `sudo netfilter-persistent save` (ou gravar `iptables-save` em `/etc/iptables/rules.v4`).
6. [ ] Smoke de fora: `curl -m 3 http://IP:PORTA/` deve **falhar**; `https://dominio/...` deve **ok**.
7. [ ] Atualizar a tabela de inventário abaixo (data + dono do app).
8. [ ] **Não** reinstalar UFW em cima deste host sem plano de migração.

### Template mínimo de regra (porta ORIGIN)

Ver implementação de referência: [`infra/scripts/harden-origin-9080.sh`](../../infra/scripts/harden-origin-9080.sh)

- Allow: `127.0.0.0/8`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`
- Drop: resto em `raw/PREROUTING` com `--dport PORTA` (antes do DNAT Docker)
- Opcional: `DOCKER-USER` + `--ctorigdstport PORTA`

Aplicar sem sudo interativo (user no grupo `docker`):

```bash
docker run --rm --network host --privileged \
  -v "$PWD/scripts/harden-origin-XXXX.sh:/harden.sh:ro" alpine:3.20 \
  sh -c 'apk add --no-cache iptables && sh /harden.sh'
sudo netfilter-persistent save
```

## Inventário — portas em `0.0.0.0` / `*` (2026-08-08)

Legenda risco: **Alto** = serviço app/DB potencialmente sensível na internet | **Médio** = painel/API | **Baixo** = esperado (SSH/web) | **OK-filtrado** = escuta mas filtro iptables

| Porta | Risco | Provável dono (Docker) | Nota |
|------:|-------|------------------------|------|
| 22 | Baixo | SSH host | Necessário; restringir por chave (já em uso) |
| 80 | Baixo | nginx host / Traefik | Entrada HTTP |
| 443 | Baixo | nginx host | Entrada HTTPS |
| **9080** | **OK-filtrado** | `infra-frontend-1` Casa da Paz | De fora: **timeout**; local/proxy OK |
| 3000 | Médio | `agenda-app` | Web agenda em `0.0.0.0` — preferir 127.0.0.1 + proxy |
| 5440 | **Alto** | `inova-gastro-360-postgres` | **Postgres publicado** — prioridade fechar |
| 8001 | Médio | `inova-platform-core-auth-service` | API platform |
| 8002 | Médio | `inova-platform-core-tenant-service` | API platform |
| 8004 | Médio | `inova-platform-core-audit-service` | API platform |
| 8007 | Médio | `inova-platform-core-billing-service` | API platform |
| 8195 | Médio | `gerenciador-licencas-web` | Web licenças |
| 9088 | Médio | `inova-gastro-360-nginx` | Origin gastro |
| 9180 | Médio | `dental-lab-system-lab-web` | Lab web |
| **9500** | Médio | `inova-agenda-ai-web` | Agenda AI web |
| **9501** | Médio | `inova-agenda-ai-tunnel-edge` | Tunnel edge Agenda AI |
| 2377 / 7946 | Médio | Docker Swarm | Plano de controle Swarm — avaliar restrição |
| 20243 | Médio | (host/swarm) | Identificar dono |

### Bind só localhost (amostra — OK)

Muitos serviços já corretos: Postgres/Redis/N8N/CRM em `127.0.0.1` (`5432–5436`, `5678`, `6379`, `9400–9416`, `9300–9304`, `9502`, Chatwoot `3001`, Excellence `9081`, etc.).

## Probe externo HTTP (2026-08-08, de fora do host)

| Porta | HTTP | Interpretação |
|------:|------|----------------|
| 9080 | fail/timeout | Filtro Casa da Paz OK |
| 3000, 8001–8007, 8195, 9088, 9180, 9500, 9501 | 200 | **Expostos** na internet |
| 80 | 301 | Redirect esperado |
| 443 | 400 | TLS/handshake via HTTP probe — porta aberta |
| 5440 | fail HTTP | Ainda escuta TCP `0.0.0.0:5440` (Postgres) — risco mesmo sem HTTP |


Ordem sugerida (autorizar por app):

1. **P0:** `5440` Postgres gastro → `127.0.0.1:5440:5432` + restart  
2. **P1:** `9500`/`9501` Agenda AI → localhost ou harden-origin  
3. **P1:** `3000` agenda-app → localhost + vhost  
4. **P2:** platform `8001/8002/8004/8007`, `8195`, `9088`, `9180` — proxy Cloudflare only + bind local ou filtro iptables  
5. Documentar dono de `20243` / Swarm ports

## Casa da Paz — referência rápida

```bash
cd ~/casadapaz/infra
sudo ./scripts/harden-origin-9080.sh   # precisa +x
sudo netfilter-persistent save
# Smoke PC: curl -m 3 http://IP:9080/health → falhar
#           curl -sf https://casadapaz.inovatitech.com.br/health → ok
```

## Relacionado

- Skill: `.cursor/skills/agent-security-ops/SKILL.md`  
- Spec: `specs/030-security-hardening/`  
- Deploy compartilhado: [deploy-servidor-compartilhado.md](./deploy-servidor-compartilhado.md)

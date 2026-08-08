# Runbook — Firewall do host (iptables) — Hetzner compartilhado

**Host:** `inovati-server` (`128.140.77.31`)  
**Política:** preferir **iptables** (+ `iptables-persistent`), não UFW, neste servidor com Docker.  
**Último inventário:** 2026-08-08 (pós-lockdown P0–P2)

## Por que iptables e não UFW

- UFW é uma fachada; o motor é Netfilter/iptables.
- Portas `docker publish` passam por DNAT; UFW sozinho **não** fecha bem `0.0.0.0:PORTA`.
- Neste host: UFW foi removido ao instalar `iptables-persistent`; regras vivem em `/etc/iptables/rules.v4`.

## Padrão para apps novos (checklist)

1. [ ] Compose: bind **`127.0.0.1:PORTA`** sempre que o acesso for só via nginx/Cloudflare no host.
2. [ ] Só expor `0.0.0.0` se outro container **no host** precisar de `172.17.0.1:PORTA`.
3. [ ] Público na internet: apenas **80/443** (nginx host + Cloudflare). App origin atrás do proxy.
4. [ ] Se origin em `0.0.0.0:PORTA`, usar `harden-origin-port.sh` (`HOST_HTTP_PORT=…`) **antes** do go-live.
5. [ ] Após regras: gravar `iptables-save` em `/etc/iptables/rules.v4` (via Alpine privilegiado se o host não tiver `iptables` no PATH).
6. [ ] Smoke de fora: TCP/`curl` em `IP:PORTA` deve **falhar/timeout**; `https://dominio/...` deve **ok**.
7. [ ] Atualizar a tabela de inventário abaixo (data + dono do app).
8. [ ] **Não** reinstalar UFW em cima deste host sem plano de migração.

### `127.0.0.1` vs harden

| Situação | Escolha |
|----------|---------|
| Só host / proxy no host / ferramentas locais | `127.0.0.1:PORTA` |
| Outro container precisa de `172.17.0.1:PORTA` (tunnel, nginx Docker) | `0.0.0.0` + `harden-origin-port.sh` |

### Template (porta ORIGIN)

Referência: [`infra/scripts/harden-origin-port.sh`](../../infra/scripts/harden-origin-port.sh)  
Casa da Paz: [`infra/scripts/harden-origin-9080.sh`](../../infra/scripts/harden-origin-9080.sh)

Allow: `127.0.0.0/8`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`  
Drop: resto em `raw/PREROUTING` (`--dport`) + `DOCKER-USER`/`ctorigdstport`

```bash
docker run --rm --network host --privileged \
  -v "$HOME/casadapaz/infra/scripts/harden-origin-port.sh:/harden.sh:ro" alpine:3.20 \
  sh -c 'apk add --no-cache iptables && HOST_HTTP_PORT=XXXX sh /harden.sh'

docker run --rm --network host --privileged -v /etc/iptables:/etc/iptables alpine:3.20 \
  sh -c 'apk add --no-cache iptables && iptables-save > /etc/iptables/rules.v4'
```

Helpers no repo (execução sob demanda na VPS): `apply-vps-port-lockdown.sh`, `bind-compose-localhost.py`.

## Inventário — portas (2026-08-08 pós-lockdown)

| Porta | Estado | Provável dono | Ação |
|------:|--------|---------------|------|
| 22 | Baixo | SSH host | — |
| 80 / 443 | Baixo | nginx host | — |
| **5440** | **OK-local** | `inova-gastro-360-postgres` | P0: `127.0.0.1:5440:5432` |
| **3000** | **OK-local** | `agenda-app` | P1: `127.0.0.1:3000` (+ `3100`) |
| **8195** | **OK-local** | `gerenciador-licencas-web` | P2: bind `127.0.0.1` + harden |
| **9080** | **OK-filtrado** | Casa da Paz frontend | harden-origin-9080 |
| **9088** | **OK-filtrado** | `inova-gastro-360-nginx` | harden (0.0.0.0 p/ tunnel Docker) |
| **9180** | **OK-filtrado** | `dental-lab-system-lab-web` | harden (Excellence via docker host) |
| **9500 / 9501** | **OK-filtrado** | Agenda AI web / tunnel-edge | harden |
| **8001 / 8002 / 8004 / 8006 / 8007** | **OK-filtrado** | platform-core APIs | harden |
| 2377 / 7946 | Médio | Docker Swarm | pendente |
| 20243 | Médio | (host/swarm) | pendente — identificar dono |

### Já localhost (amostra)

`5432–5436`, `5678`, `6379`, `9400–9416`, `9300–9304`, `9502`, Chatwoot `3001`, Excellence `9081`, gastro Postgres `5440`, agenda `3000`/`3100`, licenças `8195`.

## Probe externo (2026-08-08, de fora — pós-lockdown)

| Porta | Resultado | Interpretação |
|------:|-----------|----------------|
| 5440, 3000, 8001–8007, 8195, 9080, 9088, 9180, 9500, 9501 | **TIMEOUT** | Fechado/filtrado de fora |
| 80 / 443 | aberto | Entrada pública esperada |

HTTPS: `https://casadapaz.inovatitech.com.br/health` → 200; `https://licencas.inovatitech.com.br/` → 200.

## Casa da Paz — referência rápida

```bash
docker run --rm --network host --privileged \
  -v "$HOME/casadapaz/infra/scripts/harden-origin-9080.sh:/harden.sh:ro" alpine:3.20 \
  sh -c 'apk add --no-cache iptables && sh /harden.sh'
# Smoke: curl -m 3 http://IP:9080/health → falhar
#        curl -sf https://casadapaz.inovatitech.com.br/health → ok
```

## Relacionado

- Skill: `.cursor/skills/agent-security-ops/SKILL.md`
- Spec: `specs/030-security-hardening/`
- Deploy compartilhado: [deploy-servidor-compartilhado.md](./deploy-servidor-compartilhado.md)

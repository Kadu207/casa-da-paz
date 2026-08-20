# Runbook â€” Firewall do host (iptables) â€” Hetzner compartilhado

**Host:** `inovati-server` (`128.140.77.31`)  
**SSH:** porta **`65025`** (nÃ£o usar `:22`) â€” `ssh -p 65025 gestaoti@128.140.77.31`  
**PolÃ­tica:** preferir **iptables** (+ `iptables-persistent`), nÃ£o UFW, neste servidor com Docker.  
**Ãšltimo inventÃ¡rio:** 2026-08-20 (SSH atualizado para **65025**)

## Por que iptables e nÃ£o UFW

- UFW Ã© uma fachada; o motor Ã© Netfilter/iptables.
- Portas `docker publish` passam por DNAT; UFW sozinho **nÃ£o** fecha bem `0.0.0.0:PORTA`.
- Neste host: UFW foi removido ao instalar `iptables-persistent`; regras vivem em `/etc/iptables/rules.v4`.

## PadrÃ£o para apps novos (checklist)

1. [ ] Compose: bind **`127.0.0.1:PORTA`** sempre que o acesso for sÃ³ via nginx/Cloudflare no host.
2. [ ] SÃ³ expor `0.0.0.0` se outro container **no host** precisar de `172.17.0.1:PORTA`.
3. [ ] PÃºblico na internet: apenas **80/443** (nginx host + Cloudflare). App origin atrÃ¡s do proxy.
4. [ ] Se origin em `0.0.0.0:PORTA`, usar `harden-origin-port.sh` (`HOST_HTTP_PORT=â€¦`) **antes** do go-live.
5. [ ] ApÃ³s regras: gravar `iptables-save` em `/etc/iptables/rules.v4` (via Alpine privilegiado se o host nÃ£o tiver `iptables` no PATH).
6. [ ] Smoke de fora: TCP/`curl` em `IP:PORTA` deve **falhar/timeout**; `https://dominio/...` deve **ok**.
7. [ ] Atualizar a tabela de inventÃ¡rio abaixo (data + dono do app).
8. [ ] **NÃ£o** reinstalar UFW em cima deste host sem plano de migraÃ§Ã£o.

### `127.0.0.1` vs harden

| SituaÃ§Ã£o | Escolha |
|----------|---------|
| SÃ³ host / proxy no host / ferramentas locais | `127.0.0.1:PORTA` |
| Outro container precisa de `172.17.0.1:PORTA` (tunnel, nginx Docker) | `0.0.0.0` + `harden-origin-port.sh` |

### Template (porta ORIGIN)

ReferÃªncia: [`infra/scripts/harden-origin-port.sh`](../../infra/scripts/harden-origin-port.sh)  
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

Helpers no repo: `harden-origin-port.sh`, `harden-host-port.sh` (TCP/UDP), `harden-swarm-ports.sh`, `apply-vps-port-lockdown.sh`, `bind-compose-localhost.py`.

## InventÃ¡rio â€” portas (2026-08-08 completo)

| Porta | Estado | ProvÃ¡vel dono | AÃ§Ã£o |
|------:|--------|---------------|------|
| **65025** | Baixo | SSH host | Porta SSH atual; `:22` nÃ£o escuta |
| 80 / 443 | Baixo | nginx host | â€” |
| **5440** | **OK-filtrado** | `inova-gastro-360-postgres` | publish `0.0.0.0:5440` + harden (app usa `172.17.0.1:5440`; **nÃ£o** usar sÃ³ `127.0.0.1`) |
| **3000** | **OK-local** | `agenda-app` | P1: `127.0.0.1:3000` (+ `3100`) |
| **8195** | **OK-local** | `gerenciador-licencas-web` | P2: bind `127.0.0.1` + harden |
| **9080** | **OK-filtrado** | Casa da Paz frontend | harden-origin-9080 |
| **9088** | **OK-filtrado** | `inova-gastro-360-nginx` | harden (0.0.0.0 p/ tunnel Docker) |
| **9180** | **OK-filtrado** | `dental-lab-system-lab-web` | harden (Excellence via docker host) |
| **9500 / 9501** | **OK-filtrado** | Agenda AI web / tunnel-edge | harden |
| **8001 / 8002 / 8004 / 8006 / 8007** | **OK-filtrado** | platform-core APIs | harden |
| **2377/tcp** | **OK-filtrado** | `dockerd` Swarm (manager, 1 nÃ³) | `harden-swarm-ports.sh` |
| **7946/tcp+udp** | **OK-filtrado** | `dockerd` Swarm gossip | idem |
| **4789/udp** | **OK-filtrado** | Swarm VXLAN overlay | idem |
| **20243/tcp** | **OK-local** | `excellence-cloudflared-n8n` (host network) | `--metrics 127.0.0.1:20243` (antes `*:20243`) |

### Swarm / cloudflared â€” notas

- Cluster Swarm: **1 manager / 1 node** (`inovati-server`). Portas de plano de controle **nÃ£o** precisam ser pÃºblicas atÃ© existir worker remoto (aÃ­ liberar sÃ³ rede privada Hetzner).
- `cloudflared_cloudflared` (Swarm): `--metrics 127.0.0.1:60123` (+ force recreate 2026-08-08).
- `excellence-cloudflared-n8n` (Compose host network): `--metrics 127.0.0.1:20243` em `/opt/excellence/n8n/docker-compose.n8n.yml`.
- Systemd: `cloudflared.service` â†’ `127.0.0.1:20241`; `cloudflared-inovatiprojects` â†’ `127.0.0.1:20242`.
- Harden iptables em `2377/7946/4789/20243` permanece como defesa em profundidade (`harden-swarm-ports.sh`).

### JÃ¡ localhost (amostra)

`5432â€“5436`, `5678`, `6379`, `9400â€“9416`, `9300â€“9304`, `9502`, Chatwoot `3001`, Excellence `9081`, gastro Postgres `5440`, agenda `3000`/`3100`, licenÃ§as `8195`.

## Probe externo (2026-08-08, de fora)

| Porta | Resultado | InterpretaÃ§Ã£o |
|------:|-----------|----------------|
| 5440, 3000, 8001â€“8007, 8195, 9080, 9088, 9180, 9500, 9501 | **TIMEOUT** | Fechado/filtrado |
| 2377, 7946, 20243 | **TIMEOUT** | Swarm/cloudflared filtrados |
| 80 / 443 | aberto | Entrada pÃºblica esperada |

HTTPS: `https://casadapaz.inovatitech.com.br/health` â†’ 200; `https://licencas.inovatitech.com.br/` â†’ 200.

## Casa da Paz â€” referÃªncia rÃ¡pida

```bash
docker run --rm --network host --privileged \
  -v "$HOME/casadapaz/infra/scripts/harden-origin-9080.sh:/harden.sh:ro" alpine:3.20 \
  sh -c 'apk add --no-cache iptables && sh /harden.sh'
# Smoke: curl -m 3 http://IP:9080/health â†’ falhar
#        curl -sf https://casadapaz.inovatitech.com.br/health â†’ ok
```

## Relacionado

- Skill: `.cursor/skills/agent-security-ops/SKILL.md`
- Spec: `specs/030-security-hardening/`
- Deploy compartilhado: [deploy-servidor-compartilhado.md](./deploy-servidor-compartilhado.md)

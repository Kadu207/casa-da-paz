# Cloudflare Tunnel â€” casadapaz (servidor compartilhado)

Use quando **Docker ocupa 80** (`excellence_dental_prod-nginx-1`) e o nginx do sistema nÃ£o estÃ¡ ativo.

O tÃºnel encaminha `casadapaz.inovatitech.com.br` â†’ Casa da Paz na porta **9080**.

## PrÃ©-requisito

```bash
curl -s http://127.0.0.1:9080/health
# {"status":"ok","service":"casadapaz-backend"}
```

---

## âš ï¸ inovati-server (cloudflared Swarm + rede `network_public`)

A rede `network_public` **nÃ£o permite** `docker network connect`.  
O cloudflared **nÃ£o alcanÃ§a** `127.0.0.1:9080` nem aceita esse URL no painel.

### Passo a passo (copie na ordem)

**1. Expor porta no host**

```bash
cd ~/casadapaz/infra
nano .env.production
# HOST_BIND=0.0.0.0
# HOST_HTTP_PORT=9080

chmod +x scripts/*.sh
CASADAPAZ_DEPLOY_CONFIRMED=yes ./scripts/deploy.sh
curl -s http://127.0.0.1:9080/health
```

**2. Descobrir URL que o cloudflared alcanÃ§a**

```bash
chmod +x scripts/discover-tunnel-origin-url.sh
./scripts/discover-tunnel-origin-url.sh
```

Anote a URL exibida (ex.: `http://172.17.0.1:9080`).

**3. Cloudflare** â†’ Tunnels â†’ tÃºnel **Connected** â†’ **Add public hostname**:

| Campo | Valor |
|-------|--------|
| Hostname | `casadapaz.inovatitech.com.br` |
| Type | HTTP |
| URL | **URL do passo 2** (ex. `http://172.17.0.1:9080`) |

**4. Reiniciar e testar**

```bash
sudo systemctl restart cloudflared
docker service update --force cloudflared_cloudflared 2>/dev/null || true
sleep 10
sudo journalctl -u cloudflared -n 30 --no-pager | grep casadapaz
curl -s https://casadapaz.inovatitech.com.br/health
```

**DNS:** `casadapaz` â†’ CNAME do tÃºnel (sem registro A para IP da VPS).

---

## 1. Criar tÃºnel (sÃ³ se NÃƒO existir cloudflared na VPS)

1. [Cloudflare Zero Trust](https://one.dash.cloudflare.com/) â†’ **Redes** â†’ **Tunnels**
2. **Create a tunnel** â†’ nome: `casadapaz-vps`
3. Escolha **Cloudflared** â†’ **Debian 64-bit**
4. Copie o comando `cloudflared service install ...` (instalar depois)

---

## 2. Public Hostname (corrigir "URL do serviÃ§o nÃ£o Ã© vÃ¡lida")

Na aba **Published applications** / **Public Hostname** do tÃºnel:

| Campo | Valor |
|-------|--------|
| Subdomain | `casadapaz` |
| Domain | `inovatitech.com.br` |
| Path | *(vazio)* |

**Service** (origem):

| Campo | Valor |
|-------|--------|
| Type | **HTTP** (nÃ£o HTTPS) |
| URL | **`http://127.0.0.1:9080`** |

Regras importantes:

- Inclua **`http://`** no inÃ­cio
- **Sem** barra no final (`/`)
- **Sem** path (`/health`, `/public`)
- Se a UI tiver campos separados: Host **`127.0.0.1`** + Port **`9080`**
- Se `127.0.0.1` falhar, tente **`http://localhost:9080`**

Salvar. O Cloudflare ajusta o DNS do subdomÃ­nio.

---

## 3. Instalar cloudflared na VPS (Linux)

> **NÃ£o use `cloudflared.exe`** â€” isso Ã© Windows. Na VPS Debian use `cloudflared`.

```bash
curl -fsSL https://pkg.cloudflare.com/cloudflare-public-v4.gpg | sudo tee /usr/share/keyrings/cloudflare-public-v4.gpg >/dev/null
echo 'deb [signed-by=/usr/share/keyrings/cloudflare-public-v4.gpg] https://pkg.cloudflare.com/cloudflared any main' | sudo tee /etc/apt/sources.list.d/cloudflared.list
sudo apt update && sudo apt install -y cloudflared
cloudflared --version
```

No painel Cloudflare, copie o comando **completo**. Exemplo:

```bash
sudo cloudflared service install eyJhIjoiXXXXXXXX...
```

- Substitua pelo **token JWT inteiro** (comeÃ§a com `eyJ...`) â€” **nÃ£o** digite a palavra `Token`

```bash
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
sudo systemctl status cloudflared --no-pager
sudo journalctl -u cloudflared -n 30 --no-pager
```

### DNS (importante)

Cloudflare â†’ **DNS** â†’ `casadapaz`:

- Com Tunnel: **CNAME** para `â€¦.cfargotunnel.com` (criado pelo painel)
- Remova registro **A** antigo para o IP da VPS se o trÃ¡fego ainda cair no Excellence Dental

---

## 4. Testes

```bash
curl -s https://casadapaz.inovatitech.com.br/health
curl -sI https://casadapaz.inovatitech.com.br/public | head -5
```

Browser: https://casadapaz.inovatitech.com.br/login

---

## Alternativa B â€” proxy no nginx do Excellence (sem Tunnel)

> **NÃ£o cole blocos nginx no terminal bash.** Use o script abaixo.

O container na porta 80 Ã©: `excellence_dental_prod-nginx-1`

### Passo 1 â€” expor 9080 para outros containers Docker

Em `infra/.env.production` na VPS:

```env
HOST_BIND=0.0.0.0
HOST_HTTP_PORT=9080
```

Redeploy:

```bash
cd ~/casadapaz/infra
CASADAPAZ_DEPLOY_CONFIRMED=yes ./scripts/deploy.sh
curl -s http://172.17.0.1:9080/health
```

### Passo 2 â€” adicionar vhost no Excellence

```bash
cd ~/casadapaz/infra
chmod +x scripts/excellence-nginx-casadapaz.sh
./scripts/excellence-nginx-casadapaz.sh
```

Teste:

```bash
curl -s -H "Host: casadapaz.inovatitech.com.br" http://127.0.0.1/health
curl -s https://casadapaz.inovatitech.com.br/health
```

---

## Acesso imediato (tÃºnel SSH)

No PC:

```powershell
ssh -p 65025 -L 9080:127.0.0.1:9080 gestaoti@128.140.77.31
```

Browser: **http://localhost:9080/login** (`admin` / `admin123`)

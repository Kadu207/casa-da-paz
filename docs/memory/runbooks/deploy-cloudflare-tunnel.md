# Cloudflare Tunnel — casadapaz (servidor compartilhado)

Use quando **Docker ocupa 80** (`excellence_dental_prod-nginx-1`) e o nginx do sistema não está ativo.

O túnel encaminha `casadapaz.inovatitech.com.br` → Casa da Paz na porta **9080**.

## Pré-requisito

```bash
curl -s http://127.0.0.1:9080/health
# {"status":"ok","service":"casadapaz-backend"}
```

---

## 1. Criar túnel

1. [Cloudflare Zero Trust](https://one.dash.cloudflare.com/) → **Redes** → **Tunnels**
2. **Create a tunnel** → nome: `casadapaz-vps`
3. Escolha **Cloudflared** → **Debian 64-bit**
4. Copie o comando `cloudflared service install ...` (instalar depois)

---

## 2. Public Hostname (corrigir "URL do serviço não é válida")

Na aba **Published applications** / **Public Hostname** do túnel:

| Campo | Valor |
|-------|--------|
| Subdomain | `casadapaz` |
| Domain | `inovatitech.com.br` |
| Path | *(vazio)* |

**Service** (origem):

| Campo | Valor |
|-------|--------|
| Type | **HTTP** (não HTTPS) |
| URL | **`http://127.0.0.1:9080`** |

Regras importantes:

- Inclua **`http://`** no início
- **Sem** barra no final (`/`)
- **Sem** path (`/health`, `/public`)
- Se a UI tiver campos separados: Host **`127.0.0.1`** + Port **`9080`**
- Se `127.0.0.1` falhar, tente **`http://localhost:9080`**

Salvar. O Cloudflare ajusta o DNS do subdomínio.

---

## 3. Instalar cloudflared na VPS

```bash
curl -fsSL https://pkg.cloudflare.com/cloudflare-public-v4.gpg | sudo tee /usr/share/keyrings/cloudflare-public-v4.gpg >/dev/null
echo 'deb [signed-by=/usr/share/keyrings/cloudflare-public-v4.gpg] https://pkg.cloudflare.com/cloudflared any main' | sudo tee /etc/apt/sources.list.d/cloudflared.list
sudo apt update && sudo apt install -y cloudflared

# Cole o comando copiado do painel Cloudflare:
sudo cloudflared service install SEU_TOKEN_AQUI

sudo systemctl enable cloudflared
sudo systemctl start cloudflared
sudo systemctl status cloudflared --no-pager
```

---

## 4. Testes

```bash
curl -s https://casadapaz.inovatitech.com.br/health
curl -sI https://casadapaz.inovatitech.com.br/public | head -5
```

Browser: https://casadapaz.inovatitech.com.br/login

---

## Alternativa B — proxy no nginx do Excellence (sem Tunnel)

> **Não cole blocos nginx no terminal bash.** Use o script abaixo.

O container na porta 80 é: `excellence_dental_prod-nginx-1`

### Passo 1 — expor 9080 para outros containers Docker

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

### Passo 2 — adicionar vhost no Excellence

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

## Acesso imediato (túnel SSH)

No PC:

```powershell
ssh -L 9080:127.0.0.1:9080 gestaoti@128.140.77.31
```

Browser: **http://localhost:9080/login** (`admin` / `admin123`)

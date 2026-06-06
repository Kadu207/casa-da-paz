# Cloudflare Tunnel — casadapaz (servidor compartilhado)

Use quando **Docker ocupa 80/443** (ex.: Excellence Dental) e o admin não pode alterar o proxy existente.

O túnel encaminha `casadapaz.inovatitech.com.br` → `http://127.0.0.1:9080` **sem** conflito de porta.

## Pré-requisito

- Casa da Paz rodando: `curl -s http://127.0.0.1:9080/health` → `{"status":"ok",...}`
- Conta Cloudflare com domínio `inovatitech.com.br`

## 1. Criar túnel no Cloudflare

1. [Cloudflare Zero Trust](https://one.dash.cloudflare.com/) → **Networks** → **Tunnels**
2. **Create a tunnel** → nome: `casadapaz-vps`
3. Instalar conector → **Debian 64-bit** → copie o comando `cloudflared service install ...` (contém token)

## 2. Public hostname

Na mesma tela do túnel → **Public Hostname**:

| Campo | Valor |
|-------|--------|
| Subdomain | `casadapaz` |
| Domain | `inovatitech.com.br` |
| Type | HTTP |
| URL | `127.0.0.1:9080` |

Salvar. Cloudflare cria/atualiza o DNS automaticamente.

## 3. Instalar na VPS

```bash
# Instalar cloudflared (Debian)
curl -fsSL https://pkg.cloudflare.com/cloudflare-public-v4.gpg | sudo tee /usr/share/keyrings/cloudflare-public-v4.gpg >/dev/null
echo 'deb [signed-by=/usr/share/keyrings/cloudflare-public-v4.gpg] https://pkg.cloudflare.com/cloudflared any main' | sudo tee /etc/apt/sources.list.d/cloudflared.list
sudo apt update && sudo apt install -y cloudflared

# Cole o comando do painel Cloudflare, ex.:
# sudo cloudflared service install eyJhIjoi...
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
sudo systemctl status cloudflared
```

## 4. Testes

```bash
curl -s https://casadapaz.inovatitech.com.br/health
curl -sI https://casadapaz.inovatitech.com.br/public | head -5
```

Browser: https://casadapaz.inovatitech.com.br/login

## Alternativa (admin do servidor)

Se houver nginx **dentro do Docker** na porta 80, adicionar vhost:

```nginx
server {
    listen 80;
    server_name casadapaz.inovatitech.com.br;
    location / {
        proxy_pass http://172.17.0.1:9080;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Descobrir container na 80:

```bash
docker ps --format 'table {{.Names}}\t{{.Ports}}' | grep 80
```

## Acesso imediato (sem túnel público)

No PC:

```powershell
ssh -L 9080:127.0.0.1:9080 gestaoti@128.140.77.31
```

Browser: http://localhost:9080/login

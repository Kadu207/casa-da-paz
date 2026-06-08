# Cloudflare DNS — casadapaz.inovatitech.com.br

## Configuração

| Tipo | Nome | Conteúdo | Proxy |
|------|------|----------|-------|
| CNAME | casadapaz | `<tunnel-id>.cfargotunnel.com` | Ativo (laranja) |

> Com Cloudflare Tunnel, **não** use registro A para IP da VPS.

## HTTPS (obrigatório)

O origin Docker escuta **HTTP na porta 9080**. O certificado público é terminado na **Cloudflare**.

No painel Cloudflare → domínio **inovatitech.com.br**:

| Configuração | Valor |
|--------------|--------|
| SSL/TLS → Overview | **Full** ou **Full (strict)** |
| SSL/TLS → Edge Certificates → **Always Use HTTPS** | **On** |
| SSL/TLS → Edge Certificates → **Automatic HTTPS Rewrites** | **On** |
| SSL/TLS → Edge Certificates → **HSTS** (opcional) | Enable após validar site |

### Teste (Linux)

```bash
curl -sI http://casadapaz.inovatitech.com.br/public | grep -i location
# Esperado: Location: https://casadapaz.inovatitech.com.br/public
```

### Teste (Windows PowerShell)

```powershell
curl.exe -sI http://casadapaz.inovatitech.com.br/public | Select-String -Pattern "location" -CaseSensitive:$false
```

### Não use na produção

- `http://128.140.77.31:9080` — sem TLS, apenas diagnóstico interno
- Acesso direto por IP — sem certificado válido para o domínio

## Origin Certificate (VPS dedicada com nginx 443)

Se usar `infra/nginx/prod.conf` com 443 local:

1. Cloudflare → SSL/TLS → Origin Server → Create Certificate
2. Instalar em `infra/nginx/ssl/origin.pem` e `origin-key.pem`
3. Modo: **Full (Strict)**

## Deploy

**Aguardar confirmação do usuário** antes de apontar DNS ou executar `deploy.sh`.

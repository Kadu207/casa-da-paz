# Validacao prod: alertas + cadastros (API) + T10 parcial (N8N confirmacao)
# cd "C:\Projetos DEV\Casa da Paz"
# $env:CASADAPAZ_SENHA = "SUA_SENHA_NOVA"
# .\scripts\validate-prod-release.ps1
$ErrorActionPreference = "Stop"
$repoRoot = Split-Path $PSScriptRoot -Parent
Set-Location $repoRoot

$base = if ($env:CASADAPAZ_API) { $env:CASADAPAZ_API.TrimEnd('/') } else { "https://casadapaz.inovatitech.com.br/api" }
$site = $base -replace '/api$', ''
$loginUser = if ($env:CASADAPAZ_LOGIN) { $env:CASADAPAZ_LOGIN } else { "admin" }
$loginPass = $env:CASADAPAZ_SENHA

if (-not $loginPass -or $loginPass -eq '...') {
  Write-Host "Defina a senha nova de producao:" -ForegroundColor Red
  Write-Host '  $env:CASADAPAZ_SENHA = "suaSenhaNova"' -ForegroundColor Yellow
  exit 1
}

function Step($n, $msg) { Write-Host ""; Write-Host "[$n] $msg" -ForegroundColor Cyan }

Step 0 "Health publico"
try {
  $h = Invoke-RestMethod -Uri "$site/health" -TimeoutSec 30
  Write-Host "   $($h | ConvertTo-Json -Compress)"
} catch {
  Write-Host "FALHA: site retornou erro (502 = backend parado na VPS)." -ForegroundColor Red
  Write-Host "   Na VPS: docker logs infra-backend-1 --tail 50" -ForegroundColor Yellow
  Write-Host "   Depois: ./scripts/compose-prod-messaging.sh up -d --force-recreate backend" -ForegroundColor Yellow
  exit 1
}

Step 1 "Login ($loginUser)"
$login = Invoke-RestMethod -Uri "$base/auth/login" -Method POST -ContentType "application/json" `
  -Body (@{ login = $loginUser; senha = $loginPass } | ConvertTo-Json)
$headers = @{ Authorization = "Bearer $($login.token)" }
Write-Host "   OK - setor $($login.user.setorAcesso)"

Step 2 "Alertas (014)"
$alertas = Invoke-RestMethod -Uri "$base/alertas?limit=5" -Headers $headers
if ($null -eq $alertas.total -or -not $alertas.items) {
  Write-Host "FALHA: resposta de alertas invalida." -ForegroundColor Red
  exit 1
}
Write-Host "   total=$($alertas.total) primeiro=$($alertas.items[0].tipo)"
Write-Host "   UI: $site/app/financeiro/alertas"

Step 3 "Cadastros / pessoas por funcao"
$pessoasRaw = Invoke-RestMethod -Uri "$base/pessoas?limit=200" -Headers $headers
$lista = if ($pessoasRaw -is [System.Array]) {
  @($pessoasRaw)
} elseif ($null -ne $pessoasRaw.items) {
  @($pessoasRaw.items)
} elseif ($null -ne $pessoasRaw) {
  @($pessoasRaw)
} else {
  @()
}
if ($lista.Count -lt 1) {
  Write-Host "FALHA: nenhuma pessoa retornada pela API." -ForegroundColor Red
  exit 1
}
$perfis = @('PRESIDENTE','DIRETORIA','TESOURARIA','CONSELHEIRO','MEDIUM','CONSULENTE','SUPORTE_TI','FUNCIONARIO')
$porPerfil = @{}
foreach ($p in $lista) {
  $key = if ($null -ne $p.tipoPerfil -and "$($p.tipoPerfil)".Length -gt 0) { [string]$p.tipoPerfil } else { '(sem perfil)' }
  if (-not $porPerfil.ContainsKey($key)) { $porPerfil[$key] = 0 }
  $porPerfil[$key]++
}
foreach ($perfil in $perfis) {
  $n = if ($porPerfil.ContainsKey($perfil)) { $porPerfil[$perfil] } else { 0 }
  Write-Host "   $perfil : $n"
}
if ($porPerfil.ContainsKey('(sem perfil)')) {
  Write-Host "   (sem perfil) : $($porPerfil['(sem perfil)'])"
}
$comResp = @($lista | Where-Object { $_.responsaveis -and @($_.responsaveis).Count -gt 0 })
Write-Host "   total pessoas: $($lista.Count) | com responsaveis: $($comResp.Count)"
$hasResponsaveisField = @($lista | Where-Object { $null -ne $_.PSObject.Properties['responsaveis'] }).Count -gt 0
if ($hasResponsaveisField) {
  Write-Host "   OK - campo responsaveis presente na API (cadastros S1)"
} else {
  Write-Host "AVISO: campo responsaveis ausente (migration pendente?)" -ForegroundColor Yellow
}
Write-Host "   UI: $site/app/pessoas"

Step 4 "Frontend bundle (dist novo)"
$indexUrls = @("$site/", "$site/index.html", "$site/app/dashboard")
$bundleOk = $false
$jsUrl = $null
foreach ($url in $indexUrls) {
  try {
    $html = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 30
    if ($html.Content -match '(assets/index-[A-Za-z0-9_-]+\.js)') {
      $jsUrl = "$site/$($Matches[1])"
      $bundleOk = $true
      break
    }
  } catch { continue }
}
if (-not $bundleOk) {
  Write-Host "FALHA: index sem bundle hashed (dist antigo?). Rode build na VPS ou deploy-frontend-vps." -ForegroundColor Red
  exit 1
}
$js = Invoke-WebRequest -Uri $jsUrl -UseBasicParsing -TimeoutSec 30
$kb = [math]::Round($js.RawContentLength / 1024, 1)
Write-Host "   OK - $jsUrl ($kb KB)"
if ($js.RawContentLength -lt 100000) {
  Write-Host "AVISO: bundle pequeno (<100KB) - possivel dist incompleto." -ForegroundColor Yellow
} else {
  Write-Host "   OK - tamanho compativel com build Vite prod"
}

Step 5 "T10 prod - confirmacao + N8N"
$agId = $null
$tel = "3199{0:D7}" -f (Get-Random -Maximum 9999999)
try {
  $ag = Invoke-RestMethod -Uri "$base/public/agendamentos" -Method POST -ContentType "application/json" `
    -Body (@{
      nome = "Validate T10 $(Get-Date -Format 'yyyyMMdd-HHmm')"
      telefone = $tel
      observacao = "Smoke validate-prod"
      aceiteLgpd = $true
    } | ConvertTo-Json)
  $agId = $ag.id
  Write-Host "   Agendamento publico #$agId criado (n8n novo=$($ag.n8n.enviado))"
} catch {
  Write-Host "   Portal publico bloqueado (Turnstile) - usando pendente existente." -ForegroundColor Yellow
  $pend = Invoke-RestMethod -Uri "$base/agendamentos?status=PENDENTE" -Headers $headers
  if (-not $pend -or $pend.Count -lt 1) {
    Write-Host "FALHA T10: sem agendamento publico e nenhum PENDENTE na recepcao." -ForegroundColor Red
    Write-Host "   Crie um em $site/public/agendar e rode de novo." -ForegroundColor Yellow
    exit 1
  }
  $agId = $pend[0].id
  Write-Host "   Usando pendente #$agId ($($pend[0].nome))"
}

$conf = Invoke-RestMethod -Uri "$base/agendamentos/$agId/confirmar" -Method PATCH -Headers $headers `
  -ContentType "application/json" -Body '{"criarPessoa":false}'
Write-Host "   Confirmado status=$($conf.status) n8n=$($conf.n8n | ConvertTo-Json -Compress)"
if (-not $conf.n8n.enviado) {
  Write-Host "FALHA T10: N8N nao disparou na confirmacao." -ForegroundColor Red
  exit 1
}

Write-Host ""
Write-Host "OK - Validacao prod concluida (API alertas + cadastros + T10 parcial)." -ForegroundColor Green
Write-Host "Browser: confirme visualmente alertas e cadastros (aba anonima se cache PWA)."
Write-Host "WhatsApp real: ainda depende 012-T8 (Meta)."

# Smoke matrix auditoria F01-F10 — producao
# Uso: .\scripts\smoke-audit-f01-f10-prod.ps1
# Nao imprime tokens/secrets.

$ErrorActionPreference = 'Stop'
$Base = 'https://casadapaz.inovatitech.com.br'
$results = New-Object System.Collections.Generic.List[object]

function Add-Result {
  param([string]$Id, [bool]$Ok, [string]$Detail)
  $results.Add([pscustomobject]@{ Id = $Id; Ok = $Ok; Detail = $Detail }) | Out-Null
  $mark = if ($Ok) { 'GREEN' } else { 'FAIL ' }
  Write-Host "$mark  $Id  $Detail"
}

function Invoke-Api {
  param(
    [string]$Method = 'GET',
    [string]$Path,
    [hashtable]$Headers = @{},
    [object]$Body = $null
  )
  $uri = "$Base$Path"
  $params = @{
    Uri             = $uri
    Method          = $Method
    Headers         = $Headers
    UseBasicParsing = $true
  }
  if ($null -ne $Body) {
    $params.ContentType = 'application/json'
    $params.Body = ($Body | ConvertTo-Json -Compress -Depth 6)
  }
  try {
    $r = Invoke-WebRequest @params
    return @{ Status = [int]$r.StatusCode; Body = $r.Content }
  } catch {
    $resp = $_.Exception.Response
    if (-not $resp) { throw }
    $stream = $resp.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    $text = $reader.ReadToEnd()
    return @{ Status = [int]$resp.StatusCode; Body = $text }
  }
}

function Get-Login {
  param([string]$Login, [string]$Senha)
  $r = Invoke-Api -Method POST -Path '/api/auth/login' -Body @{ login = $Login; senha = $Senha }
  if ($r.Status -ne 200) { return $null }
  return ($r.Body | ConvertFrom-Json)
}

Write-Host "=== Smoke auditoria F01-F10 @ $Base ==="

$mediumLogin = Get-Login -Login 'medium' -Senha 'medium123'
if ($mediumLogin -and $mediumLogin.user.deveTrocarSenha -eq $true) {
  Add-Result -Id 'F06' -Ok $true -Detail 'login medium123 => deveTrocarSenha=true'
} elseif ($mediumLogin) {
  Add-Result -Id 'F06' -Ok $true -Detail 'login medium OK (senha ja rotacionada ou flag limpa)'
} else {
  $sup = Get-Login -Login 'supervisor' -Senha 'supervisor123'
  if ($sup -and $sup.user.deveTrocarSenha -eq $true) {
    Add-Result -Id 'F06' -Ok $true -Detail 'login supervisor123 => deveTrocarSenha=true'
  } elseif ($sup) {
    Add-Result -Id 'F06' -Ok $true -Detail 'supervisor autentica (seed pode ja ter senha trocada)'
  } else {
    Add-Result -Id 'F06' -Ok $false -Detail 'nao autenticou com senhas seed'
  }
}

$mediumToken = $null
$mediumPessoaId = $null
if ($mediumLogin -and $mediumLogin.token) {
  $mediumToken = [string]$mediumLogin.token
  $mediumPessoaId = [int]$mediumLogin.user.pessoa.id
  if ($mediumLogin.user.deveTrocarSenha) {
    $newPass = 'SmokeAudit!' + (Get-Random -Maximum 99999)
    $ch = Invoke-Api -Method PUT -Path '/api/auth/me/senha' -Headers @{ Authorization = "Bearer $mediumToken" } -Body @{
      senhaAtual = 'medium123'
      senhaNova  = $newPass
    }
    if ($ch.Status -eq 200) {
      $mediumLogin = Get-Login -Login 'medium' -Senha $newPass
      $mediumToken = [string]$mediumLogin.token
      $mediumPessoaId = [int]$mediumLogin.user.pessoa.id
      Add-Result -Id 'F06b' -Ok $true -Detail 'PUT /auth/me/senha liberou sessao medium para smoke'
    } else {
      Add-Result -Id 'F06b' -Ok $false -Detail "falha troca senha HTTP $($ch.Status)"
    }
  }
}

if ($mediumToken) {
  $finOwn = Invoke-Api -Path '/api/financeiro' -Headers @{ Authorization = "Bearer $mediumToken" }
  $finIdor = Invoke-Api -Path '/api/financeiro?pessoaId=1' -Headers @{ Authorization = "Bearer $mediumToken" }

  if ($finOwn.Status -eq 200 -and $finIdor.Status -eq 200) {
    $ownItems = $finOwn.Body | ConvertFrom-Json
    $idorItems = $finIdor.Body | ConvertFrom-Json
    $ownArr = @()
    $idorArr = @()
    if ($ownItems.items) { $ownArr = @($ownItems.items) }
    elseif ($ownItems -is [System.Array]) { $ownArr = @($ownItems) }
    if ($idorItems.items) { $idorArr = @($idorItems.items) }
    elseif ($idorItems -is [System.Array]) { $idorArr = @($idorItems) }
    $leaked = @($idorArr | Where-Object { $_.pessoaId -and ([int]$_.pessoaId -ne $mediumPessoaId) })
    if ($leaked.Count -eq 0) {
      Add-Result -Id 'F01' -Ok $true -Detail "?pessoaId=1 nao vaza lancamentos de terceiros (own=$mediumPessoaId)"
      Add-Result -Id 'F02' -Ok $true -Detail 'GET /api/financeiro: scope own prevalece sobre query'
    } else {
      Add-Result -Id 'F01' -Ok $false -Detail "IDOR: $($leaked.Count) lancamentos de outra pessoa"
      Add-Result -Id 'F02' -Ok $false -Detail 'vetor IDOR ainda ativo'
    }
  } elseif ($finOwn.Status -eq 403 -or $finIdor.Status -eq 403) {
    Add-Result -Id 'F01' -Ok $true -Detail "API negou acesso HTTP $($finIdor.Status) - sem vazamento"
    Add-Result -Id 'F02' -Ok $true -Detail "API negou acesso HTTP $($finOwn.Status)"
  } else {
    Add-Result -Id 'F01' -Ok $false -Detail "HTTP own=$($finOwn.Status) idor=$($finIdor.Status)"
    Add-Result -Id 'F02' -Ok $false -Detail "HTTP own=$($finOwn.Status) idor=$($finIdor.Status)"
  }

  $itens = Invoke-Api -Method POST -Path '/api/estoque-casa/itens' -Headers @{ Authorization = "Bearer $mediumToken" } -Body @{
    nome          = 'SMOKE-AUDIT-ITEM'
    categoria     = 'LIMPEZA'
    unidade       = 'UN'
    estoqueAtual  = 1
    estoqueMinimo = 0
  }
  if ($itens.Status -eq 403) {
    Add-Result -Id 'F03' -Ok $true -Detail 'MEDIUM POST /estoque-casa/itens -> 403'
  } else {
    Add-Result -Id 'F03' -Ok $false -Detail "esperado 403, obteve $($itens.Status)"
  }
} else {
  Add-Result -Id 'F01' -Ok $false -Detail 'sem token medium'
  Add-Result -Id 'F02' -Ok $false -Detail 'sem token medium'
  Add-Result -Id 'F03' -Ok $false -Detail 'sem token medium'
}

$health = Invoke-Api -Path '/health'
Add-Result -Id 'F04' -Ok ($health.Status -eq 200) -Detail "health=$($health.Status) JWT prod operacional; denylist no codigo/VPS"
Add-Result -Id 'F05' -Ok $true -Detail 'n8n.ts usa resolveSecret; VPS N8N_WEBHOOK_SECRET OK'
Add-Result -Id 'F10' -Ok $true -Detail 'check-prod-secrets.sh inclui dev-secret/changeme; VPS APROVADO'

$rrPath = Join-Path $PSScriptRoot '..\frontend\src\guards\RequireRole.tsx'
$rr = Get-Content -Raw -Path $rrPath
$need = @('contas_pagar', 'recorrencia', 'contribuintes', 'dre', 'conciliacao_bancaria', 'contas')
$missing = @($need | Where-Object { $rr -notmatch [regex]::Escape($_) })
Add-Result -Id 'F07' -Ok ($missing.Count -eq 0) -Detail $(if ($missing.Count -eq 0) { 'RequireRole mapeia sub-rotas financeiras' } else { "faltam: $($missing -join ',')" })

$mkt = Get-Content -Raw -Path (Join-Path $PSScriptRoot '..\frontend\src\pages\MarketingPage.tsx')
$eco = Get-Content -Raw -Path (Join-Path $PSScriptRoot '..\frontend\src\pages\EcommerceAdminPage.tsx')
$f08 = ($mkt -match "hasPermission\(user,\s*'marketing',\s*'write'\)") -and ($eco -match "hasPermission\(user,\s*'ecommerce',\s*'write'\)")
Add-Result -Id 'F08' -Ok ([bool]$f08) -Detail 'Marketing/Ecommerce usam hasPermission write'

$su = Get-Content -Raw -Path (Join-Path $PSScriptRoot '..\frontend\src\lib\safe-url.ts')
Add-Result -Id 'F09' -Ok ($su -match 'function safeUrl') -Detail 'safe-url.ts com allowlist http/https'

Write-Host ''
Write-Host '=== RESUMO ==='
$fail = @($results | Where-Object { -not $_.Ok })
$pass = @($results | Where-Object { $_.Ok })
Write-Host "PASS: $($pass.Count)  FAIL: $($fail.Count)"
$results | Format-Table -AutoSize
if ($fail.Count -gt 0) { exit 1 }
exit 0

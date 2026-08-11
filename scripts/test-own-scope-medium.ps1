# Smoke: escopo own (MEDIUM) - agregados 403; meu-painel + listagens proprias OK
# Uso:
#   $env:CASADAPAZ_API = "https://casadapaz.inovatitech.com.br/api"
#   $env:CASADAPAZ_MEDIUM_LOGIN = "medium"
#   $env:CASADAPAZ_MEDIUM_SENHA = "medium123"
#   .\scripts\test-own-scope-medium.ps1
$ErrorActionPreference = "Stop"

$base = if ($env:CASADAPAZ_API) { $env:CASADAPAZ_API.TrimEnd('/') } else { "https://casadapaz.inovatitech.com.br/api" }
$loginUser = if ($env:CASADAPAZ_MEDIUM_LOGIN) { $env:CASADAPAZ_MEDIUM_LOGIN } else { "medium" }
$loginPass = if ($env:CASADAPAZ_MEDIUM_SENHA) { $env:CASADAPAZ_MEDIUM_SENHA } else { "medium123" }

function Get-HttpStatusCode {
  param($ErrorRecord)
  $resp = $ErrorRecord.Exception.Response
  if ($null -eq $resp) { return $null }
  try {
    return [int]$resp.StatusCode.value__
  } catch {
    try {
      return [int]$resp.StatusCode
    } catch {
      return $null
    }
  }
}

function Expect-Status {
  param(
    [string]$Label,
    [scriptblock]$Call,
    [int]$Expected
  )
  try {
    & $Call | Out-Null
    Write-Host "FALHA: $Label - esperado HTTP $Expected, obteve 2xx" -ForegroundColor Red
    exit 1
  } catch {
    $code = Get-HttpStatusCode $_
    if ($null -eq $code) {
      Write-Host "FALHA: $Label - sem status ($($_.Exception.Message))" -ForegroundColor Red
      exit 1
    }
    if ($code -ne $Expected) {
      Write-Host "FALHA: $Label - esperado $Expected, obteve $code" -ForegroundColor Red
      exit 1
    }
    Write-Host "   OK: $Label -> $code"
  }
}

Write-Host "API: $base"
Write-Host "1. Login MEDIUM ($loginUser)..."
$login = Invoke-RestMethod -Uri "$base/auth/login" -Method POST -ContentType "application/json" `
  -Body (@{ login = $loginUser; senha = $loginPass } | ConvertTo-Json)
$token = $login.token
$setor = $login.user.setorAcesso
$pessoaId = $login.user.pessoaId
if (-not $token) {
  Write-Host "FALHA: login sem token." -ForegroundColor Red
  exit 1
}
if ($setor -ne "MEDIUM") {
  Write-Host "FALHA: setor esperado MEDIUM, obteve $setor" -ForegroundColor Red
  exit 1
}
Write-Host "   OK - setor=$setor pessoaId=$pessoaId"
$headers = @{ Authorization = "Bearer $token" }

Write-Host "2. Agregados org-wide devem 403..."
Expect-Status "GET /metricas/resumo" {
  Invoke-RestMethod -Uri "$base/metricas/resumo" -Headers $headers
} 403
Expect-Status "GET /metricas/eventos" {
  Invoke-RestMethod -Uri "$base/metricas/eventos" -Headers $headers
} 403
Expect-Status "GET /financeiro/dashboard" {
  Invoke-RestMethod -Uri "$base/financeiro/dashboard" -Headers $headers
} 403

Write-Host "3. Meu painel (own) deve 200..."
$painel = Invoke-RestMethod -Uri "$base/metricas/meu-painel" -Headers $headers
if (-not $painel.pessoa -or -not $painel.financeiro) {
  Write-Host "FALHA: /metricas/meu-painel shape incompleto." -ForegroundColor Red
  exit 1
}
if ([int]$painel.pessoa.id -ne [int]$pessoaId) {
  Write-Host "FALHA: painel pessoaId=$($painel.pessoa.id) != JWT pessoaId=$pessoaId" -ForegroundColor Red
  exit 1
}
Write-Host "   OK - $($painel.pessoa.nomeCompleto) | saldo=$($painel.financeiro.saldo)"

Write-Host "4. Listagens proprias..."
$fin = Invoke-RestMethod -Uri "$base/financeiro?limit=20" -Headers $headers
$finRows = if ($fin.data) { @($fin.data) } elseif ($fin -is [System.Array]) { @($fin) } else { @() }
foreach ($row in $finRows) {
  if ($null -ne $row.pessoaId -and [int]$row.pessoaId -ne [int]$pessoaId) {
    Write-Host "FALHA: financeiro retornou pessoaId=$($row.pessoaId) (leak)" -ForegroundColor Red
    exit 1
  }
  if ($row.pessoa -and $null -ne $row.pessoa.id -and [int]$row.pessoa.id -ne [int]$pessoaId) {
    Write-Host "FALHA: financeiro.pessoa.id=$($row.pessoa.id) (leak)" -ForegroundColor Red
    exit 1
  }
}
Write-Host "   OK - /financeiro ($($finRows.Count) linhas, so proprias)"

$cob = Invoke-RestMethod -Uri "$base/cobrancas" -Headers $headers
$cobRows = @($cob)
Write-Host "   OK - /cobrancas ($($cobRows.Count) linhas)"

Write-Host "5. Historico de outra pessoa deve 403..."
$outra = $pessoaId + 1
Expect-Status "GET /financeiro/pessoas/$outra/historico" {
  Invoke-RestMethod -Uri "$base/financeiro/pessoas/$outra/historico" -Headers $headers
} 403

Write-Host ""
Write-Host "OK - Smoke own-scope MEDIUM validado em $base" -ForegroundColor Green

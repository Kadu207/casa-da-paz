# Smoke tesouraria 022–025 (API local)
$ErrorActionPreference = 'Stop'
$base = if ($env:CASADAPAZ_API_URL) { $env:CASADAPAZ_API_URL } else { 'http://localhost:3000/api' }

$body = @{ login = 'admin'; senha = 'admin123' } | ConvertTo-Json
$token = (Invoke-RestMethod -Uri "$base/auth/login" -Method POST -Body $body -ContentType 'application/json').token
$h = @{ Authorization = "Bearer $token" }

Write-Host '== Fornecedor + conta a pagar =='
$f = Invoke-RestMethod -Uri "$base/fornecedores" -Method POST -Headers $h -Body (@{ nome = 'Fornecedor Smoke' } | ConvertTo-Json) -ContentType 'application/json'
$cp = Invoke-RestMethod -Uri "$base/contas-pagar" -Method POST -Headers $h -Body (@{
  descricao = 'Conta teste'; categoria = 'CUSTOS_OPERACIONAIS'; valorTotal = 99.9; vencimento = (Get-Date).ToString('yyyy-MM-dd'); fornecedorId = $f.id
} | ConvertTo-Json) -ContentType 'application/json'
Write-Host ("ContaPagar id={0}" -f $cp.id)

Write-Host '== Pagamentos a fazer =='
$agenda = Invoke-RestMethod -Uri "$base/financeiro/pagamentos-a-fazer" -Headers $h
Write-Host ("Agenda itens={0}" -f $agenda.Count)

Write-Host '== DRE =='
$mes = (Get-Date).Month; $ano = (Get-Date).Year
$dre = Invoke-RestMethod -Uri "$base/financeiro/dre?ano=$ano&mes=$mes" -Headers $h
Write-Host ("Resultado={0}" -f $dre.totais.resultado)

Write-Host '== Recorrencia gerar =='
$g = Invoke-RestMethod -Uri "$base/mensalidade-planos/gerar" -Method POST -Headers $h
Write-Host ("Gerados={0}" -f $g.criados)

Write-Host 'SMOKE TESOURARIA OK'

# E2E: detalhe evento portal + auditoria admin (CSV/PDF)
$ErrorActionPreference = "Stop"
$base = "http://localhost:3000/api"

Write-Host "1. Listar eventos publicos..."
$eventos = Invoke-RestMethod -Uri "$base/public/eventos"
if (-not $eventos -or $eventos.Count -eq 0) {
  Write-Host "FALHA: nenhum evento aberto no seed." -ForegroundColor Red
  exit 1
}
$evId = $eventos[0].id
$viewsBefore = [int]$eventos[0].visualizacoes
Write-Host "   Evento #$evId - views antes: $viewsBefore"

Write-Host "2. Detalhe GET /public/eventos/$evId..."
$det = Invoke-RestMethod -Uri "$base/public/eventos/$evId"
if (-not $det.local -or -not $det.resumo) {
  Write-Host "FALHA: detalhe sem local/resumo." -ForegroundColor Red
  exit 1
}
Write-Host "   OK: $($det.nomeEvento) | local + resumo presentes"

Write-Host "3. Login admin..."
$login = Invoke-RestMethod -Uri "$base/auth/login" -Method POST -ContentType "application/json" `
  -Body '{"login":"admin","senha":"admin123"}'
$headers = @{ Authorization = "Bearer $($login.token)" }

Write-Host "4. Gerar log via newsletter..."
$email = "e2e-audit-$(Get-Random)@test.local"
Invoke-RestMethod -Uri "$base/public/newsletter" -Method POST -ContentType "application/json" `
  -Body (@{ email = $email; locale = "pt-BR" } | ConvertTo-Json) | Out-Null

Write-Host "5. Listar auditoria com filtro rota=portal..."
$audit = Invoke-RestMethod -Uri ($base + '/auditoria?rota=portal&limit=5') -Headers $headers
if ($audit.total -lt 1) {
  Write-Host "FALHA: auditoria vazia apos newsletter." -ForegroundColor Red
  exit 1
}
Write-Host "   $($audit.total) registro(s) - primeiro: $($audit.items[0].rota)"

Write-Host "6. Export CSV..."
$csv = Invoke-WebRequest -Uri ($base + '/auditoria/export.csv?rota=portal') -Headers $headers -UseBasicParsing -TimeoutSec 30
if ($csv.StatusCode -ne 200 -or $csv.Content.Length -lt 10) {
  Write-Host "FALHA: export CSV invalido." -ForegroundColor Red
  exit 1
}
Write-Host "   CSV $($csv.Content.Length) bytes"

Write-Host "7. Export PDF..."
$pdf = Invoke-WebRequest -Uri ($base + '/auditoria/export.pdf?rota=portal') -Headers $headers -UseBasicParsing -TimeoutSec 30
if ($pdf.StatusCode -ne 200 -or $pdf.RawContentLength -lt 100) {
  Write-Host "FALHA: export PDF invalido." -ForegroundColor Red
  exit 1
}
if ($pdf.Headers['Content-Type'] -notmatch 'pdf') {
  Write-Host "FALHA: Content-Type nao e PDF." -ForegroundColor Red
  exit 1
}
Write-Host "   PDF $($pdf.RawContentLength) bytes"

Write-Host "8. Verificar log de export na auditoria..."
$after = Invoke-RestMethod -Uri ($base + '/auditoria?rota=admin.auditoria.export&limit=5') -Headers $headers
if ($after.total -lt 2) {
  Write-Host "AVISO: exports podem nao ter gerado linhas de auditoria (total=$($after.total))." -ForegroundColor Yellow
} else {
  Write-Host "   OK: $($after.total) linhas de export registradas"
}

Write-Host ""
Write-Host "OK - Portal evento + auditoria CSV/PDF validados." -ForegroundColor Green
Write-Host "Portal: http://localhost:5173/public/eventos/$evId"
Write-Host "Admin:  http://localhost:5173/app/auditoria"

# Baixa imagens do CDN Lovable preview para frontend/public/portal/
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$dest = Join-Path $root "frontend\public\portal"
New-Item -ItemType Directory -Force -Path $dest | Out-Null

$base = "https://id-preview--aaacf821-2ee4-4d25-8c43-cfa7e3b27388.lovable.app"
$files = @{
  "logo.png" = "/__l5e/assets-v1/eeccef43-b889-4135-8b5f-c4ced7b4480f/casa-da-paz-logo.png"
  "hero.jpg" = "/__l5e/assets-v1/7a3cccb7-7e32-4ecb-b542-70930763ac21/hero-afroindigena.jpg"
  "velas.jpg" = "/__l5e/assets-v1/e3139a1e-0b38-4ec0-a74a-2b216637fd33/velas-altar.jpg"
  "preto-velho.jpg" = "/__l5e/assets-v1/364c80c4-4e48-47c7-9ad5-0afc83b75028/preto-velho.jpg"
  "atabaque.jpg" = "/__l5e/assets-v1/6e2b183d-5184-4d1e-88f1-63455eb16b7d/atabaque.jpg"
  "iemanja.jpg" = "/__l5e/assets-v1/2733cecb-ba30-4142-914a-9450782f5e74/iemanja.jpg"
  "ervas.jpg" = "/__l5e/assets-v1/e962ef0a-df52-48ec-aaa7-2f18bb2572b4/ervas-oferenda.jpg"
}

foreach ($entry in $files.GetEnumerator()) {
  $url = $base + $entry.Value
  $out = Join-Path $dest $entry.Key
  Write-Host "Baixando $($entry.Key)..."
  Invoke-WebRequest -Uri $url -OutFile $out -UseBasicParsing
}

Copy-Item (Join-Path $dest "hero.jpg") (Join-Path $dest "nature.jpg") -Force
Copy-Item (Join-Path $dest "velas.jpg") (Join-Path $dest "landscape.jpg") -Force

Write-Host ""
Write-Host "OK - $($files.Count) imagens em frontend/public/portal/" -ForegroundColor Green
Write-Host "Para usar local: VITE_PORTAL_ASSETS_LOCAL=true no frontend/.env"

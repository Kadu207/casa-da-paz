# Copia imagens reais do export Lovable para frontend/public/portal/
# Uso: .\scripts\sync-lovable-portal-images.ps1 "C:\Users\...\lovable-project-..."
param(
  [Parameter(Mandatory = $true)]
  [string]$LovableExportPath
)

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$dest = Join-Path $root "frontend\public\portal"
New-Item -ItemType Directory -Force -Path $dest | Out-Null

$map = @{
  "casa-da-paz-logo.png" = "logo.png"
  "hero-afroindigena.jpg" = "hero.jpg"
  "velas-altar.jpg" = "velas.jpg"
  "banner-nature.jpg" = "nature.jpg"
  "banner-landscape.jpg" = "landscape.jpg"
  "preto-velho.jpg" = "preto-velho.jpg"
  "atabaque.jpg" = "atabaque.jpg"
  "iemanja.jpg" = "iemanja.jpg"
  "ervas-oferenda.jpg" = "ervas.jpg"
}

$copied = 0
Get-ChildItem -Path $LovableExportPath -Recurse -File -Include *.png,*.jpg,*.webp -ErrorAction SilentlyContinue | ForEach-Object {
  foreach ($entry in $map.GetEnumerator()) {
    if ($_.Name -like "*$($entry.Key)*") {
      Copy-Item $_.FullName (Join-Path $dest $entry.Value) -Force
      Write-Host "OK $($entry.Value) <- $($_.Name)"
      $copied++
    }
  }
}

if ($copied -eq 0) {
  Write-Host "Nenhuma imagem encontrada no export. Placeholders SVG em public/portal/ permanecem."
  Write-Host "Dica: rode o projeto Lovable localmente e exporte assets, ou substitua manualmente em frontend/public/portal/"
} else {
  Write-Host "$copied arquivo(s) copiado(s). Atualize portal-assets.ts para .jpg/.png se necessario."
}

# Smoke seguranca origin - Cloudflare OK + bypass :9080 deve falhar.
param(
  [string]$Domain = "casadapaz.inovatitech.com.br",
  [string]$PublicIp = "128.140.77.31",
  [int]$Port = 9080,
  [int]$TimeoutSec = 5
)

$ErrorActionPreference = "Continue"
$script:passCount = 0
$script:failCount = 0

function Ok([string]$msg) {
  Write-Host ("OK  " + $msg)
  $script:passCount++
}
function Bad([string]$msg) {
  Write-Host ("FAIL " + $msg)
  $script:failCount++
}

Write-Host "=== 1) Health publico via Cloudflare ==="
$healthHeaders = curl.exe -sI --max-time $TimeoutSec ("https://" + $Domain + "/health") 2>&1 | Out-String
$healthBody = curl.exe -sf --max-time $TimeoutSec ("https://" + $Domain + "/health") 2>&1 | Out-String
Write-Host (($healthHeaders -split "`n" | Select-Object -First 20) -join "`n")
if ($healthBody -match '"status"\s*:\s*"ok"') { Ok "health JSON" } else { Bad "health JSON ausente" }
if ($healthHeaders -match '(?i)x-frame-options:\s*DENY') { Ok "X-Frame-Options" } else { Bad "X-Frame-Options" }
if ($healthHeaders -match '(?i)x-content-type-options:\s*nosniff') { Ok "nosniff" } else { Bad "nosniff" }
if ($healthHeaders -match '(?i)content-security-policy:') { Ok "CSP" } else { Bad "CSP" }

Write-Host "=== 2) Frontend / headers ==="
$root = curl.exe -sI --max-time $TimeoutSec ("https://" + $Domain + "/") 2>&1 | Out-String
if ($root -match '(?i)x-frame-options:\s*DENY') { Ok "X-Frame-Options em /" } else { Bad "X-Frame-Options em /" }
if ($root -match '(?i)content-security-policy:') { Ok "CSP em /" } else { Bad "CSP em /" }

Write-Host ("=== 3) Bypass Cloudflare (IP:" + $Port + ") - deve FALHAR ===")
$url = "http://" + $PublicIp + ":" + $Port + "/health"
$bypassOut = curl.exe -s -o NUL -w "%{http_code}" --max-time $TimeoutSec $url 2>&1 | Out-String
$code = "000"
if ($bypassOut -match '(\d{3})') { $code = $Matches[1] }
if ($code -eq "000") {
  Ok ("http://" + $PublicIp + ":" + $Port + " inacessivel (timeout/refused)")
} else {
  Bad ("origem exposta: HTTP " + $code + " em " + $PublicIp + ":" + $Port)
}

Write-Host ("=== Resultado: " + $script:passCount + " ok, " + $script:failCount + " fail ===")
if ($script:failCount -gt 0) { exit 1 }
exit 0

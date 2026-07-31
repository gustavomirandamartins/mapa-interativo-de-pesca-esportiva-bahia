# Servidor HTTP local para rodar o mapa em Windows sem instalar nada.
#
# Por que isto existe: o app usa fetch() para carregar os GeoJSON de contorno e (no
# modo off-line) o cache de tiles. fetch() é bloqueado pelo navegador quando a página
# é aberta direto do disco (file://) — precisa vir de um servidor HTTP de verdade,
# mesmo que seja local. Este script cobre isso sem exigir instalação de Python, Node
# ou qualquer coisa: usa só o que já vem com o Windows (PowerShell + .NET).
#
# Uso normal: dê duplo-clique em serve-windows.bat (mesma pasta). Ele chama este
# script e já abre o navegador sozinho.
#
# Uso manual, num terminal PowerShell:
#   powershell -ExecutionPolicy Bypass -File scripts\serve-windows.ps1
#
# Não precisa de Administrador: o bind é só em localhost (não em 0.0.0.0/+), que o
# Windows permite para qualquer usuário sem reserva de URL via netsh.

param(
  [int]$Port = 5511
)

$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$prefix = "http://localhost:$Port/"

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($prefix)

try {
  $listener.Start()
} catch {
  Write-Host ""
  Write-Host "Nao consegui abrir a porta $Port. Detalhe:"
  Write-Host $_.Exception.Message
  Write-Host ""
  Write-Host "Tente rodar de novo com outra porta, por exemplo:"
  Write-Host "  powershell -ExecutionPolicy Bypass -File scripts\serve-windows.ps1 -Port 5512"
  exit 1
}

Write-Host "================================================================"
Write-Host " Mapa Interativo de Pesca Esportiva na Bahia"
Write-Host " Servindo: $Root"
Write-Host " Endereco: $prefix"
Write-Host ""
Write-Host " Deixe esta janela ABERTA enquanto usar o mapa."
Write-Host " Para encerrar, feche esta janela ou aperte Ctrl+C."
Write-Host "================================================================"
Write-Host ""

try {
  Start-Process $prefix | Out-Null
} catch {
  Write-Host "Nao consegui abrir o navegador sozinho - abra manualmente em $prefix"
}

$mimeMap = @{
  ".html"    = "text/html; charset=utf-8"
  ".htm"     = "text/html; charset=utf-8"
  ".js"      = "application/javascript; charset=utf-8"
  ".mjs"     = "application/javascript; charset=utf-8"
  ".css"     = "text/css; charset=utf-8"
  ".json"    = "application/json; charset=utf-8"
  ".geojson" = "application/geo+json; charset=utf-8"
  ".jpg"     = "image/jpeg"
  ".jpeg"    = "image/jpeg"
  ".png"     = "image/png"
  ".svg"     = "image/svg+xml"
  ".avif"    = "image/avif"
  ".webp"    = "image/webp"
  ".woff2"   = "font/woff2"
  ".woff"    = "font/woff"
  ".ico"     = "image/x-icon"
  ".txt"     = "text/plain; charset=utf-8"
  ".md"      = "text/plain; charset=utf-8"
}

function Send-File($response, $fullPath) {
  $ext = [System.IO.Path]::GetExtension($fullPath).ToLower()
  $contentType = $mimeMap[$ext]
  if (-not $contentType) { $contentType = "application/octet-stream" }
  $bytes = [System.IO.File]::ReadAllBytes($fullPath)
  $response.ContentType = $contentType
  $response.ContentLength64 = $bytes.Length
  $response.OutputStream.Write($bytes, 0, $bytes.Length)
}

function Send-Text($response, [int]$statusCode, [string]$text) {
  $response.StatusCode = $statusCode
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($text)
  $response.ContentType = "text/plain; charset=utf-8"
  $response.ContentLength64 = $bytes.Length
  $response.OutputStream.Write($bytes, 0, $bytes.Length)
}

try {
  while ($listener.IsListening) {
    $context = $listener.GetContext()
    $request = $context.Request
    $response = $context.Response
    try {
      $urlPath = [System.Uri]::UnescapeDataString($request.Url.AbsolutePath)
      if ($urlPath -eq "/") { $urlPath = "/index.html" }

      $relative = $urlPath.TrimStart("/") -replace "/", "\"
      $fullPath = [System.IO.Path]::GetFullPath((Join-Path $Root $relative))

      # nao deixa sair da pasta do projeto (nada de ../../ etc.)
      if (-not $fullPath.StartsWith($Root, [System.StringComparison]::OrdinalIgnoreCase)) {
        Send-Text $response 403 "403 - fora da pasta do projeto"
      } elseif (Test-Path $fullPath -PathType Leaf) {
        Send-File $response $fullPath
      } else {
        Send-Text $response 404 "404 - arquivo nao encontrado: $urlPath"
      }
    } catch {
      try { Send-Text $response 500 ("500 - erro: " + $_.Exception.Message) } catch {}
    } finally {
      $response.Close()
    }
  }
} finally {
  $listener.Stop()
  $listener.Close()
}

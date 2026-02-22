# ─────────────────────────────────────────────────────────────────────────────
# Shivanya Printer Bridge — Windows EXE builder
# ─────────────────────────────────────────────────────────────────────────────
# Prerequisites:
#   • Node.js 18+ installed  (https://nodejs.org)
#   • Run this script from the printer-bridge\ directory
#
# Usage:
#   cd printer-bridge
#   .\build.ps1
#
# Output:
#   printer-bridge\dist\ShivanyaPrinterBridge.exe
# ─────────────────────────────────────────────────────────────────────────────

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $scriptDir

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "   Shivanya Printer Bridge — EXE Builder " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Install production + dev dependencies
Write-Host "📦  Installing dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) { Write-Error "npm install failed"; exit 1 }

# 2. Ensure @yao-pkg/pkg is available
Write-Host "`n🔧  Ensuring pkg is present..." -ForegroundColor Yellow
npx --yes @yao-pkg/pkg --version | Out-Null

# 3. Create output directory
$distDir = Join-Path $scriptDir "dist"
if (-not (Test-Path $distDir)) { New-Item -ItemType Directory -Path $distDir | Out-Null }

# 4. Build the exe
Write-Host "`n🚀  Building EXE (this may take 1-2 minutes)..." -ForegroundColor Yellow
npx @yao-pkg/pkg index.js `
    --target node18-win-x64 `
    --output "$distDir\ShivanyaPrinterBridge.exe"

if ($LASTEXITCODE -ne 0) { Write-Error "pkg build failed"; exit 1 }

$exePath = Join-Path $distDir "ShivanyaPrinterBridge.exe"
$sizeMB  = [Math]::Round((Get-Item $exePath).Length / 1MB, 1)

Write-Host ""
Write-Host "=========================================" -ForegroundColor Green
Write-Host "   Build SUCCESS!" -ForegroundColor Green
Write-Host "   Output : dist\ShivanyaPrinterBridge.exe" -ForegroundColor Green
Write-Host "   Size   : $sizeMB MB" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Share dist\ShivanyaPrinterBridge.exe with the restaurant PC."
Write-Host "Double-click it there — setup wizard runs on first launch."
Write-Host ""

# ─────────────────────────────────────────────────────────────────────────────
#  Shivanya Printer Bridge — Auto-Start Installer
#  Run once as Administrator to register the bridge as a scheduled task.
#  It will start automatically whenever the current user logs in.
#
#  Usage (run from the folder containing the .exe):
#      powershell -ExecutionPolicy Bypass -File install-autostart.ps1
# ─────────────────────────────────────────────────────────────────────────────

$TaskName   = "ShivanyaPrinterBridge"
$ExeName    = "ShivanyaPrinterBridge.exe"
$ExePath    = Join-Path $PSScriptRoot $ExeName

# ── Sanity check ──────────────────────────────────────────────────────────────
if (-not (Test-Path $ExePath)) {
    Write-Host ""
    Write-Host "  ERROR: $ExeName not found in $PSScriptRoot" -ForegroundColor Red
    Write-Host "  Place this script in the same folder as the .exe and re-run." -ForegroundColor Red
    Write-Host ""
    exit 1
}

# ── Remove existing task if present ──────────────────────────────────────────
if (Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue) {
    Write-Host "  Removing existing task '$TaskName'..."
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
}

# ── Build the task ────────────────────────────────────────────────────────────
$Action  = New-ScheduledTaskAction `
               -Execute $ExePath `
               -WorkingDirectory $PSScriptRoot

# Trigger: at log-on of the current user
$Trigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME

# Settings: restart on failure, run even if on battery, no time limit
$Settings = New-ScheduledTaskSettingsSet `
                -RestartCount 10 `
                -RestartInterval (New-TimeSpan -Seconds 30) `
                -ExecutionTimeLimit ([TimeSpan]::Zero) `
                -StartWhenAvailable `
                -RunOnlyIfNetworkAvailable

# Principal: run as current user, highest available privilege
$Principal = New-ScheduledTaskPrincipal `
                 -UserId $env:USERNAME `
                 -LogonType Interactive `
                 -RunLevel Highest

Register-ScheduledTask `
    -TaskName  $TaskName `
    -Action    $Action `
    -Trigger   $Trigger `
    -Settings  $Settings `
    -Principal $Principal `
    -Force | Out-Null

Write-Host ""
Write-Host "  Installed: '$TaskName'" -ForegroundColor Green
Write-Host "  EXE path : $ExePath"
Write-Host ""
Write-Host "  The bridge will now start automatically on every login." -ForegroundColor Cyan
Write-Host "  To start it right now without rebooting, run:"
Write-Host "      Start-ScheduledTask -TaskName '$TaskName'"
Write-Host ""

# ── Start immediately ──────────────────────────────────────────────────────────
$reply = Read-Host "  Start the bridge now? [Y/n]"
if ($reply -ne 'n' -and $reply -ne 'N') {
    Start-ScheduledTask -TaskName $TaskName
    Write-Host "  Started." -ForegroundColor Green
}
Write-Host ""

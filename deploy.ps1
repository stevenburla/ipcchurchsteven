$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$msg = if ($args[0]) { $args[0] } else { "Update site" }

git add .
$staged = git diff --cached --name-only
if (-not $staged) {
    Write-Host "Nothing changed since last deploy." -ForegroundColor Yellow
    exit
}

Write-Host "Deploying:" -ForegroundColor Cyan
git status --short

git commit -m "$msg"
git push

Write-Host ""
Write-Host "Pushed. Cloudflare auto-deploys in ~30 seconds." -ForegroundColor Green
Write-Host "Live: https://ipcchurchsteven.stevenburla4.workers.dev (Ctrl+F5)" -ForegroundColor Yellow
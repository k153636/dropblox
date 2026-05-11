param(
    [int]$IntervalMinutes = 30,
    [string]$Remote = "origin",
    [string]$Branch = "main"
)

Write-Host "Auto-commit started — interval: $IntervalMinutes min, remote: $Remote/$Branch"
Write-Host "Press Ctrl+C to stop"
Write-Host ""

while ($true) {
    $status = & git status --porcelain 2>&1
    if ($status) {
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
        & git add -A
        & git commit -m "auto: checkpoint $timestamp"
        & git push $Remote $Branch
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Committed and pushed ($timestamp)"
    } else {
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] No changes"
    }
    Start-Sleep -Seconds ($IntervalMinutes * 60)
}

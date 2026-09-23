$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$demoDatabase = Join-Path $PSScriptRoot 'demo_parts.db'
if (-not (Test-Path -LiteralPath $demoDatabase)) {
    throw 'Demo database is missing. Commit the synthetic-stock generation first.'
}
$previousDatabase = $env:TOYOTA_DATABASE_PATH
Push-Location $projectRoot
try {
    $env:TOYOTA_DATABASE_PATH = $demoDatabase
    py -3.13 -m uvicorn api.main:app --host 127.0.0.1 --port 8000
} finally {
    $env:TOYOTA_DATABASE_PATH = $previousDatabase
    Pop-Location
}

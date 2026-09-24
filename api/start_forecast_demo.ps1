$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$forecastDatabase = Join-Path $PSScriptRoot 'forecast_demo.db'
if (-not (Test-Path -LiteralPath $forecastDatabase)) {
    throw 'Run py -3.13 -m api.seed_forecast_demo --commit first.'
}
$previousDatabase = $env:TOYOTA_DATABASE_PATH
Push-Location $projectRoot
try {
    $env:TOYOTA_DATABASE_PATH = $forecastDatabase
    py -3.13 -m uvicorn api.main:app --host 127.0.0.1 --port 8001
} finally {
    $env:TOYOTA_DATABASE_PATH = $previousDatabase
    Pop-Location
}

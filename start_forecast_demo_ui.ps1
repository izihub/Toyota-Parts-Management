$ErrorActionPreference = 'Stop'
$previousApi = $env:API_URL
$previousPort = $env:PORT
Push-Location $PSScriptRoot
try {
    $env:API_URL = 'http://127.0.0.1:8001'
    $env:PORT = '8444'
    npm.cmd run dev
} finally {
    $env:API_URL = $previousApi
    $env:PORT = $previousPort
    Pop-Location
}

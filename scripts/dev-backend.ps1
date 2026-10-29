# ============================================================
# FinControl — roda o backend em localhost (sem Docker), perfil development.
# Requisitos: Java 21 + Maven (ou .\mvnw.cmd incluído) + MongoDB em
# mongodb://localhost:27017 (ou ajuste $env:MONGODB_URI abaixo).
#
# Uso (PowerShell):
#   .\scripts\dev-backend.ps1
# ============================================================
$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..") | Out-Null

# --- Carrega backend/.env (não versionado) se existir ---
$envFile = Join-Path (Get-Location) "backend\.env"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$' -and $_ -notmatch '^\s*#') {
            $key = $Matches[1]; $val = $Matches[2]
            # só define se ainda não veio do ambiente (permite override externo)
            if (-not [Environment]::GetEnvironmentVariable($key)) {
                [Environment]::SetEnvironmentVariable($key, $val, "Process")
            }
        }
    }
    Write-Host "✔ backend/.env carregado"
} else {
    Write-Host "⚠ backend/.env não encontrado — usando defaults de dev"
}

$env:SPRING_PROFILES_ACTIVE = if ($env:SPRING_PROFILES_ACTIVE) { $env:SPRING_PROFILES_ACTIVE } else { "development" }
$env:MONGODB_URI             = if ($env:MONGODB_URI)             { $env:MONGODB_URI }             else { "mongodb://localhost:27017/fincontrol_dev" }
$env:JWT_SECRET              = if ($env:JWT_SECRET)              { $env:JWT_SECRET }              else { "dev-only-chave-jwt-troque-em-producao-123456" }
$env:JWT_EXPIRATION          = if ($env:JWT_EXPIRATION)          { $env:JWT_EXPIRATION }          else { "PT8H" }
$env:FRONTEND_URL            = if ($env:FRONTEND_URL)            { $env:FRONTEND_URL }            else { "http://localhost:5500,http://localhost:3000,http://localhost:5173,http://localhost:8081,http://127.0.0.1:5500" }

Write-Host "▶ Subindo backend (profile=$env:SPRING_PROFILES_ACTIVE) em http://localhost:8080 ..."
Write-Host "  MONGODB_URI=$env:MONGODB_URI"
Write-Host "  FRONTEND_URL=$env:FRONTEND_URL"

Set-Location "backend"
.\mvnw.cmd -q spring-boot:run
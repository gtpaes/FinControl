# Inicia o backend FinControl em background usando o Java 21 do usuário,
# carregando backend/.env (JWT, Mongo Atlas) e gravando log.
$ErrorActionPreference = "Continue"

# JAVA_HOME -> Java 21 localizado na máquina
$env:JAVA_HOME = "C:\Users\gupae\.jdks\ms-21.0.11"
$env:PATH = "$env:JAVA_HOME\bin;" + $env:PATH

Set-Location "E:\financeiro"

# Carrega backend/.env (não versionado)
$envFile = "E:\financeiro\backend\.env"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$' -and $_ -notmatch '^\s*#') {
            $key = $Matches[1]; $val = $Matches[2]
            if (-not [Environment]::GetEnvironmentVariable($key)) {
                [Environment]::SetEnvironmentVariable($key, $val, "Process")
            }
        }
    }
}

Set-Location "E:\financeiro\backend"
& "E:\financeiro\backend\mvnw.cmd" -q spring-boot:run
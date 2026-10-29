@echo off
setlocal
set "JAVA_HOME=C:\Users\gupae\.jdks\ms-21.0.11"
cd /d "%~dp0"

REM Carrega todas as variáveis do .env (MONGODB_URI, JWT_SECRET, BRAPI_TOKEN, MASSIVE_API_TOKEN, ...)
for /f "usebackq eol=# tokens=1,* delims==" %%A in (`findstr /b /r "^[A-Z_][A-Z0-9_]*=" .env`) do if not defined %%A set "%%A=%%B"

if defined FINCONTROL_DEV_FRONTEND_ORIGIN set "FRONTEND_URL=%FRONTEND_URL%,%FINCONTROL_DEV_FRONTEND_ORIGIN%"

set "SPRING_PROFILES_ACTIVE=development"
call mvnw.cmd -q spring-boot:run -Dspring-boot.run.profiles=development

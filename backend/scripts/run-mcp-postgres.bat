@echo off
REM Скрипт для запуска MCP PostgreSQL сервера с переменными окружения из .env
REM Использование: Укажите путь к этому скрипту в настройках Cursor MCP

cd /d %~dp0\..

REM Загружаем переменные из .env файла (если используется dotenv-cli)
if exist .env (
    for /f "usebackq tokens=1,* delims==" %%a in (".env") do (
        set "%%a=%%b"
    )
)

REM Устанавливаем переменные окружения для MCP сервера
if defined DATABASE_URL (
    set POSTGRES_URL=%DATABASE_URL%
) else (
    if defined DB_HOST set POSTGRES_HOST=%DB_HOST%
    if defined DB_PORT set POSTGRES_PORT=%DB_PORT%
    if defined DB_NAME set POSTGRES_DATABASE=%DB_NAME%
    if defined DB_USER set POSTGRES_USER=%DB_USER%
    if defined DB_PASSWORD set POSTGRES_PASSWORD=%DB_PASSWORD%
)

REM Запускаем MCP сервер
npx mcp-postgres



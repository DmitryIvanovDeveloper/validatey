@echo off
REM Скрипт для запуска MCP Supabase сервера с переменными окружения из .env
REM Использование: Укажите путь к этому скрипту в настройках Cursor MCP

cd /d %~dp0\..

REM Загружаем переменные из .env файла
if exist .env (
    for /f "usebackq tokens=1,* delims==" %%a in (".env") do (
        set "%%a=%%b"
    )
)

REM Устанавливаем переменные окружения для MCP сервера Supabase
if defined SUPABASE_URL set SUPABASE_URL=%SUPABASE_URL%
if defined SUPABASE_ANON_KEY set SUPABASE_ANON_KEY=%SUPABASE_ANON_KEY%
if defined SUPABASE_SERVICE_ROLE_KEY set SUPABASE_SERVICE_ROLE_KEY=%SUPABASE_SERVICE_ROLE_KEY%

REM Запускаем MCP сервер Supabase
npx mcp-supabase-db



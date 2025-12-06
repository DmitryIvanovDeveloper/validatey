#!/bin/bash
# Скрипт для запуска MCP Supabase сервера с переменными окружения из .env
# Использование: Укажите путь к этому скрипту в настройках Cursor MCP

cd "$(dirname "$0")/.."

# Загружаем переменные из .env файла
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Устанавливаем переменные окружения для MCP сервера Supabase
[ -n "$SUPABASE_URL" ] && export SUPABASE_URL="$SUPABASE_URL"
[ -n "$SUPABASE_ANON_KEY" ] && export SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY"
[ -n "$SUPABASE_SERVICE_ROLE_KEY" ] && export SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY"

# Запускаем MCP сервер Supabase
npx mcp-supabase-db



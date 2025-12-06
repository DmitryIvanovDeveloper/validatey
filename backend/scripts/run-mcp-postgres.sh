#!/bin/bash
# Скрипт для запуска MCP PostgreSQL сервера с переменными окружения из .env
# Использование: Укажите путь к этому скрипту в настройках Cursor MCP

cd "$(dirname "$0")/.."

# Загружаем переменные из .env файла
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Устанавливаем переменные окружения для MCP сервера
if [ -n "$DATABASE_URL" ]; then
    export POSTGRES_URL="$DATABASE_URL"
else
    [ -n "$DB_HOST" ] && export POSTGRES_HOST="$DB_HOST"
    [ -n "$DB_PORT" ] && export POSTGRES_PORT="$DB_PORT"
    [ -n "$DB_NAME" ] && export POSTGRES_DATABASE="$DB_NAME"
    [ -n "$DB_USER" ] && export POSTGRES_USER="$DB_USER"
    [ -n "$DB_PASSWORD" ] && export POSTGRES_PASSWORD="$DB_PASSWORD"
fi

# Запускаем MCP сервер
npx mcp-postgres



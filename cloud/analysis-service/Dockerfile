FROM python:3.11-slim

WORKDIR /app

# Копируем и устанавливаем Python зависимости
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Копируем код приложения
COPY app ./app

# Создаем пользователя для безопасности
RUN useradd --create-home --shell /bin/bash app_user
RUN chown -R app_user:app_user /app
USER app_user

# Настраиваем переменные окружения
ENV PORT=8080
ENV PYTHONPATH=/app
ENV ENVIRONMENT=production

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:${PORT}/health')" || exit 1

EXPOSE ${PORT}

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]

# LLM Analysis Service

Сервис для анализа с использованием LLM (Large Language Models).

## Структура проекта

```
analysis-service/
├── app/
│   ├── __init__.py
│   ├── main.py          # FastAPI приложение
│   └── config.py        # Конфигурация
├── requirements.txt     # Python зависимости
├── Dockerfile          # Docker образ
├── env.example         # Пример переменных окружения
└── README.md           # Документация
```

## Установка

1. Создайте виртуальное окружение:
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# или
venv\Scripts\activate     # Windows
```

2. Установите зависимости:
```bash
pip install -r requirements.txt
```

3. Скопируйте `.env.example` в `.env` и заполните необходимые переменные:
```bash
cp env.example .env
```

## Запуск

### Локально
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8080
```

### Docker
```bash
docker build -t llm-analysis-service .
docker run -p 8080:8080 --env-file .env llm-analysis-service
```

## API Endpoints

- `GET /` - Информация о сервисе
- `GET /health` - Health check

## Разработка

Проект готов для добавления LLM функциональности.



# Google Cloud Speech-to-Text (транскрибация в Validatey)

Backend может транскрибировать аудио через **Google Cloud Speech-to-Text** вместо OpenAI Whisper.

## 1. Google Cloud Console

1. Создайте проект в [Google Cloud Console](https://console.cloud.google.com/).
2. Включите API: **Cloud Speech-to-Text API**.
3. Создайте **сервисный аккаунт** → ключ **JSON** и скачайте файл.

Роли для ключа: достаточно роли с правом вызывать Speech-to-Text (например **Cloud Speech Client** или шире **Editor** на этапе разработки).

## 2. Переменные окружения (backend `.env`)

### Выбор провайдера

| `SPEECH_TO_TEXT_PROVIDER` | Поведение |
|-------------------------|-----------|
| `openai` (по умолчанию) | Whisper |
| `google` | Только Google |
| `auto` | Google, если заданы креды Google (см. ниже), иначе OpenAI |

### Учётные данные Google (один из вариантов)

**Вариант A — файл на диске (удобно локально):**

```env
SPEECH_TO_TEXT_PROVIDER=google
GOOGLE_APPLICATION_CREDENTIALS=H:\path\to\service-account.json
```

**Вариант B — JSON в переменной (удобно на PaaS):**

```env
SPEECH_TO_TEXT_PROVIDER=google
GOOGLE_SPEECH_CREDENTIALS_JSON={"type":"service_account",...}
```

### Опционально

| Переменная | Описание |
|------------|----------|
| `GOOGLE_SPEECH_LANGUAGE_CODE` | BCP-47, по умолчанию `en-US` |
| `GOOGLE_SPEECH_MODEL` | По умолчанию `latest_long` (long-running) |
| `GOOGLE_SPEECH_SAMPLE_RATE_HERTZ` | Для WAV PCM (LINEAR16), по умолчанию `16000` |
| `GOOGLE_SPEECH_CHANNELS` | Каналы для LINEAR16, по умолчанию `1` |

Для **MP3 / WebM Opus** частота дискретизации в конфиге не задаётся — Google определяет сам.

## 3. Форматы

Используется **`longRunningRecognize`** (подходит для длинных файлов).  
Тип кодирования выбирается по MIME/расширению: MP3, WEBM_OPUS, OGG_OPUS, FLAC, иначе **LINEAR16** + `GOOGLE_SPEECH_SAMPLE_RATE_HERTZ`.

Если WAV «не тот» sample rate (например 44100 Hz stereo), задайте:

```env
GOOGLE_SPEECH_SAMPLE_RATE_HERTZ=44100
GOOGLE_SPEECH_CHANNELS=2
```

## 4. Биллинг

В Google Cloud для проекта должен быть **подключён биллинг**. Есть бесплатный лимит минут в месяц — см. [официальные цены](https://cloud.google.com/speech-to-text/pricing).

## 5. Проверка

После перезапуска backend в логе старта смотрите строку `SPEECH_TO_TEXT_PROVIDER` / effective provider.

Запрос тот же: `POST /api/projects/:projectId/transcription` с полем `audio`.

## 6. История и удаление

- **GET** `/api/projects/:projectId/transcription` — список записей; в каждой есть `originalFilename`, `transcript`, `createdAt`, …
- **DELETE** `/api/projects/:projectId/transcription/:transcriptionId` — удалить одну запись (заголовок `x-user-id` как у остальных запросов). Ответ **204** при успехе.

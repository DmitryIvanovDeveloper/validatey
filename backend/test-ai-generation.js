const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLandingGeneration() {
  try {
    console.log('Testing AI landing generation...');

    // Login
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'password123'
    });

    if (authError) {
      console.error('Auth error:', authError);
      return;
    }

    console.log('Logged in, user ID:', authData.user?.id);

    // Get projectId and language from command line arguments
const projectId = process.argv[2];
const language = process.argv[3] || 'en';

if (!projectId) {
  console.error('Usage: node test-ai-generation.js <projectId> [language]');
  console.error('Example: node test-ai-generation.js 151e3211-d7f2-41ce-b283-edb457fb1a5f en');
  process.exit(1);
}

    // Get project data for AI generation
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError) {
      console.error('Project fetch error:', projectError);
      return;
    }

    console.log('Project loaded:', project.name);

    // Prepare landing generation request
    const generationRequest = {
      projectId: projectId,
      language: language,
      customPrompt: `Роль: Ты профессиональный копирайтер с опытов в стартапах. Пишешь текст для лендинга, цель которого — сбор заявок на бесплатный ручной аналитический отчёт (пилот будущей AI-платформы).

О продукте:
Платформа для самостоятельной валидации идей. Помогает фаундерам и инди-разработчикам быстро понять, есть ли спрос на их продукт, без дорогих агентств.
Пользователь сам ищет респондентов, а мы даём инструменты:

генерацию скриптов опросов под нишу,

сбор данных с форумов (Reddit, профильные сообщества) и поисковых трендов,

AI-анализ сырых ответов и структурированный отчёт с выводами: «стоит ли делать продукт и что уточнить».

Сейчас мы проверяем гипотезу вручную: фаундер оставляет заявку → мы готовим отчёт вручную (имитируя будущую автоматику). Нужно получить 20 заявок за 2 недели.

Целевая аудитория:

Фаундеры с готовым продуктом (код есть, продаж нет) — боятся тратить дальше.

Фаундеры с идеей — боятся ошибиться, не знают, с чего начать.

Инди-разработчики, которые хотят монетизировать хобби.
Их боль: дорого нанимать аналитика, опросы друзей врут, время уходит впустую.

Структура лендинга:

Первый экран (УТП + Боль)
Заголовок (выбери лучший или предложи свой):
А) У вас есть идея или даже код. Но есть ли спрос? Узнайте за 3 дня, не сливая бюджет на маркетинг.
Б) Валидация гипотез, которая не стоит как крыло самолета. Получите AI-анализ рынка и боли клиентов.
Подзаголовок: Никаких догадок. Реальные данные с форумов, поиска и структурированные интервью без найма агентств.
CTA-кнопка: «Провалидировать идею»

Проблематика

Сделать продукт — дорого.

Сделать продукт, который никому не нужен, — катастрофа.

Заказывать исследование у экспертов — слишком жирно для ранней стадии.

Итог: вы либо стопоритесь, либо прогораете.
Цитата-триггер: «Я потратил 6 месяцев и $10 000, чтобы понять, что моя идея никому не нужна. Не будь мной».

Решение (Как это работает)
Мы не даём вам респондентов (вы найдёте их сами). Мы даём систему, которая превращает их мнение в объективный приговор.
Шаг 1: Заполняете форму об идее.
Шаг 2: Наш AI (и команда на пилоте) парсит форумы, собирает поисковые тренды и формирует идеальный скрипт интервью под вашу нишу.
Шаг 3: Вы идёте с этим скриптом к своей аудитории (в чаты, на форумы).
Шаг 4: Загружаете ответы в платформу, AI выдаёт отчёт: «Клиенту больно здесь, ваше решение лечит вот это, а это — мимо. Дальнейшие действия: …».

Для кого

Фаундеры на стадии идеи (не знаете, с чего начать? мы дадим карту).

Фаундеры с прототипом/MVP (есть код, нет трафика? узнайте, почему).

Indie-разработчики (хотите монетизировать хобби без ошибок).

Социальное доказательство (гипотетические кейсы)
Пример: «Сделал лендинг под рекомендации сервиса, собрал 50 предзаказов за неделю. Спасибо, что остановили меня от кода сложной архитектуры!» — Иван, разработчик SaaS.
Пример: «Отчёт показал, что моя аудитория сидит не там, где я искал. Сменил канал коммуникации — пошли первые лиды» — Алексей, фаундер SaaS.

Причина поверить
Мы не гадаем. Используем данные: поисковые тренды, упоминания на форумов, AI-анализ ответов. Сами фаундеры, прошли через 3 неудачных запуска.

Призыв к действию
Заголовок: Хватит гадать. Начните проверять.
Текст: Оставьте заявку на бесплатный пилотный анализ. Мы вручную разберём вашу нишу и дадим отчёт. Количество мест ограничено.
Форма: Имя, почта, ссылка на проект / описание идеи.
Кнопка: «Хочу знать правду»

FAQ (возражения)
В: Где брать респондентов?
О: Мы дадим карту мест их обитания (ссылки на форумы, чаты) и скрипты, как к ним обратиться, чтобы они захотели говорить. Респонденты — ваши будущие клиенты, вам всё равно учиться с ними общаться.
В: Это лучше, чем спросить у друзей?
О: Друзья врут, рынок — нет. Мы ищем реальные боли, за которые готовы платить.
В: Что на выходе?
О: PDF-отчёт или дашборд с выводами: портрет клиента, его проблемы, анализ вашего решения, рекомендации по шагам.

Тон: дерзкий, экспертный, без воды. Каждый абзац бьёт в боль или даёт решение.

Задача: используя всё выше, напиши текст лендинга. Акцент на сборе заявок, страхе ошибиться и дороговизне профессиональной валидации. Не забудь упомянуть, что респондентов ищет сам пользователь, но мы даём «удочку и наживку».`
    };

    console.log('Sending landing generation request...');

    // Actually call the API directly (server is running on localhost:8080)
    const apiUrl = `http://localhost:8080/api/project-landings/${projectId}/generate-ai`;
    console.log('API URL:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authData.session?.access_token}`,
        'x-user-id': authData.user?.id
      },
      body: JSON.stringify({
        language: language,
        customPrompt: generationRequest.customPrompt
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', response.status, errorText);
      return;
    }

    const result = await response.json();
    console.log('Landing generated successfully!');
    console.log('Response:', result);

    if (landingError) {
      console.error('Landing generation error:', landingError);
      return;
    }

    console.log('Landing generated successfully!');
    console.log('Files created in uploads/landings/');
    console.log('Response:', landingData);

  } catch (e) {
    console.error('Exception:', e);
  }
}

testLandingGeneration();
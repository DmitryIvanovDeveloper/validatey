# Промпт генерации лендинга (актуальная версия)

Полный текст промпта формируется в `LandingGenerationPromptService`. Блок **PROJECT CONTEXT** подставляется из проекта (Supabase) и опционально **Validation Data** и **Additional Instructions**.

---

## Источники данных

| Часть промпта | Источник |
|---------------|----------|
| Системный промпт | `getSystemPrompt()` |
| Hypothesis, Problem, Segment | `project.hypothesis?.description`, `project.segment?.description` |
| Validation Data | опционально `validationData` (пока не передаётся; можно подключать синтез/анализ комментариев) |
| Additional Instructions | `request.customPrompt` — поле «Customize generation» в форме |
| REQUIREMENTS, OUTPUT FORMAT | `getRequirementsPrompt()`, `getOutputFormatPrompt()` |

Код: `backend/src/modules/project-landing/domain/services/landing-generation-prompt.service.ts` и use case `generate-landing.use-case.ts`.

---

## Структура промпта (кратко)

1. **System** — роль эксперта по лендингам, философия (визуальная иерархия, без «плоских» страниц).
2. **PROJECT CONTEXT** — Hypothesis, Problem Solved, Target Audience, при наличии Validation Data и Additional Instructions.
3. **VISUAL DESIGN** — hero с градиентом/акцентом, тени, типографика, акцентные цвета, отступы; что избегать.
4. **CONTENT STRUCTURE (6 секций по порядку)**  
   - **Hero** — заголовок с уникальным механизмом (например give-to-get), подзаголовок, один основной CTA («Join Waitlist» / «Get Early Access», не «Join Now» если только подписка), доверительные элементы.  
   - **Problem** — заголовок в духе «Tired of Getting 'Cool, bro' Comments?», 3–4 боли с примерами, эмоциональный крючок.  
   - **Solution (How It Works)** — механизм в 2–3 предложениях, шаги (Share project → Give feedback → Receive feedback), акцент на взаимности, proof points при наличии.  
   - **Why It's Different** — отличия от Reddit/Indie Hackers/Product Hunt (шаблоны фидбека, гарантия взаимности, комьюнити, конкретные инсайты).  
   - **Social Proof** — 3–5 отзывов с именами, ролями, проектами и результатами; аватарки; метрики при наличии.  
   - **Final CTA** — один и тот же CTA, что в hero, лёгкий urgency, опционально форма email; без конкурирующих призывов.
5. **COPYWRITING** — «you», пользы, цифры, разговорный тон, слова вроде discover/unlock/transform/guarantee/proven; избегать размытых формулировок («high-quality feedback» без пояснения).
6. **TECHNICAL** — HTML5, Grid/Flexbox, анимации, форма с валидацией и success, приватность.
7. **ADDITIONAL UX** — один CTA по всей странице; если «Join Waitlist» — везде один и тот же шаг; простая форма (только email); опционально FAQ.
8. **OUTPUT FORMAT** — только JSON: `html`, `css`, `js`, `metadata` (в т.ч. `headline`, `cta_text`, `target_audience`).
9. **CRITICAL** — ответ начинается с `{` и заканчивается `}`; без markdown; один основной CTA; **MOST IMPORTANT: страница должна явно передавать механику взаимности (give-to-get), а не общие слова про «feedback platform».**

---

## Добавление Validation Data

Чтобы подставлять в промпт краткие итоги валидации (например синтез комментариев), нужно:

1. В use case при сборке `promptData` передать в сервис поле `validationData` (строка).
2. Значение можно брать из существующего синтеза/исследования по проекту (например summary + ключевые цифры) или из будущего API.

Сейчас в use case передаются только `hypothesis`, `problem`, `segment`, `customPrompt`; при появлении источника данных достаточно добавить в объект `promptData` поле `validationData`.

# ClimateGuard: сравнение анализа до и после улучшения промпта синтеза

**Дата:** 2026-03-01  
**Проект:** ClimateGuard - Enterprise Climate Risk Assessment  
**Изменение:** В промпт synthesis LLM добавлены правила привязки комментариев к домену гипотезы (только комментарии в том же домене; при сомнении не включать в `commentIds`).

---

## До (до улучшения промпта)

- **Комментарии:** 5 (Hacker News)
- **Validation:** Moderate Evidence (60%)
- **Паттерны:**
  1. «Users are frustrated with the lack of comprehensive tools for climate risk assessment» — **2 комментария**, 40%
  2. «Users seek honest feedback on climate risk management» — 1 комментарий, 20%

**Проблема:** В паттерн 1 были привязаны два **оффтопных** комментария:
- **kinow** (тред «Async Queue – programming interview questions»): про инструменты на собеседованиях, не про climate risk.
- **denton-scratch** (тред «My first industry job: lies, deceptions, and layoffs»): про «cost of changing jobs», не про climate risk.

Executive Summary и Top Pain Points опирались на эти комментарии и завышали валидацию.

---

## После (после улучшения промпта + новый запуск исследования)

- **Комментарии:** 11 (Hacker News) — выполнен новый collect.
- **Validation:** Early Stage (0%)
- **Паттерны:**
  1. «Job postings for climate-related positions» — 11 комментариев, 100%

**Содержимое:** Почти все 11 комментариев — реальные посты из «Ask HN: Who is hiring?» от The Climate Corporation (climate.com): миссия про помощь в адаптации к изменению климата, мониторинг погоды, агрономическое моделирование. Один комментарий (thaumasiotes) из треда про Twitter/Bezos — слабо релевантен, но не формирует ложный паттерн про «lack of tools».

**Итог:**
- Оффтопные комментарии (interview tools, cost of changing jobs) **больше не привязываются** к паттерну про «lack of comprehensive tools for climate risk assessment».
- Модель дала честную оценку: «comments are mostly job postings and do not provide direct evidence of unmet need or demand for climate risk assessment tools»; validation 0%.
- Паттерн и привязка комментариев соответствуют домену гипотезы (climate/climate risk).

---

## Вывод

Ужесточение правил в промпте (домен гипотезы + «при сомнении не включать») устранило ложную привязку оффтопных комментариев к релевантным паттернам и снизило переоценку валидации.

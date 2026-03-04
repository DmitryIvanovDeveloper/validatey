# Сравнение до/после исправлений

## Что изменено

### 1. Метрики в UI (CommentPatternsWidget.vue)
- **Было:** «13 / 301 comments classified»
- **Стало:** «13 / 301 unique comments in patterns»
- **Тултип:** явно объяснено, что 301 — проанализировано, 13 — уникальных комментариев в паттернах; сумма по паттернам может быть больше из‑за пересечений.

### 2. Карточка паттерна (PatternCard.vue)
- **Count/percentage:** приведение к числу (защита от массива с бэкенда) — исправляет баг с «15 / 50 / 100» в Contradictions.
- **Отображение:** «N comments (M authors)» вместо одного числа; блок авторов включён (раньше был `display: none`).
- **Источник count:** если есть `commentIds`, показывается `commentIds.length`, иначе `pattern.count` — устраняет расхождение «23 в паттерне при 13 classified».

### 3. Промпт синтеза (synthesis-llm.adapter.ts)
- Добавлен явный запрос на паттерны типа **Alternative Approaches** (comparison/workaround): как пользователи уже решают задачу без продукта (r/roastmystartup, Fiverr, внутренние ревью и т.д.).

---

## Состояние «ДО» (из canvas до перезапуска синтеза)

- **validationScore:** 4  
- **classifiedComments:** 13  
- **totalComments:** 301  
- **coverageRatio:** 0.04  

**Паттерны:**
| Секция            | Паттерн                    | count (API) | commentIds.length | uniqueAuthorCount |
|-------------------|----------------------------|-------------|-------------------|-------------------|
| Supporting Evidence | Users seek honest feedback | 23         | 12                | 10                |
| Contradictions    | Users express skepticism   | 15         | 1                 | 1                 |

Несоответствие: в API для первого паттерна `count: 23`, а `commentIds` — 12. После правок в UI отображается **12 comments (10 authors)** и **1 comment (1 author)** — числа согласованы с `classifiedComments: 13`.

---

## Состояние «ПОСЛЕ» (синтез)

Запуск синтеза не выполнялся: **research на кулдауне** (`nextAvailableAt` ~ через 17 ч). После истечения кулдауна выполните:

```http
POST /api/projects/f9e731bc-3414-4f82-8150-61550cf2abc8/research/synthesis
```

Затем проверьте:
1. В шапке блока: «X / 301 unique comments in patterns» и тултип.
2. В карточках: «N comments (M authors)», без строк вида «15,50,100».
3. При появлении паттернов comparison/workaround — секция «Alternative Approaches» заполняется.

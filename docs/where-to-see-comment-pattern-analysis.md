# Где смотреть данные анализа комментариев (recurrence, subreddits, score/depth)

## Место в приложении

**Страница:** Overview проекта (вкладка **Overview** на странице проекта).

**Путь в приложении:**
1. **Workspaces** → выбрать workspace (например, Validatey).
2. **Projects** → открыть нужный проект (например, Founder Validation Pain Survey).
3. Убедиться, что активна вкладка **Overview** (не Invitations / Responses / Comments).

**URL (пример):**
```
/workspaces/{workspaceId}/projects/{projectId}
```
Пример: `http://localhost:5173/workspaces/023fc4d2-e85a-4c22-ae5b-ad10c473e8c3/projects/ec73391f-6d45-40dc-b80b-6809cfd0cc1d`

---

## Блок «Comment Pattern Analysis»

Находится в правой колонке Overview, ниже блоков:
- Start Research / Cooldown
- Top Pain Points
- Response Pace
- Comments Overview

### Что там отображается (новые данные)

| Элемент | Описание |
|--------|----------|
| **Strong Evidence (N%)** | Общий validation score (0–100%). |
| **Recurrence: N%** | Доля паттернов, повторяющихся в нескольких сабреддитах (подсказка: «Same patterns appear across subreddits — strong validation signal»). |
| **N subreddits** | Количество сабреддитов, из которых собраны комментарии (подсказка: «Comments from these communities»). |
| **Паттерны** | Список паттернов с count, **in M subreddits** и при наведении — список сабреддитов (например r/micro_saas, r/Entrepreneur). |
| **Show N comments** | Открывает боковую панель с комментариями паттерна; у Reddit-комментариев при наличии данных показываются **+score** (upvotes) и **depth N** (уровень вложенности). |

---

## Скриншот

Снимок текущего вида (viewport с блоком Comment Pattern Analysis) сохранён в репозитории:

**Файл:** `docs/where-to-see-comment-pattern-analysis.png`

На скриншоте видна правая колонка Overview с блоком **Comment Pattern Analysis** (заголовок, бейдж Evidence, список паттернов и кнопки «Show N comments»).

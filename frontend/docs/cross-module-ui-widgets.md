# Cross-module UI: the Widget rule

## Rule

**If module A’s UI needs data from module B, do not call module B’s API or use cases from module A.**

Instead:

- **Use a Widget that belongs to module B.**
- The Widget is placed in module A’s view (e.g. in the template).
- The Widget **itself** knows how and where to get the data: it uses **its own module’s presenter** (from the DI container).
- Module A only receives a Vue component (the Widget) and passes minimal props (e.g. `projectId`). Module A does not depend on B’s application layer, HTTP, or API.

## Data flow inside a module

Inside module B, data flows in one direction:

**Widget → Presenter → Use case → Repository**

- **Widget** — calls the presenter (from the DI container).
- **Presenter** — calls use cases, maps results to the view model.
- **Use case** — application logic, calls the repository (e.g. HTTP repository to the backend).
- **Repository** — talks to the API / backend or other external source.

## Cross-module flow (when A shows B’s data)

```
[Module A view, e.g. ProjectDetailsView]
         │
         │  only: <CommentsFreshnessWidget :project-id="projectId" />
         │  (no calls to Comments API / use cases)
         ▼
[Widget]  ──►  [Presenter]  ──►  [Use case]  ──►  [Repository]  ──►  API
(module B)
```

## Summary

| Layer              | Responsibility                                      |
|--------------------|-----------------------------------------------------|
| **Module A (consumer UI)** | Import and render B’s Widget; pass props (e.g. `projectId`). |
| **Widget**         | Resolve B’s presenter from container; call presenter; render UI. |
| **Presenter**      | Call use cases; map results to view model; return to Widget. |
| **Use case**       | Application logic; call repository.                |
| **Repository**     | HTTP / API calls (or other external access).        |

**Universal rule:** Information from module B appears in another module’s UI **only through a Widget** that belongs to B and that knows how to get the data (via B’s presenter).

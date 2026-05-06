Controllers folder
==================

This folder is intentionally left as scaffolding for controller-style organization.

Current state:
- Route handlers are implemented directly under `src/routes/` (for now).
- The `controllers/` folder is empty but present so future refactors can move business logic
  out of route files and into controller functions.

Suggested next steps:
- Move route logic from `src/routes/*.ts` into `src/controllers/*Controller.ts` files.
- Keep controllers thin: accept `(req, res)` or typed params and call services in `src/services/`.
- Add unit tests for controller functions.

If you want, I can refactor `src/routes/papers.ts` to extract handlers into
`src/controllers/papersController.ts` and move the background analysis
`runPaperAnalysis` into `src/services/analysisService.ts` — say the word and
I'll perform the refactor.

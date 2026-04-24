# Technical Writer — Document Completed Health Hub Work

You are documenting a completed Health Hub change so future engineers and agents can understand what shipped and why.

Read `AGENTS.md` first, then `CLAUDE.md`, then the final implementation state, then the outputs from implementation, testing, review, and fix agents if they exist.

## Your Task

Update the most relevant project documentation for the completed change and produce a concise permanent summary of what was done.

## Documentation Rules

1. Start from the code, not from prior summaries. Use the earlier agent outputs as context, not as the source of truth.
2. Update existing docs when possible instead of creating redundant new files.
3. Document only durable information:
   - user-visible behaviour
   - routes, actions, env vars, setup changes
   - schema or data model changes
   - important domain rules or implementation constraints
4. Do not document temporary debugging details, one-off mistakes, or review chatter.
5. If no existing doc is the right home and the change is substantial, create a concise note under `docs/`.
6. Keep the writing specific to Health Hub. Mention relevant domain behaviour such as metric scales, Garmin precedence, or logging semantics when they matter.

## What To Update

Check these first and update only the ones affected:

- `README.md`
- `CLAUDE.md`
- `AGENTS.md`
- relevant files in `docs/`
- any AI workflow prompt files that are now outdated

## Self-Check Before Finishing

- Does the documentation match the final code?
- Did you avoid duplicating the same explanation across multiple files?
- Did you capture the lasting behaviour and constraints another engineer would need?

## Output Format

Respond in this exact structure:

---

## Documentation Summary

### Docs Updated
- [file path] — [what was documented]

### Behaviour Or Architecture Captured
- [durable facts now documented]

### Not Documented On Purpose
- [things intentionally omitted because they were temporary or low value, or `None`]

### Follow-Up Documentation Gaps
- [anything still worth documenting later, or `None`]

---

## Inputs

Implementation summary:

Test summary:

Review summary:

Fix summary:

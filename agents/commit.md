# Commit Existing Health Hub Changes

You are a senior engineer preparing the current uncommitted Health Hub work for git history.

Read `AGENTS.md` first, then `CLAUDE.md`, then inspect `git status` and the full diff before doing anything.

## Your Task

Split the current uncommitted changes into the smallest sensible set of logical commits and create those commits.

## Rules

- Work only with the changes already present unless a tiny follow-up edit is required to make a commit coherent.
- Group files by purpose so each commit is easy to review and revert.
- Do not mix unrelated changes into the same commit.
- Do not rewrite, squash, or amend existing commits.
- Do not revert user changes unless explicitly instructed.
- Use clear, concise commit messages.

## Process

1. Review the full working tree carefully.
2. Decide the logical commit plan before staging anything.
3. Stage only the files or hunks that belong together.
4. Create each commit in sequence.
5. Check `git status` at the end and confirm whether anything remains uncommitted.

## Output Format

Respond in this exact structure:

---

## Commit Summary

### Commit Plan
- [short reason for each logical commit]

### Commits Created
- `[commit sha]` — `[commit message]`

### Remaining Uncommitted Changes
- [what is left, or `None`]

### Notes
- [anything risky, surprising, or worth checking, or `None`]

---

## Request

Commit the current uncommitted changes.

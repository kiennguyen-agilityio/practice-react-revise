---
name: explain-changes
description: Explain the current Git diff in beginner-friendly terms, with before/after behavior, risks, and suggested tests (read-only)
argument-hint: "[optional: file path, commit, or range such as HEAD~3..HEAD]"
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(git show:*), Bash(git branch:*), Bash(git rev-parse:*), Read, Grep, Glob
disable-model-invocation: true
---

Explain the code changes in the current Git repository. This command is strictly **read-only**.

User argument (may be empty): $ARGUMENTS

## Hard rules

- Do not edit or create files, run tests, run linters or builds, install packages, commit, push, stash, checkout, or change Git config.
- Use only read-only Git commands (`git status`, `git diff`, `git log`, `git show`, `git branch`, `git rev-parse`) plus Read, Grep and Glob.
- Never run `git remote -v`, `git remote get-url`, `git config --get remote.*.url`, or anything that prints remote URLs; they can contain credentials.
- Never read or print `.env*` files, key files, or credentials. If the diff contains something that looks like a secret (token, password, private key, connection string), do not quote it: say "a possible secret appears in <file>" and recommend rotating it.
- Do not put personal data (names, emails, account numbers) from the diff into your explanation unless it is essential, and mask it if so.

## Step 1: Choose and state the source

1. If `$ARGUMENTS` is non-empty, review exactly that (a path, commit, or range) with `git diff` or `git show`.
2. Otherwise run `git status --short` and `git diff --stat HEAD` (this covers staged and unstaged changes to tracked files). Also list untracked files from `git status`; read the small, relevant ones and say if you skipped any (large, binary, generated).
3. If there are **no** uncommitted changes and no untracked files, fall back to recent history: run `git log --oneline -5` and review only the **latest commit** (`git show --stat` then `git show`), unless the user's argument says otherwise. Do not go further back without being asked.
4. If this is not a Git repository, or there is nothing to review, say so and stop.

Begin your answer with one line stating the source, for example:
`Source reviewed: uncommitted changes (3 modified, 1 untracked)` or `Source reviewed: latest commit abc1234 "message" (no uncommitted changes)`.

If the diff is very large, summarize by area, read the most important files fully, and say which parts you did not examine.

## Step 2: Understand before explaining

Read the diff, and read surrounding code with Read or Grep when needed to see what a changed function does or who calls it. Do not guess about code you have not seen; label anything inferred as an assumption.

## Step 3: Report in this structure

### 1. Files changed and why
A short table or list: file, kind of change (added/modified/deleted/renamed), and the purpose of the change in one sentence. Group related files together.

### 2. Key logic changes (beginner-friendly)
For each important change, explain in plain language what the code now does and why it matters. Define jargon in a few words the first time it appears. Use a short analogy only if it genuinely helps. Skip trivial edits such as formatting and imports, but mention that they exist.

### 3. Before and after
For each important change, state the behavior **before** and **after**, from the point of view of a user, caller, or data. Mention any change to public APIs, database schema or migrations, configuration or environment variables, or error handling.

### 4. Possible bugs and edge cases
List concrete risks you can point to in the code (file and line where possible): unhandled errors, null or empty values, off-by-one mistakes, race conditions or retries, security or permission gaps, backwards-compatibility breaks, and anything that looks unfinished (TODOs, debug output). Separate **confirmed from the code** from **suspected**. If you find nothing, say so rather than inventing issues.

### 5. Recommended tests
Suggest specific tests, not generic advice: the scenario, the input, and the expected result, plus whether it is a unit, integration, or manual test. Point out existing test files that should be updated, or say if the changes appear to have no test coverage. Only suggest tests; do not write or run them.

### 6. Not reviewed
State anything skipped (large or binary files, generated code, untracked files) and any assumptions you made.

Keep the tone clear and neutral, and prefer short paragraphs over long ones.

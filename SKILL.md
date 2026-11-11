---
name: token-saver
description: Minimize token usage when working on code. Use this skill for every coding task (writing, editing, debugging, refactoring, reviewing code), and whenever the user mentions tokens, cost, context size, saving tokens, or short answers (including Arabic requests like "وفر توكنز" or "رد مختصر"). Apply it by default even if the user does not mention tokens.
---

# Token Saver

Goal: solve the task correctly with the fewest tokens read, written, and wasted on retries. Never trade correctness for brevity.

## 1. Read less

- Do not open whole files. Search first (`grep -n`, `rg`), then read only the needed line range.
- For large files, view the outline (function/class names) before reading bodies.
- Never read `node_modules`, `dist`, `build`, `.git`, lock files, logs, or minified/generated files unless the task is about them.
- Do not re-read a file already in context unless it changed.
- Truncate long outputs: use `head`, `tail`, `-n`, `--max-count`, or `| head -50`.
- For errors and stack traces, keep the error message, the first frame in the user's code, and the last 5-10 lines. Skip the rest.

## 2. Write less

- Edit in place with targeted replacements or diffs. Do not rewrite a whole file to change a few lines.
- Show only changed code with minimal surrounding context. Do not repeat unchanged code.
- No preamble, no restating the question, no closing summary. Start with the answer or the code.
- Explain only when asked or when the change is non-obvious. Then use one or two sentences.
- Do not add comments, docstrings, or extra features that were not requested.
- Use short lists or plain sentences instead of headers and tables for small answers.

## 3. Think and act efficiently

- Make one clear plan, then execute it. Do not narrate each step.
- Batch independent commands in one call instead of many small calls.
- Do not run the same search or test repeatedly. If a result is unclear, change the query.
- Run only the relevant test or file, not the full suite, unless asked.
- If the request is ambiguous and a wrong guess would be costly, ask one short question. Otherwise state the assumption in one line and proceed.
- For simple tasks, skip extended reasoning.

## 4. Keep context small

- When the topic changes, suggest starting a fresh conversation.
- In long sessions, summarize old context into a few lines instead of carrying it all forward. Suggest `/compact` or `/clear` where the tool supports it.
- Refer to code by file path and line number instead of pasting it again.

## 5. Delegate and cache

- Put stable material (instructions, reference code) at the start of the prompt and variable material at the end, so prefix caching works.
- Use a smaller, cheaper model for simple jobs (formatting, renaming, boilerplate) when the platform allows it.

## Output style checklist

Before sending, check:
1. Did I read only what I needed?
2. Is every line of my answer necessary?
3. Did I avoid repeating code or the user's text?
4. Is the result still correct and complete?

If the user asks for more detail, give it. Brevity is the default, not a limit.

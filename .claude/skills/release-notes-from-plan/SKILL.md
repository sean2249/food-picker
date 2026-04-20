---
name: release-notes-from-plan
description: Use when asked to create PM/user-facing feature introductions, release notes, or product changelogs from an implementation plan document and CLAUDE.md project context. Triggered by requests like "產出功能介紹", "寫 release notes", "給 PM 看的說明".
---

# Release Notes From Plan

## Overview

Convert a technical implementation plan into a PM/user-facing feature introduction. Always write to a file and include a release version. Focus on what changed for the user — not how it was built.

## Inputs

1. **Implementation plan** — task list with file changes (e.g., `docs/superpowers/plans/*.md`)
2. **CLAUDE.md** — current feature set and architecture context

## Step 1: Determine Version

Check `docs/releases/` for existing release files to find the latest version number, then increment:
- Major feature set → bump minor (v1.0 → v1.1)
- Small additions / removals → bump patch (v1.1 → v1.1.1)
- If no prior releases exist, start at **v1.0.0**

Derive date from the plan filename (e.g., `2026-04-19-foo.md` → `2026-04-19`) or use today's date.

## Step 2: Write the File

**Output path:** `docs/releases/YYYY-MM-DD-v{version}.md`

Example: `docs/releases/2026-04-19-v1.1.0.md`

Create the `docs/releases/` directory if it doesn't exist.

## File Format

```markdown
# [App Name] Release Notes — v{version}

**發布日期：** YYYY-MM-DD

---

## 本次更新重點

### 1. [Feature Name]
[2-3 sentences: what it is, why it's useful, how user triggers it]

### 2. [Feature Name]
...

---

## 移除功能

- **[Removed feature]：** One-line reason

---

## 使用流程（新版）

[Short user journey in code block or bullet list]
```

## Rules

**Include:**
- Features visible or felt by the user
- Removed features (briefly, with why)
- New user flow if it changed significantly

**Exclude:**
- Internal architecture changes (DB migrations, type updates, API route refactors)
- Technical debt cleanup
- File renames, deletions of internal modules

**Language:** Match the app's UI language (this project uses Traditional Chinese 繁體中文).

**Tone:** Accessible, benefit-first. Lead with what the user gains, not how it works.

## Mapping Plan Tasks → User Features

| Plan section | User-facing? | Action |
|---|---|---|
| DB migration / schema | No | Skip |
| TypeScript types | No | Skip |
| API routes (new/modified) | Indirect | Only if it unlocks a new UI feature |
| UI components / pages | Yes | Include |
| Delete component | Yes if visible | Include under "移除功能" |
| Build/deploy verification | No | Skip |

## Example

Plan task: *"Add proximity field (1-10) to RestaurantForm, recommend engine weights by proximity"*

Output section:
```
### 距離評分（Proximity Score）
新增 1–10 的距離評分欄位，讓你在新增餐廳時標記離你有多近（1 = 很遠，10 = 超近）。
推薦時系統會優先推薦距離近的餐廳，省去不必要的通勤時間。
```

## Common Mistakes

- Forgetting to write the file — always use Write tool, never just display in chat
- Missing version number in filename and file header
- Writing "Updated `lib/recommendation.ts` to support multi-result" → rewrite as user benefit
- Listing every API route change → only show when it adds a new user capability
- Skipping the user flow section → always include if the interaction pattern changed

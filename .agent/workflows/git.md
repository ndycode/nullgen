---
description: Git add, commit, and push with auto-generated commit message
---

# Git Commit & Push

// turbo-all

## 1. Check Changes
```powershell
git status
git diff --stat
```

## 2. Stage
```powershell
git add -A
```

## 3. Commit (conventional format)
```powershell
git commit -m "<type>(<scope>): <description>"
```

**Types:** `feat`, `fix`, `refactor`, `style`, `chore`, `docs`, `perf`

**Example:**
```
feat(tools): add password strength checker

- Add strength meter component
- Integrate with password generator tool
```

## 4. Push
```powershell
git push origin <branch>
```

## Quick
```powershell
git add -A; git commit -m "message"; git push
```

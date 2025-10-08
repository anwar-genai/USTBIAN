# Git Branch Strategy & Template Usage

## 📋 Branch Structure

```
main (production-ready, stable releases)
 │
 ├─── develop (integration branch for active development)
 │     │
 │     ├─── feature/mobile-setup (mobile app setup & testing)
 │     └─── feature/university-specific (university-specific features)
 │
 └─── template/base-social-features (REUSABLE SNAPSHOT)
       ↓ Use this in other social app projects
```

---

## 🎯 Branch Purposes

### `main`
- **Purpose**: Production-ready code
- **Usage**: Only merge from `develop` when features are fully tested
- **Protection**: Keep stable at all times

### `develop`
- **Purpose**: Integration branch where all features come together
- **Usage**: Create all feature branches from here, merge back when done
- **Workflow**: This is your main development branch

### `feature/*` branches
- **Purpose**: Isolated development for specific features
- **Usage**: 
  - Create from `develop`
  - Work on the feature
  - Merge back to `develop` when complete
  - Delete after merging

### `template/base-social-features` ⭐
- **Purpose**: **REUSABLE SNAPSHOT** of current features for other social apps
- **Contains**:
  - Notification system (WebSocket + Push notifications)
  - User authentication & authorization
  - Post creation, editing, deletion
  - Comments system
  - Like/reaction system
  - Profile management
  - File upload system
  - Real-time features
  - Backend API (FastAPI)
  - Web frontend (React)
  - Mobile app base (React Native)
- **Usage**: See section below ⬇️

---

## 🚀 How to Use Template in Other Social App Projects

### Method 1: Clone and Start Fresh (Recommended for New Projects)

```bash
# 1. Clone the repository with a new name
git clone https://github.com/anwar-genai/USTBIAN.git MyNewSocialApp
cd MyNewSocialApp

# 2. Checkout the template branch
git checkout template/base-social-features

# 3. Create a new main branch from template
git checkout -b main

# 4. Update remote (if you have a new repo)
git remote remove origin
git remote add origin <your-new-repo-url>
git push -u origin main

# 5. Create develop and start working
git checkout -b develop
git push -u origin develop
```

### Method 2: Add as Remote (For Existing Projects)

```bash
# 1. In your other project, add this repo as a remote
git remote add ustbian-template https://github.com/anwar-genai/USTBIAN.git

# 2. Fetch the template branch
git fetch ustbian-template template/base-social-features

# 3. Create a new branch from the template
git checkout -b imported-features ustbian-template/template/base-social-features

# 4. Merge or cherry-pick features you want
git checkout main
git merge imported-features
# OR cherry-pick specific commits
```

### Method 3: Export Specific Features (Selective Import)

```bash
# 1. Add as remote
git remote add ustbian-template https://github.com/anwar-genai/USTBIAN.git
git fetch ustbian-template template/base-social-features

# 2. Copy specific directories
git checkout ustbian-template/template/base-social-features -- backend/app/notifications
git checkout ustbian-template/template/base-social-features -- backend/app/websocket

# 3. Commit the imported features
git add .
git commit -m "Import notification system from Ustbian template"
```

---

## 📝 Current Development Workflow

### Starting Work on Mobile Setup:
```bash
git checkout feature/mobile-setup
# Make changes, test features
git add .
git commit -m "Your commit message"
git push origin feature/mobile-setup
```

### When Mobile Setup is Complete:
```bash
git checkout develop
git merge feature/mobile-setup
git push origin develop
git branch -d feature/mobile-setup  # Delete local
git push origin --delete feature/mobile-setup  # Delete remote
```

### Starting Work on University Features:
```bash
git checkout feature/university-specific
# Make university-specific changes
```

### When Ready for Production:
```bash
# Test everything on develop first
git checkout main
git merge develop
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin main --tags
```

---

## 🔄 Keeping Template Updated

If you make improvements to base features that should be in the template:

```bash
# 1. Checkout template branch
git checkout template/base-social-features

# 2. Cherry-pick specific commits from develop
git cherry-pick <commit-hash>

# 3. Push updated template
git push origin template/base-social-features
```

---

## 📌 Quick Commands

```bash
# See all branches
git branch -a

# Switch branches
git checkout <branch-name>

# Create new feature branch from develop
git checkout develop
git checkout -b feature/new-feature-name

# Update your current branch with latest develop
git checkout feature/your-feature
git merge develop

# Delete local branch
git branch -d branch-name

# Delete remote branch
git push origin --delete branch-name
```

---

## ✅ Best Practices

1. **Never commit directly to `main`** - Always go through `develop`
2. **Keep feature branches small and focused** - One feature per branch
3. **Update `develop` regularly** - Pull latest changes before creating new features
4. **Update template when base features improve** - Keep it current for future projects
5. **Use meaningful commit messages** - Describe what and why, not how
6. **Test on `develop` before merging to `main`** - `main` should always be deployable

---

## 🆘 Troubleshooting

**Merge conflicts?**
```bash
git status  # See conflicting files
# Edit files to resolve conflicts
git add .
git commit
```

**Want to undo last commit?**
```bash
git reset --soft HEAD~1  # Keeps changes
git reset --hard HEAD~1  # Discards changes (careful!)
```

**Lost and need to start over?**
```bash
git stash  # Save current changes
git checkout develop  # Go back to develop
git stash pop  # Restore changes if needed
```


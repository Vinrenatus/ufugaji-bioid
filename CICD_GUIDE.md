# CI/CD Setup Guide
## Ufugaji-BioID - KSEF 2026

This document explains the Continuous Integration and Continuous Deployment (CI/CD) pipeline for the Ufugaji-BioID project.

---

## 🏗️ Pipeline Overview

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────────┐
│   GitHub    │────▶│  CI Build     │────▶│   Security  │────▶│   Netlify    │
│   Push/PR   │     │  & Tests      │     │   Scan      │     │   Deploy     │
└─────────────┘     └──────────────┘     └─────────────┘     └──────────────┘
                           │                    │                    │
                           ▼                    ▼                    ▼
                    ESLint/Prettier      npm audit            Production URL
                    Build (dist/)        Dependencies         Updated
```

---

## 📋 What Happens on Every Push

### 1. **Code Quality Check** (ESLint + Prettier)
- Validates code style
- Checks for React best practices
- Ensures consistent formatting
- Validates import order

### 2. **Build Process**
- Installs dependencies
- Runs production build
- Uploads build artifacts
- Verifies build success

### 3. **Security Scan**
- Checks for vulnerable dependencies
- Runs `npm audit`
- Fixes moderate+ vulnerabilities

### 4. **Deployment** (Main branch only)
- Deploys to Netlify
- Updates production URL
- Adds deployment comment on GitHub

---

## 🔧 Configuration Files

### `.github/workflows/ci-cd.yml`
GitHub Actions workflow definition

### `.eslintrc.json`
ESLint configuration for code quality

### `.prettierrc`
Prettier configuration for code formatting

### `netlify.toml`
Netlify build configuration

---

## 🚀 Setting Up Netlify Integration

### Step 1: Get Netlify Credentials

1. **Auth Token**:
   - Go to https://app.netlify.com/account/applications
   - Click "New Access Token"
   - Copy the token

2. **Site ID**:
   - Go to your site settings
   - Find "Site ID" in General settings
   - Copy the ID

### Step 2: Add GitHub Secrets

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add these secrets:

```
NETLIFY_AUTH_TOKEN=your_token_here
NETLIFY_SITE_ID=your_site_id_here
```

### Step 3: Verify Setup

Push to main branch and check:
1. **Actions tab** - See workflow running
2. **Netlify dashboard** - See new deploy
3. **Production URL** - Verify updates live

---

## 📝 Local Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint

# Fix linting issues
npm run lint:fix

# Format code with Prettier
npm run format

# Check formatting
npm run format:check
```

---

## 🎯 Code Quality Standards

### ESLint Rules
- React Hooks rules enforced
- Import order standardized
- No unused variables (warn)
- No console.log in production (warn)

### Prettier Configuration
- Single quotes
- 100 character line width
- 2 space indentation
- Semicolons required
- Trailing commas (ES5 style)

---

## 🔒 Security Best Practices

### What's Scanned
- npm dependencies for vulnerabilities
- Outdated packages
- Known security issues

### Automatic Fixes
- `npm audit fix` runs automatically
- Moderate+ issues flagged in CI

### Manual Security Checks
```bash
# Check for vulnerabilities
npm audit

# Fix automatically
npm audit fix

# Force fix (may break changes)
npm audit fix --force
```

---

## 📊 Workflow Status

Check workflow status at:
https://github.com/Vinrenatus/ufugaji-bioid/actions

---

## 🎓 For KSEF Judges

This project uses **Silicon Valley standard** CI/CD practices:

1. ✅ **Automated Testing** - Code quality checks on every change
2. ✅ **Continuous Integration** - Automatic builds and validation
3. ✅ **Continuous Deployment** - Zero-downtime production updates
4. ✅ **Security Scanning** - Dependency vulnerability checks
5. ✅ **Code Standards** - ESLint + Prettier enforcement
6. ✅ **Version Control** - Git with meaningful commits
7. ✅ **Environment Management** - .env for configuration

---

## 🆘 Troubleshooting

### Build Fails
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Linting Errors
```bash
# Auto-fix issues
npm run lint:fix
npm run format
```

### Deploy Fails
1. Check GitHub Actions logs
2. Verify Netlify secrets are correct
3. Check `netlify.toml` configuration

---

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Netlify CI/CD Guide](https://docs.netlify.com/configure-builds/get-started/)
- [ESLint React Plugin](https://www.npmjs.com/package/eslint-plugin-react)
- [Prettier Documentation](https://prettier.io/docs/en/)

---

**Edmund Rice Catholic Education Center | KSEF 2026**

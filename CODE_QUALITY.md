# Code Quality & Development Workflow

This document outlines the code quality standards, tools, and development workflow for the Freelancer Marketplace Billing system.

## Code Quality Tools

### ESLint Configuration

The project uses a hierarchical ESLint configuration with the following structure:

- **Root Configuration** (`.eslintrc.json`): Base configuration extending Airbnb base config
- **Backend Configuration** (`apps/backend/.eslintrc.json`): Node.js specific rules
- **Frontend Configuration** (`apps/frontend/.eslintrc.json`): React/Next.js specific rules
- **Shared Configuration** (`packages/shared/.eslintrc.json`): Library-specific rules

#### Key ESLint Rules

- **Complexity**: Maximum cyclomatic complexity of 10
- **Function Length**: Maximum 50 lines per function
- **File Length**: Maximum 200 lines per file
- **Nesting Depth**: Maximum 4 levels of nesting
- **Parameters**: Maximum 5 parameters per function
- **Security**: Security-focused rules to prevent common vulnerabilities

#### Plugins Used

- `@typescript-eslint`: TypeScript-specific linting
- `eslint-plugin-import`: Import/export validation
- `eslint-plugin-unicorn`: Modern JavaScript best practices
- `eslint-plugin-security`: Security vulnerability detection
- `eslint-plugin-jest`: Jest testing framework rules
- `eslint-plugin-promise`: Promise-related rules
- `eslint-plugin-node`: Node.js-specific rules (backend only)
- `eslint-plugin-react`: React-specific rules (frontend only)
- `eslint-plugin-react-hooks`: React hooks rules (frontend only)

### Prettier Configuration

Code formatting is handled by Prettier with the following configuration:

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

### TypeScript Coverage

TypeScript coverage is monitored using `typescript-coverage-report`:

- **Target**: 90% minimum coverage
- **Reports**: Generated in `coverage/` directory
- **Commands**:
  - `npm run coverage`: Run coverage analysis
  - `npm run coverage:report`: Generate detailed report
  - `npm run coverage:html`: Generate HTML report

## Git Hooks & Quality Gates

### Pre-commit Hook

Runs automatically before each commit:

```bash
npx lint-staged
```

This will:

1. Run ESLint with auto-fix on staged TypeScript/JavaScript files
2. Run Prettier on staged files
3. Only process files that are staged for commit

### Pre-push Hook

Runs automatically before pushing to remote:

```bash
npm test
```

This ensures all tests pass before code is pushed to the repository.

### Commit Message Hook

Enforces conventional commit message format:

```
<type>(<scope>): <description>

Types:
- feat: New feature
- fix: Bug fix
- docs: Documentation changes
- style: Code style changes (formatting, etc.)
- refactor: Code refactoring
- test: Test changes
- chore: Build process, dependencies, etc.
- perf: Performance improvements
- ci: CI configuration changes
- build: Build configuration changes
- revert: Revert previous commit

Example: feat(billing): add pay-as-you-go pricing model
```

### Lint-staged Configuration

The lint-staged configuration in `package.json`:

```json
{
  "lint-staged": {
    "**/*.{ts,tsx,js,jsx}": ["eslint --fix", "prettier --write"],
    "**/*.{json,md}": ["prettier --write"]
  }
}
```

## Development Workflow

### 1. Code Changes

1. Make your changes in a feature branch
2. Write/update tests for new functionality
3. Run `npm run lint` to check for linting issues
4. Run `npm run test` to ensure tests pass

### 2. Commit Process

1. Stage your changes: `git add .`
2. Commit with conventional format: `git commit -m "feat(billing): add new pricing model"`
3. Pre-commit hook runs automatically:
   - ESLint fixes issues and formats code
   - Prettier formats staged files
   - Commit message format is validated

### 3. Push Process

1. Push to remote: `git push origin feature-branch`
2. Pre-push hook runs automatically:
   - All tests must pass
   - Push is blocked if tests fail

### 4. Quality Checks

Regular quality checks should be performed:

```bash
# Run all linting
npm run lint

# Run all tests
npm run test

# Check TypeScript coverage
npm run coverage

# Format all files
npm run format
```

## Code Quality Metrics

### ESLint Metrics

- **Complexity**: Functions should not exceed cyclomatic complexity of 10
- **Function Length**: Functions should not exceed 50 lines
- **File Length**: Files should not exceed 200 lines
- **Nesting Depth**: Code should not exceed 4 levels of nesting
- **Parameters**: Functions should not have more than 5 parameters

### Test Coverage

- **Unit Tests**: Target 80% minimum coverage
- **Integration Tests**: Critical business logic paths
- **TypeScript Coverage**: 90% minimum type coverage

### Performance Metrics

- **Build Time**: Should complete within 2 minutes
- **Test Execution**: Should complete within 30 seconds
- **Linting**: Should complete within 10 seconds

## IDE Integration

### VS Code

Recommended extensions:

```json
{
  "recommendations": [
    "eslint.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

### Settings

VS Code settings for the project:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "eslint.format.enable": true,
  "eslint.codeActionsOnSave.mode": "all",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

## Troubleshooting

### Common Issues

1. **ESLint errors on commit**: Run `npm run lint -- --fix` to auto-fix issues
2. **Test failures on push**: Run `npm test` locally to identify failing tests
3. **Commit message rejected**: Follow conventional commit format
4. **TypeScript errors**: Run `npm run build` to check for type errors

### Bypassing Hooks (Emergency Only)

In emergencies, you can bypass hooks:

```bash
# Skip pre-commit hook
git commit --no-verify -m "emergency fix"

# Skip pre-push hook
git push --no-verify origin main
```

**Note**: This should only be used in genuine emergencies and the code should be fixed immediately after.

## Configuration Files

- `.eslintrc.json`: ESLint configuration
- `.prettierrc`: Prettier configuration
- `tsconfig.json`: TypeScript configuration
- `.husky/`: Git hooks directory
- `package.json`: lint-staged configuration
- `jest.config.js`: Jest test configuration

## Scripts Reference

| Script             | Description                      |
| ------------------ | -------------------------------- |
| `npm run lint`     | Run ESLint on all workspaces     |
| `npm run format`   | Format all files with Prettier   |
| `npm run test`     | Run tests in all workspaces      |
| `npm run coverage` | Run TypeScript coverage analysis |
| `npm run build`    | Build all workspaces             |
| `npm run dev`      | Start development servers        |

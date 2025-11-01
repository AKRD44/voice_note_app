# Testing Guide

This project includes comprehensive unit tests with GitHub Actions CI/CD integration.

## Test Setup

### Dependencies

All testing dependencies are configured in `package.json`:
- `jest` - Test runner
- `jest-expo` - Expo-specific Jest configuration
- `@testing-library/react-native` - React Native testing utilities
- `@testing-library/jest-native` - Additional Jest matchers
- `react-test-renderer` - Component rendering for tests

### Configuration

- **Jest Config**: `jest.config.js` - Main Jest configuration
- **Setup File**: `jest.setup.js` - Global test setup and mocks
- **CI/CD**: `.github/workflows/test.yml` - GitHub Actions workflow

## Running Tests

### Local Development

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests for CI (with coverage, max workers)
npm run test:ci
```

### CI/CD

Tests run automatically on:
- Push to `main`, `develop`, or `master` branches
- Pull requests to `main`, `develop`, or `master`
- Manual workflow dispatch

## Test Structure

### Test Locations

Tests are organized alongside source files:

```
src/
├── components/
│   ├── RecordingCard.tsx
│   └── __tests__/
│       └── RecordingCard.test.tsx
├── hooks/
│   ├── useRecordings.ts
│   └── __tests__/
│       ├── useRecordings.test.ts
│       ├── useProfile.test.ts
│       └── useFolders.test.ts
├── services/
│   ├── transcription.ts
│   └── __tests__/
│       ├── transcription.test.ts
│       └── enhancement.test.ts
├── store/
│   ├── recordingStore.ts
│   └── __tests__/
│       ├── recordingStore.test.ts
│       └── settingsStore.test.ts
└── utils/
    ├── audioUtils.ts
    └── __tests__/
        └── audioUtils.test.ts
```

## Test Coverage

### Current Coverage Targets

- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

### What's Tested

#### Stores
- ✅ Recording Store (CRUD operations, state management)
- ✅ Settings Store (theme, preferences, subscription)

#### Services
- ✅ Transcription Service (API calls, error handling, retries)
- ✅ Enhancement Service (style transformations, validation)

#### Hooks
- ✅ useRecordings (loading, CRUD, search, pagination)
- ✅ useProfile (profile updates, avatar management)
- ✅ useFolders (folder management)

#### Components
- ✅ RecordingCard (rendering, interactions, themes)

#### Utils
- ✅ AudioUtils (file operations, validation, uploads)

## Mocking

Common mocks are set up in `jest.setup.js`:

- Expo modules (expo-av, expo-file-system, expo-secure-store)
- Navigation libraries
- Supabase client
- OpenAI client
- External APIs

## Best Practices

1. **Test Independence**: Each test should be independent and not rely on other tests
2. **Mock External Dependencies**: Always mock external APIs and services
3. **Test Edge Cases**: Include tests for error conditions and edge cases
4. **Clear Test Names**: Use descriptive test names that explain what's being tested
5. **Coverage**: Aim for high coverage but focus on meaningful tests over metrics

## CI/CD Integration

### GitHub Actions Workflow

The workflow (`/.github/workflows/test.yml`) includes:

1. **Test Job**: Runs tests on Node.js 18.x and 20.x
2. **Linting**: Runs ESLint before tests
3. **Coverage Report**: Generates and uploads coverage reports
4. **PR Comments**: Comments coverage on pull requests

### Environment Variables

For CI/CD, these environment variables are used (with fallbacks):
- `OPENAI_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `GOOGLE_CLIENT_ID`

## Troubleshooting

### Tests Failing Locally

1. Clear Jest cache: `npm test -- --clearCache`
2. Reinstall dependencies: `rm -rf node_modules && npm install`
3. Check mock setup in `jest.setup.js`

### CI/CD Failures

1. Check GitHub Actions logs for specific errors
2. Verify environment variables are set correctly
3. Ensure all dependencies are listed in `package.json`

## Adding New Tests

When adding new functionality:

1. Create test file: `__tests__/YourComponent.test.tsx`
2. Follow existing test patterns
3. Mock external dependencies
4. Test both success and error cases
5. Ensure tests pass locally before pushing

## Coverage Reports

Coverage reports are generated in the `coverage/` directory:

```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

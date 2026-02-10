# Testing Patterns

**Analysis Date:** 2026-02-10

## Test Framework

**Status:**
No testing framework is currently configured.

**Package.json:**
- No test scripts defined
- No test runner dependencies (`jest`, `vitest`, `@testing-library/react-native`, etc.)

**Configuration:**
- No test config files found (no `jest.config.*`, `vitest.config.*`, etc.)
- No linting/formatting tools configured (no `.eslintrc`, `.prettierrc`, `biome.json`)

**TypeScript:**
- TypeScript strict mode enabled via `tsconfig.json`
- Extends Expo's base config
- Provides type checking but no runtime tests

## Test File Organization

**Current State:**
No test files exist in the project source.

**Search Results:**
- No `*.test.ts` or `*.test.tsx` files found in `src/` or `app/`
- No `*.spec.ts` or `*.spec.tsx` files found
- No `__tests__/` directories

**Recommended Pattern (if tests were added):**
- Co-located with source files: `ComponentName.test.tsx` next to `ComponentName.tsx`
- Or dedicated `__tests__/` directories at each level
- Test files use `.test.ts` or `.test.tsx` extensions

## Coverage

**Current Status:**
No test coverage exists.

**No CI/CD Tests:**
- No test runs in CI pipeline
- No coverage reports generated
- No coverage thresholds enforced

## Testing Recommendations

**If Adding Tests:**

**Recommended Stack:**
```json
{
  "devDependencies": {
    "@testing-library/react-native": "^12.0.0",
    "@testing-library/jest-native": "^5.0.0",
    "jest": "^29.0.0",
    "jest-expo": "^51.0.0"
  }
}
```

**Test Structure Pattern:**
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Button } from './Button';

describe('Button', () => {
  it('renders with title', () => {
    render(<Button title="Test Button" onPress={() => {}} />);
    expect(screen.getByText('Test Button')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    render(<Button title="Test" onPress={onPress} />);
    
    fireEvent.press(screen.getByText('Test'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('shows loading state', () => {
    render(<Button title="Test" onPress={() => {}} loading={true} />);
    expect(screen.getByTestId('activity-indicator')).toBeTruthy();
  });
});
```

**Hook Testing Pattern:**
```typescript
import { renderHook, waitFor } from '@testing-library/react-native';
import { useAuth } from './useAuth';

describe('useAuth', () => {
  it('sends OTP successfully', async () => {
    const { result } = renderHook(() => useAuth());
    
    const response = await result.current.sendOTP('test@example.com');
    
    expect(response.success).toBe(true);
    expect(result.current.pendingEmail).toBe('test@example.com');
  });
});
```

**Mocking Strategies:**

**Mock Supabase:**
```typescript
jest.mock('../services/supabase', () => ({
  supabase: {
    auth: {
      signInWithOtp: jest.fn(),
      verifyOtp: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    })),
  },
}));
```

**Mock Expo Modules:**
```typescript
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
}));

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
  MediaTypeOptions: { Images: 'Images' },
}));
```

**Mock Theme:**
```typescript
jest.mock('../../theme', () => ({
  useTheme: () => ({
    colors: {
      primary: '#c1ff72',
      background: '#121212',
      text: '#ffffff',
      textSecondary: '#aaaaaa',
      card: '#1e1e1e',
      border: '#333333',
      error: '#ff453a',
      success: '#32d74b',
    },
    spacing: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
    },
    typography: {
      sizes: {
        xs: 12,
        sm: 14,
        md: 16,
        lg: 18,
        xl: 24,
      },
    },
    isDark: true,
  }),
}));
```

**Test Categories:**

**Unit Tests (Priority):**
- Pure functions: `calculateDistance`, `formatDistance`, `formatDate`, `parseDate`
- Utility functions: `isValidEmail`, `calculateAge`, `getVenueTypeLabel`
- Validation functions: form validators in onboarding screens

**Integration Tests:**
- Custom hooks: `useAuth`, `useCheckIn`, `useVenues`, `useProfile`
- Store interactions with mocked Supabase

**Component Tests:**
- UI components: `Button`, `Input`, `Card`, `Tag`, `Avatar`
- Feature components: `VenueCard`, `CheckInModal`, `ProfileHeader`

**E2E Tests (Future):**
- Not recommended for MVP phase
- Consider Detox or Maestro once core features are stable

**What to Mock:**
- External APIs (Supabase, Radar)
- Expo modules (location, image picker)
- Navigation (Expo Router)
- AsyncStorage

**What NOT to Mock:**
- Pure utility functions
- Theme context (use real implementation or simple mock)
- React Native primitives (View, Text, etc.)

## Running Tests (If Configured)

**Recommended Scripts:**
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

**Recommended Config:**
```javascript
// jest.config.js
module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)'
  ],
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/types/**',
  ],
};
```

## Current Quality Measures

**Type Safety:**
- TypeScript strict mode provides compile-time checking
- Type definitions in `src/types/database.ts`

**Manual Testing:**
- Expo Go for local development
- Manual QA on real devices

**Code Review:**
- Git-based workflow with conventional commits
- No automated checks on commits

**Development Environment:**
- VS Code with TypeScript language server
- Real-time type checking during development

---

*Testing analysis: 2026-02-10*

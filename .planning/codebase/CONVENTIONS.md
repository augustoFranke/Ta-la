# Coding Conventions

**Analysis Date:** 2026-02-10

## Language Standards

**TypeScript:**
- TypeScript strict mode enabled (`"strict": true` in `tsconfig.json`)
- Extends Expo's base TypeScript config
- All source files use `.ts` or `.tsx` extensions

**Portuguese for UI text:**
- All user-facing strings (labels, buttons, placeholders, errors, notifications) must be in Portuguese (pt-BR)
- Examples:
  - `'Qual seu email?'` (login screen title)
  - `'Enviar código'` (button label)
  - `'Ver detalhes'` (venue card button)
  - `'Você está muito longe'` (distance warning)

**English for code:**
- Variable names, function names, types, and comments use English
- Example: `useAuth`, `fetchUserProfile`, `calculateDistance`

## Naming Conventions

**Files:**
- React components: PascalCase with `.tsx` extension
  - `Button.tsx`, `VenueCard.tsx`, `ProfileHeader.tsx`
- Hooks: camelCase with `use` prefix, `.ts` extension
  - `useAuth.ts`, `useCheckIn.ts`, `useVenues.ts`
- Services: camelCase, `.ts` extension
  - `auth.ts`, `places.ts`, `supabase.ts`
- Stores: camelCase with `Store` suffix, `.ts` extension
  - `authStore.ts`, `venueStore.ts`, `checkInStore.ts`
- Types: camelCase, `.ts` extension
  - `database.ts`
- Config: camelCase, `.ts` extension
  - `venueTypeScores.ts`, `verifiedVenues.ts`

**Components:**
- Named exports with PascalCase
- Example: `export function Button({ ... }) { ... }`
- File name matches component name

**Functions:**
- camelCase for all functions
- Examples: `sendEmailVerification`, `calculateDistance`, `formatDate`
- Async functions clearly named: `fetchUserProfile`, `fetchActiveCheckIn`

**Variables:**
- camelCase for variables
- UPPER_SNAKE_CASE for constants
- Examples: 
  - `const email = ...`
  - `const DEFAULT_RADIUS = 10000`
  - `const BLACKLISTED_TYPES = [...]`

**Types:**
- PascalCase for type/interface names
- Examples: `User`, `VenueWithDistance`, `OnboardingData`, `AuthSession`
- Props interfaces: ComponentName + `Props` suffix
  - `ButtonProps`, `InputProps`, `VenueCardProps`

## Component Patterns

**Component Structure:**
```typescript
/**
 * Component description
 * Purpose and responsibilities
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';

interface ComponentProps {
  prop: string;
  optional?: boolean;
}

export function ComponentName({ prop, optional }: ComponentProps) {
  const { colors, spacing, typography } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <Text style={{ color: colors.text }}>Content</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // Static styles
  },
});
```

**Props Patterns:**
- Extend React Native base props when appropriate
  - `interface ButtonProps extends TouchableOpacityProps`
  - `interface InputProps extends TextInputProps`
- Optional props use `?` suffix
- Destructure props in function parameters

**Hooks Usage:**
- Custom hooks always start with `use` prefix
- Place hooks at top of component, before any logic
- Theme hook pattern: `const { colors, spacing, typography, isDark } = useTheme();`
- Auth hook pattern: `const { user, session, isLoading } = useAuth();`

**File-level Comments:**
- Start complex files with JSDoc-style comment describing purpose
- Example from `src/hooks/useAuth.ts`:
  ```typescript
  /**
   * Hook de autenticação
   * Gerencia login via Email OTP com Supabase Auth, sessão e perfil do usuário
   */
  ```

## State Management

**`useState` - Small/Simple Forms:**
- Use for few fields (1-3)
- Minimal validation
- No dependent state updates
- Example: login screen with email input (`app/(auth)/login.tsx`)
```typescript
const [email, setEmail] = useState('');
const [error, setError] = useState('');
```

**`useReducer` - Medium/Large Forms:**
- Use for medium/large forms with state dependent on previous state
- Multi-step conditional flows
- Example: onboarding bio screen (`app/(auth)/onboarding/bio.tsx`)
```typescript
const [name, setName] = useState('');
const [birthDate, setBirthDate] = useState('');
const [bio, setBio] = useState('');
const [occupation, setOccupation] = useState('');
const [errors, setErrors] = useState<{ [key: string]: string }>({});
```

**`react-hook-form` - Large Forms:**
- Not currently used in codebase
- Would be used for: large forms with performance requirements, real-time/async validation

**Zustand for Global State:**
- All global state uses Zustand stores
- Store files: `src/stores/`
- Pattern:
```typescript
import { create } from 'zustand';

interface StoreState {
  // State
  data: DataType | null;
  isLoading: boolean;
  
  // Actions
  setData: (data: DataType | null) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useStore = create<StoreState>((set) => ({
  data: null,
  isLoading: false,
  
  setData: (data) => set({ data }),
  setLoading: (isLoading) => set({ isLoading }),
  reset: () => set({ data: null, isLoading: false }),
}));
```

## Styling

**Theme Usage:**
- Always import and use theme hook: `const { colors, spacing, typography } = useTheme();`
- Never hardcode colors, spacing, or font sizes

**Primary Color:**
- Light mode: `#95d84a`
- Dark mode: `#c1ff72` (defined in `src/theme/colors.ts`)
- Access via: `colors.primary`

**Style Patterns:**
- Combine static styles with dynamic theme values:
```typescript
<View style={[
  styles.container,
  { 
    backgroundColor: colors.card,
    padding: spacing.md 
  }
]} />
```

**No Emojis:**
- Never use emojis for visual representation in UI
- Use icon libraries (`@expo/vector-icons`) instead
- Example: `<Ionicons name="location" size={14} color={colors.text} />`

**StyleSheet:**
- Create StyleSheet objects at bottom of file
- Use for static/unchanging styles only
- Theme-dependent values go inline

**Border Radius:**
- Common values: 12, 16, 20, 24
- Cards: typically 16 or 24
- Buttons: typically 12
- Badges: typically 20

## Import Organization

**Order:**
1. React and React Native imports
2. Third-party libraries (Expo, Supabase, etc.)
3. Local imports (components, hooks, services, types)

**Example:**
```typescript
import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../../src/theme';
import { Button } from '../../src/components/ui/Button';
import { useAuth } from '../../src/hooks/useAuth';
```

**Path Patterns:**
- Relative imports for local files: `'../../src/theme'`
- No path aliases configured
- Deep imports when necessary: `'@supabase/supabase-js'`

**Type Imports:**
- Use `import type` for type-only imports:
  ```typescript
  import type { User } from '../types/database';
  import type { Session } from '@supabase/supabase-js';
  ```

## Error Handling

**Async Function Pattern:**
```typescript
const functionName = useCallback(async (input: string) => {
  setLoading(true);
  try {
    const result = await someAsyncOperation(input);
    
    if (!result.success) {
      return { success: false, error: result.error || 'Erro genérico' };
    }
    
    return { success: true, data: result.data };
  } catch (error: any) {
    console.error('Contexto do erro:', error);
    return { success: false, error: error.message || 'Mensagem padrão' };
  } finally {
    setLoading(false);
  }
}, [dependencies]);
```

**Return Type Pattern:**
- Success/error objects: `{ success: boolean; error?: string; data?: T }`
- Example from `src/hooks/useAuth.ts`:
```typescript
return { success: false, error: 'Email inválido' };
return { success: true, email: normalizedEmail };
```

**User Feedback:**
- Use `Alert.alert()` for errors requiring user attention
- Store error state for inline display
- Portuguese error messages

**Validation:**
- Validate early, return early
- Set field-specific errors: `setErrors({ fieldName: 'Mensagem de erro' })`
- Example from `app/(auth)/onboarding/bio.tsx`:
```typescript
const validateForm = (): boolean => {
  const newErrors: { [key: string]: string } = {};
  
  if (!name.trim()) {
    newErrors.name = 'Nome é obrigatório';
  } else if (name.trim().length < 2) {
    newErrors.name = 'Nome muito curto';
  }
  
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};
```

## Logging

**Framework:**
- Standard `console` methods only
- No external logging library

**Patterns:**
- `console.error()` for errors with context:
  ```typescript
  console.error('Erro ao buscar perfil:', error);
  console.error('Error fetching venues from Radar:', error);
  ```
- Always include descriptive context string before error object
- Use Portuguese or English consistently per file (Portuguese for user-facing, English for internal services)

**When to Log:**
- All caught errors in try/catch blocks
- Failed async operations
- API errors
- Service failures

**What NOT to Log:**
- Sensitive data (passwords, tokens, API keys)
- User PII unless necessary for debugging
- Successful operations (no "success" logs)

## Function Design

**Size:**
- Keep functions focused and small
- Extract complex logic into helper functions
- Example: validation, formatting, transformation functions

**Parameters:**
- Use object destructuring for multiple parameters
- Example: `async function searchNearbyVenues(latitude: number, longitude: number, radius: number, options: {...})`

**Return Values:**
- Consistent return types across similar functions
- Async functions return Promise with success/error pattern
- Helper functions return direct values

**Callbacks:**
- Wrap in `useCallback` when passed as props
- Include dependencies array
- Example:
```typescript
const handlePress = useCallback(() => {
  onPress?.(venue);
}, [venue, onPress]);
```

## Module Design

**Exports:**
- Named exports preferred over default exports for components and utilities
- Only use default export for Expo Router page components
- Example from `src/components/ui/Button.tsx`:
  ```typescript
  export function Button({ ... }) { ... }
  ```

**Barrel Files:**
- Used in component directories: `src/components/venue/index.ts`
- Re-export related components:
  ```typescript
  export { VenueCard } from './VenueCard';
  export { VenueCarousel } from './VenueCarousel';
  ```

**Service Files:**
- Export multiple related functions
- Example from `src/services/auth.ts`:
  ```typescript
  export async function sendEmailVerification(email: string) { ... }
  export async function confirmEmailCode(email: string, code: string) { ... }
  export async function signOut() { ... }
  ```

## Git Conventions

**Commit Messages:**
- Follow Conventional Commits specification
- Format: `type: description`

**Types:**
- `feat`: new feature
- `fix`: bug fix
- `chore`: maintenance, tooling
- `docs`: documentation changes
- `refactor`: code restructuring
- `test`: adding or updating tests

**Examples from git log:**
```
refactor: clean unfinished app flows and simplify core MVP
chore: add Codespaces config
feat: new venuecard and navigation bar style
```

**Scope (optional):**
- Can add scope: `feat(auth): add OTP verification`
- Keep concise, lowercase

**Body and Footer:**
- Optional, use for detailed explanations
- Not commonly used in this codebase

---

*Convention analysis: 2026-02-10*

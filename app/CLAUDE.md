## Tech Stack
Framework: Expo (React Native)
Language: TypeScript
Navigation: Expo Router / React Navigation
State Management: Zustand / Redux Toolkit
API Layer: tRPC / React Query / Axios
Styling: NativeWind / TailwindCSS
Forms & Validation: React Hook Form + Zod
Backend (optional): Node.js / Firebase / Supabase
Database: PostgreSQL / SQLite (Expo)
Authentication: JWT
## Project Structure
src/
│
├── app/                # Expo Router routes
├── components/         # Reusable UI components
├── features/           # Feature-based modules
│   ├── auth/
│   ├── user/
│   └── orders/
│
├── hooks/              # Custom hooks
├── lib/                # Utilities (api, helpers)
├── services/           # API services
├── store/              # Global state
├── types/              # TypeScript types
├── constants/          # App constants
└── assets/             # Images, fonts
## Coding Standards
General
Use TypeScript strictly (noImplicitAny, strict: true)
Follow ESLint + Prettier
Keep components small and reusable
Prefer functional components + hooks
Naming Conventions
Type	Format	Example
Components	PascalCase	UserCard.tsx
Hooks	camelCase (use prefix)	useAuth.ts
Files	kebab-case	user-service.ts
Constants	UPPER_CASE	API_BASE_URL
## State Management

Use Zustand for simplicity:

import { create } from 'zustand';

type Store = {
  user: string | null;
  setUser: (user: string) => void;
};

export const useUserStore = create<Store>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));
## API Layer
Preferred: tRPC + React Query
Centralize API calls
Use hooks for fetching/mutations
const { data, isLoading } = trpc.user.getProfile.useQuery();
Alternative: Axios
import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
});
## Styling
Use NativeWind (TailwindCSS)
Avoid inline styles unless dynamic
<View className="flex-1 items-center justify-center bg-white">
  <Text className="text-lg font-bold">Hello</Text>
</View>

## Forms & Validation

Use React Hook Form + Zod

const schema = z.object({
  email: z.string().email(),
});

const { control, handleSubmit } = useForm({
  resolver: zodResolver(schema),
});
## Authentication
Use secure storage (Expo SecureStore)
Store tokens safely
Refresh tokens when needed
import * as SecureStore from 'expo-secure-store';
## Performance Optimization
Use React.memo for heavy components
Lazy load screens
Avoid unnecessary re-renders
Use FlatList instead of ScrollView for large lists
## Environment Variables

Use .env with Expo:

EXPO_PUBLIC_API_URL=https://api.example.com

Access:

process.env.EXPO_PUBLIC_API_URL
## Navigation
Expo Router (Recommended)
File-based routing
Use layouts for shared UI
app/
├── _layout.tsx
├── index.tsx
└── profile.tsx
## Error Handling
Centralized error handler
Use try/catch in async calls
Show user-friendly messages
## Testing
Unit: Jest
E2E: Detox
## CI/CD
Use GitHub Actions
Auto build with Expo EAS
Example Steps:
Lint
Type check
Build
Deploy

## Build & Deployment

### Native Android Build (Gradle)

Since this project uses Expo (with prebuild / bare workflow), Android builds are handled via Gradle instead of Expo EAS.

## Prerequisites
Run Expo prebuild (only once or after config changes):
npx expo prebuild
Ensure Android environment is set up:
Android Studio
SDK + ANDROID_HOME
Java (JDK 11+)
## Generate APK (Direct Install)
cd android
./gradlew assembleRelease

Output:

android/app/build/outputs/apk/release/app-release.apk
## Generate AAB (Play Store Upload)
cd android
./gradlew bundleRelease

Output:

android/app/build/outputs/bundle/release/app-release.aab
## Signing Config (Production)

Update android/gradle.properties:

MYAPP_UPLOAD_STORE_FILE=release.keystore
MYAPP_UPLOAD_KEY_ALIAS=your-key-alias
MYAPP_UPLOAD_STORE_PASSWORD=*****
MYAPP_UPLOAD_KEY_PASSWORD=*****

Update android/app/build.gradle:

signingConfigs {
    release {
        storeFile file(MYAPP_UPLOAD_STORE_FILE)
        storePassword MYAPP_UPLOAD_STORE_PASSWORD
        keyAlias MYAPP_UPLOAD_KEY_ALIAS
        keyPassword MYAPP_UPLOAD_KEY_PASSWORD
    }
}
## Install Release Build Locally
adb install app-release.apk
## Important Notes
Always run:
npx expo prebuild

after:

adding native dependencies
changing app.json / app.config.js
Clean build if issues occur:
cd android
./gradlew clean
## CI/CD (Without EAS)

Use GitHub Actions:

- name: Build APK
  run: |
    cd android
    ./gradlew assembleRelease


## Security Best Practices
Never expose secrets in frontend
Use HTTPS always
Validate all inputs
Use secure storage
## Git Workflow
main → production
dev → staging
feature branches:
feature/auth-flow
fix/login-bug
## Commit Convention

Use Conventional Commits

feat: add login screen
fix: resolve crash on startup
refactor: optimize API calls

## Logging & Monitoring
Use Sentry / LogRocket
Track crashes and performance
## Best Practices Summary
Feature-based architecture
Reusable components
Clean API layer
Strict typing
Performance-first mindset
## Developer Notes
Always write reusable code
Avoid hardcoding values
Keep business logic separate from UI
Document complex logic
# APK Build Guide — SmartInvest

This guide covers **three methods** to build the APK for **SmartInvest** (Expo React Native app).

---

## ✅ Method 1: EAS Cloud Build (Recommended — easiest, no setup)

Builds on Expo's servers — no Android SDK required.

### Steps:

1. **Login to Expo** (create account at https://expo.dev if you don't have one)

```bash
cd frontend
npx eas login
```

2. **Build APK**

```bash
npx eas build --platform android --profile preview
```

3. **Download the APK**

Once the build completes, EAS will print a URL to download the `.apk` or `.aab` file.

---

## ✅ Method 2: EAS Local Build on WSL (Windows Subsystem for Linux)

If you have WSL2 installed:

1. Open **WSL (Ubuntu)**
2. Navigate to project: `cd /mnt/d/mobile\ invesment/Mobile-Investment/frontend`
3. Install dependencies:
```bash
npm install
```
4. Build locally:
```bash
npx eas build --platform android --profile preview --local
```

---

## ✅ Method 3: Manual APK Build (requires Android Studio)

If you have Android Studio installed:

1. **Set up Android SDK** — Install Android Studio, open SDK Manager, install SDK 35+.
2. **Set environment variables:**
```bash
set ANDROID_HOME=C:\Users\Farhan\AppData\Local\Android\Sdk
set JAVA_HOME=C:\Program Files\Android\Android Studio\jre
```
3. **Generate debug APK:**
```bash
cd frontend\android
gradlew assembleDebug
```
APK will be at: `frontend\android\app\build\outputs\apk\debug\app-debug.apk`

---

## ⚙️ Configuration Files

### app.json (already configured)
| Field | Value |
|-------|-------|
| `expo.name` | SmartInvest |
| `expo.android.package` | `com.smartinvest.app` |
| `expo.android.adaptiveIcon` | Set with splash assets |

### eas.json (already configured)
```json
{
  "build": {
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

---

## 🔗 API URL Configuration

The app points to the deployed backend API. To change it:

| File | Variable | Default |
|------|----------|---------|
| `frontend/.env` | `EXPO_PUBLIC_API_URL` | `https://mobile-investment-1.onrender.com/api` |

Create `frontend/.env`:
```
EXPO_PUBLIC_API_URL=https://your-api-url.com/api
```

---

## 📦 Output Files

| Method | Output Path |
|--------|-------------|
| EAS Cloud Build | Downloadable URL from Expo |
| EAS Local Build | `frontend/build-*.apk` |
| Manual Gradle | `frontend/android/app/build/outputs/apk/debug/app-debug.apk` |

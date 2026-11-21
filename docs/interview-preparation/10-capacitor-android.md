# 10. Capacitor & Android Native Engineering — Engaze

## Overview: Hybrid Architecture with Capacitor 8

Engaze delivers a native Android experience while maintaining a **single, unified React 18 codebase**. This is achieved using **Capacitor 8.6**, an open-source native runtime from Ionic that wraps web assets inside a hardware-accelerated Android `WebView` and bridges JavaScript calls to native Java APIs.

```
+-------------------------------------------------------------------------------+
|                       REACT 18 SINGLE PAGE APPLICATION                        |
|   (DOM Components, Context API, Socket.IO Client, WebRTC RTCPeerConnection)   |
+-------------------------------------------------------------------------------+
                                    ▲
                                    │ window.EngazeNativeNotifications (JS Interface)
                                    │ CustomEvents ('nativeFcmToken', 'nativeNotificationAction')
                                    ▼
+-------------------------------------------------------------------------------+
|                       CAPACITOR BRIDGE (MainActivity.java)                     |
|   - WebView Configuration & ChromeClient       - Notification Channels Setup  |
|   - Native Ringtone & Vibrator Service         - Google OAuth Popup Dialogs   |
|   - Full-Screen Incoming Call Intents          - Browser-Delegated APK Engine |
+-------------------------------------------------------------------------------+
                                    ▲
                                    │ Android SDK & JNI Calls
                                    ▼
+-------------------------------------------------------------------------------+
|                       ANDROID OPERATING SYSTEM (Linux Kernel)                 |
|   - Camera & Microphone Drivers                - Firebase Cloud Messaging (FCM|
|   - AudioAttributes & RingtoneManager          - Local Storage & Hardware GPU |
+-------------------------------------------------------------------------------+
```

---

## 1. How React Is Packaged into the Android APK

1. **Production Build:**
   ```bash
   npm run build
   ```
   Compiles JSX, CSS, and assets into an optimized, minified static bundle inside `frontend/build/`.
2. **Capacitor Synchronization:**
   ```bash
   npx cap sync android
   ```
   Copies the contents of `build/` into the native Android folder:
   ```
   frontend/android/app/src/main/assets/public/
   ```
   It also configures native plugins and updates `capacitor.settings.gradle`.
3. **Gradle Compilation:**
   ```bash
   cd android && ./gradlew assembleRelease
   ```
   The Android Gradle plugin packages the Java source code, AndroidManifest, assets, and native libraries into `app-release.apk`.

---

## 2. Configuration Analysis: `capacitor.config.json`

```json
{
  "appId": "com.engaze.date",
  "appName": "Engaze",
  "webDir": "build",
  "bundledWebRuntime": false,
  "server": {
    "androidScheme": "https",
    "cleartext": false
  },
  "plugins": {
    "SplashScreen": {
      "launchShowDuration": 2500,
      "launchAutoHide": true,
      "backgroundColor": "#0B0D17",
      "androidSplashResourceName": "splash",
      "androidScaleType": "CENTER_CROP",
      "showSpinner": false
    },
    "StatusBar": {
      "overlaysWebView": false,
      "style": "DARK",
      "backgroundColor": "#0B0D17"
    }
  }
}
```

### Architectural Details:
* **`androidScheme: "https"`:** Instructs Android's WebView to serve assets over `https://localhost` rather than the legacy `http://` or `capacitor://` schemes. This ensures modern web security features (such as `crypto.subtle`, secure cookies, and WebRTC `navigator.mediaDevices`) are fully operational in the WebView.
* **`cleartext: false`:** Disallows insecure HTTP traffic, enforcing SSL across all outgoing network requests.

---

## 3. Native Java Custom Bridge (`MainActivity.java`)

Rather than relying purely on generic plugins, Engaze implements custom Android enhancements directly in `MainActivity.java`:

### A. Javascript Interface (`@JavascriptInterface`)
Injects a native Java object into the browser's JavaScript execution context under `window.EngazeNativeNotifications`:
```java
public class NativeNotificationBridge {
    @JavascriptInterface
    public void requestPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            ActivityCompat.requestPermissions(MainActivity.this,
                new String[]{android.Manifest.permission.POST_NOTIFICATIONS}, 101);
        }
    }

    @JavascriptInterface
    public void cancelCall() {
        NotificationManager manager = getSystemService(NotificationManager.class);
        if (manager != null) {
            manager.cancel(CALL_NOTIF_ID);
        }
    }
}
```

### B. Two Dedicated High-Priority Notification Channels
Configured during `onCreate()` in compliance with Android 8.0+ (Oreo) notification standards:
1. **`engaze_messages` ("Messages & Matches"):**
   * Priority: `IMPORTANCE_HIGH`
   * Vibration Pattern: `[0, 250, 150, 250]`
   * Handles chat push alerts and match notifications.
2. **`engaze_calls` ("Incoming Video Calls"):**
   * Priority: `IMPORTANCE_HIGH`
   * Audio: Configured with `RingtoneManager.TYPE_RINGTONE` and `USAGE_NOTIFICATION_RINGTONE`.
   * Continuous urgent vibration pattern: `[0, 1000, 500, 1000, 500, 1000]`.

### C. Google OAuth Multi-Window Popup Handling
Google OAuth security blocks direct login inside WebViews. `MainActivity.java` overrides `BridgeWebChromeClient.onCreateWindow()`:
* Detects when Google's SDK attempts to open a login popup (`window.open`).
* Creates a transient fullscreen dialog containing a dedicated secondary `WebView`.
* Intercepts URL redirects, captures auth callbacks, and dismisses the dialog cleanly.

---

## 4. Google Play Protect Audit & Resolution

### The Security Investigation
During early mobile distribution, Google Play Protect flagged the Engaze APK with:
> *"Harmful app blocked: This app can put your device or data at risk."*

A thorough security audit identified two critical flags:
1. **The Dangerous Permission:** `AndroidManifest.xml` previously requested `android.permission.REQUEST_INSTALL_PACKAGES`. Android marks any app requesting self-package installation outside official app stores as a potential trojan/dropper.
2. **In-App Self-Installer Bridge:** `MainActivity.java` contained an internal `HttpURLConnection` streaming bridge that downloaded `.apk` binaries to internal storage and launched package installer intents.

### The Engineering Fix: Browser-Delegated Update Architecture
1. **Removed Dangerous Permission:** Completely excised `REQUEST_INSTALL_PACKAGES` from `AndroidManifest.xml`.
2. **Removed Native Self-Installer:** Deleted the internal byte-streaming downloader and `FileProvider` APK installation intents from `MainActivity.java`.
3. **Browser-Delegated Download Engine (`AppUpdateChecker.jsx`):**
   * When an update is detected, the "Update Now" button delegates download directly to the user's default system browser via Android's native view intent:
     ```java
     Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
     intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
     MainActivity.this.startActivity(intent);
     ```
   * The system browser (Chrome/Firefox) downloads the verified APK from GitHub Releases, completely eliminating malicious dropper heuristics.

---

## 5. Automated CI/CD Release Signing (`.github/workflows/build-apk.yml`)

Engaze features an automated GitHub Actions pipeline that produces cryptographically verified release APKs:

```
[ Git Push to main ]  ──>  GitHub Actions Runner (Ubuntu Latest)
                                │
                                ├── 1. Setup Java 21 & Node.js 22
                                ├── 2. npm ci && npm run build
                                ├── 3. npx cap sync android
                                ├── 4. Decode Persistent Keystore (Base64)
                                ├── 5. ./gradlew assembleRelease
                                ├── 6. Verify SHA-256 Fingerprint
                                └── 7. Publish to GitHub Releases (Engaze.apk)
```

### Signature Verification Step:
Before publishing, the CI runner inspects the compiled APK binary and verifies its cryptographic X.509 certificate matches the permanent Engaze SHA-256 fingerprint:
```
04:CA:D7:6B:10:14:E3:34:F9:26:88:5A:D1:12:78:BA:21:04:6D:A1:52:16:5B:29:D0:68:7C:9A:43:77:F9:D1
```
If the fingerprint fails to match, the pipeline immediately aborts, preventing certificate mismatches that would prevent users from updating.

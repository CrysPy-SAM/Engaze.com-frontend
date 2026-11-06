# Engaze Android: Permanent Signing Keystore & Recovery Guide

---

## 1. Overview & Security Architecture

Android OS strictly validates that updates to an installed application (`com.engaze.date`) must be cryptographically signed by the **exact same private key** as the currently installed package. If a new APK is signed with a different key, Android will block the installation with:
```text
INSTALL_FAILED_UPDATE_INCOMPATIBLE: Package com.engaze.date signatures do not match previously installed version
```

To prevent this issue, Engaze uses a **dedicated persistent production keystore**:
- **Keystore File:** `engaze-release.jks`
- **Key Alias:** `engaze`
- **Key Algorithm:** RSA 2048-bit
- **Validity:** 10,000 days (~27 years, valid through year 2054)
- **Distinguished Name:** `CN=Engaze, OU=Mobile Production, O=Engaze Dating, L=San Francisco, ST=California, C=US`

---

## 2. Permanent Certificate Fingerprints

Every official Engaze Android APK produced by local builds or GitHub Actions must match these exact fingerprints:

```text
Certificate SHA-256:
04:CA:D7:6B:10:14:E3:34:F9:26:88:5A:D1:12:78:BA:21:04:6D:A1:52:16:5B:29:D0:68:7C:9A:43:77:F9:D1

Certificate SHA-1:
12:6E:C2:B7:B2:0A:A5:14:B5:52:58:3F:A0:C1:3A:99:68:AD:9F:0B

Certificate MD5:
15:A5:DB:AE:E4:9E:9D:39:BF:A9:04:72:12:C5:B6:59
```

---

## 3. GitHub Secrets Configuration (Manual Step Required)

To enable GitHub Actions to sign every future release with this permanent key without checking the keystore into Git:

1. Open your GitHub Repository: **`Engaze.com-frontend`**.
2. Navigate to: **Settings** -> **Secrets and variables** -> **Actions**.
3. Under **Repository secrets**, click **New repository secret** and add the following 4 secrets:

| Secret Name | Value Description | Where to get it |
| :--- | :--- | :--- |
| `ENGAZE_KEYSTORE_BASE64` | The complete Base64 string of `engaze-release.jks` | Copied from `frontend/android/app/engaze-keystore-base64.txt` |
| `KEYSTORE_PASSWORD` | The master password for `engaze-release.jks` | Located in `frontend/android/app/.env.signing` |
| `KEY_ALIAS` | `engaze` | Key alias string (`engaze`) |
| `KEY_PASSWORD` | The password for private key `engaze` | Located in `frontend/android/app/.env.signing` (same as `KEYSTORE_PASSWORD`) |

> [!CAUTION]
> **NEVER commit `engaze-release.jks`, `.env.signing`, or `engaze-keystore-base64.txt` to GitHub!** Both files are strictly ignored by `.gitignore`.

---

## 4. Keystore Backup & Disaster Recovery

If the file `engaze-release.jks` is lost and no backup exists, you will permanently lose the ability to update the app for existing users.

### Recommended Backup Strategy:
1. **Secure Offline Backup:** Copy `frontend/android/app/engaze-release.jks` to a secure offline encrypted drive (BitLocker / FileVault / VeraCrypt) or an offline USB drive.
2. **Password Manager:** Store the keystore password and the Base64 string (`engaze-keystore-base64.txt`) in your team's secure password vault (e.g. 1Password / Bitwarden).
3. **Restoring from Base64:** If you ever set up a new development machine, you can recreate the keystore from the GitHub Secret:
   ```bash
   # On Linux/macOS:
   echo "<PASTE_BASE64_STRING>" | base64 -d > frontend/android/app/engaze-release.jks

   # On Windows (PowerShell):
   [System.IO.File]::WriteAllBytes("frontend/android/app/engaze-release.jks", [System.Convert]::FromBase64String("<PASTE_BASE64_STRING>"))
   ```

---

## 5. Verification Commands for Any Future APK

Before publishing any APK, verify that its SHA-256 matches `04:CA:D7:6B:...`:

### Method 1: Using Java `keytool`
```powershell
keytool -printcert -jarfile "frontend\android\app\build\outputs\apk\debug\app-debug.apk"
```

### Method 2: Using Node.js (APK Signature Scheme v2)
```bash
node --input-type=module -e "
import fs from 'fs';
import crypto from 'crypto';
const buf = fs.readFileSync('frontend/android/app/build/outputs/apk/debug/app-debug.apk');
for (let i = 0; i < buf.length - 1000; i++) {
  if (buf[i] === 0x30 && buf[i+1] === 0x82) {
    const len = (buf[i+2] << 8) | buf[i+3];
    if (len > 300 && len < 2500) {
      try {
        const cert = new crypto.X509Certificate(buf.subarray(i, i + 4 + len));
        if (cert.subject.includes('Engaze')) {
          console.log('SHA-256:', cert.fingerprint256);
          break;
        }
      } catch (e) {}
    }
  }
}
"
```
If the SHA-256 matches `04:CA:D7:6B:10:14:E3:34:F9:26:88:5A:D1:12:78:BA:21:04:6D:A1:52:16:5B:29:D0:68:7C:9A:43:77:F9:D1`, the update is guaranteed to install seamlessly over existing installations!


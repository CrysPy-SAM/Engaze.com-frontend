import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Robust ESM-compatible path resolution relative to this script's directory
const appDir = path.resolve(__dirname, "../android/app");
const keystorePath = path.join(appDir, "engaze-release.jks");
const envSigningPath = path.join(appDir, ".env.signing");
const base64ExportPath = path.join(appDir, "engaze-keystore-base64.txt");

const EXPECTED_SHA256 = "04:CA:D7:6B:10:14:E3:34:F9:26:88:5A:D1:12:78:BA:21:04:6D:A1:52:16:5B:29:D0:68:7C:9A:43:77:F9:D1";

const isVerifyOnly = process.argv.includes("--verify-only") || process.argv.includes("--check");
const alias = process.env.ENGAZE_KEY_ALIAS || "engaze";
const keystoreExists = fs.existsSync(keystorePath);

// Resolve password securely without guessing or overwriting
let password = process.env.ENGAZE_KEYSTORE_PASSWORD;
if (!password && fs.existsSync(envSigningPath)) {
    try {
        const envContent = fs.readFileSync(envSigningPath, "utf-8");
        const match = envContent.match(/ENGAZE_KEYSTORE_PASSWORD=(.+)/);
        if (match && match[1]) {
            password = match[1].trim();
        }
    } catch {}
}

if (keystoreExists) {
    if (!password) {
        console.error("::error::[Keystore] Keystore exists at " + keystorePath + ", but ENGAZE_KEYSTORE_PASSWORD is not set. Refusing to alter credentials.");
        process.exit(1);
    }
    console.log(`[Keystore] Existing permanent keystore found at: ${keystorePath}`);
    console.log("[Keystore] Safeguard active: Existing keystore will NOT be regenerated or overwritten.");
} else {
    if (isVerifyOnly) {
        console.error("::error::[Keystore] Keystore does not exist at " + keystorePath + ". Verification failed.");
        process.exit(1);
    }

    // Generate a strong random password ONLY when creating a brand-new keystore from scratch
    if (!password) {
        password = crypto.randomBytes(24).toString("hex");
    }
    console.log(`[Keystore] Generating new permanent keystore: ${keystorePath}`);

    // Pass passwords via environment variables to keytool rather than command-line arguments
    const keytoolEnv = {
        ...process.env,
        KEYTOOL_STOREPASS: password,
        KEYTOOL_KEYPASS: password,
    };

    const args = [
        "-genkeypair",
        "-v",
        "-keystore", keystorePath,
        "-alias", alias,
        "-keyalg", "RSA",
        "-keysize", "2048",
        "-validity", "10000",
        "-dname", "CN=Engaze, OU=Mobile Production, O=Engaze Dating, L=San Francisco, ST=California, C=US",
        "-storepass:env", "KEYTOOL_STOREPASS",
        "-keypass:env", "KEYTOOL_KEYPASS",
    ];

    const result = spawnSync("keytool", args, {
        env: keytoolEnv,
        stdio: ["ignore", "pipe", "pipe"],
        encoding: "utf-8",
    });

    if (result.status !== 0) {
        console.error("::error::[Keystore] Failed to generate keystore with keytool.");
        if (result.stderr) console.error(result.stderr);
        process.exit(1);
    }
    console.log("[Keystore] Keystore successfully created!");
}

// -------------------------------------------------------------
// STEP 1: VALIDATE BEFORE WRITING OR MODIFYING ANY FILES
// -------------------------------------------------------------
const listEnv = {
    ...process.env,
    KEYTOOL_STOREPASS: password,
};

const certResult = spawnSync("keytool", [
    "-list",
    "-v",
    "-keystore", keystorePath,
    "-alias", alias,
    "-storepass:env", "KEYTOOL_STOREPASS",
], {
    env: listEnv,
    encoding: "utf-8",
    stdio: ["ignore", "pipe", "pipe"],
});

if (certResult.status !== 0) {
    console.error("::error::[Keystore] Validation failed! Could not unlock keystore with alias '" + alias + "'. Password or alias is incorrect.");
    if (certResult.stderr) console.error(certResult.stderr.trim());
    process.exit(1);
}

const lines = certResult.stdout ? certResult.stdout.split("\n") : [];
const sha1Line = lines.find((l) => l.trim().startsWith("SHA1:"))?.trim();
const sha256Line = lines.find((l) => l.trim().startsWith("SHA256:"))?.trim();
const rawSha256 = sha256Line ? sha256Line.replace(/^SHA256:\s*/i, "").trim() : "";

console.log("=================================================");
console.log(" Permanent Production Certificate Fingerprints:");
if (sha1Line) console.log(`   ${sha1Line}`);
if (sha256Line) console.log(`   ${sha256Line}`);
console.log("=================================================");

// CRITICAL REQUIREMENT 1: If fingerprint does not match exactly, exit with code 1.
if (rawSha256 !== EXPECTED_SHA256) {
    console.error(`::error::[Keystore] CRITICAL: Keystore SHA-256 fingerprint does NOT match expected production identity!`);
    console.error(`   Expected : ${EXPECTED_SHA256}`);
    console.error(`   Actual   : ${rawSha256 || "None found"}`);
    console.error(`Refusing to write credentials or certify invalid keystore.`);
    process.exit(1);
}

console.log(" [Verified] Keystore matches official permanent SHA-256 fingerprint.");

if (isVerifyOnly) {
    console.log("[Keystore] Verify-only mode complete. All checks passed. No files modified.");
    process.exit(0);
}

// -------------------------------------------------------------
// STEP 2: WRITE / REFRESH CONFIG FILES ONLY AFTER VALIDATION PASSED
// -------------------------------------------------------------
const envContent = [
    `ENGAZE_KEYSTORE_PATH=engaze-release.jks`,
    `ENGAZE_KEYSTORE_PASSWORD=${password}`,
    `ENGAZE_KEY_ALIAS=${alias}`,
    `ENGAZE_KEY_PASSWORD=${password}`,
].join("\n") + "\n";

fs.writeFileSync(envSigningPath, envContent, { mode: 0o600 });
console.log(`[Keystore] Local signing configuration verified: ${envSigningPath}`);

const keystoreBytes = fs.readFileSync(keystorePath);
const base64Str = keystoreBytes.toString("base64");
fs.writeFileSync(base64ExportPath, base64Str, { mode: 0o600 });
console.log(`[Keystore] Exported Base64 secret file: ${base64ExportPath}`);

/**
 * Photo Upload Utilities & Workflow Engine
 * Handles client-side validation, error parsing, and upload pipeline orchestration
 * for Engaze.com profile photos.
 */

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5MB
export const MAX_PHOTOS_COUNT = 6;

/**
 * Validate image file on client side before upload.
 * Server validation remains authoritative.
 *
 * @param {File|Blob|object} file
 * @returns {{ valid: boolean, error?: string }}
 */
export function validatePhotoFile(file) {
    if (!file) {
        return { valid: false, error: "No image file selected." };
    }

    if (typeof file.size !== "number" || file.size <= 0) {
        return { valid: false, error: "The selected file is empty." };
    }

    if (file.size > MAX_PHOTO_BYTES) {
        return {
            valid: false,
            error: `File size exceeds the 5MB maximum limit (${formatFileSize(file.size)}). Please choose a smaller image.`,
        };
    }

    // MIME type check
    const mime = (file.type || "").toLowerCase();
    const hasValidMime = ALLOWED_IMAGE_TYPES.includes(mime);

    // Extension fallback check if MIME type is generic
    const fileName = (file.name || "").toLowerCase();
    const hasValidExt = ALLOWED_EXTENSIONS.some((ext) => fileName.endsWith(ext));

    if (!hasValidMime && !hasValidExt) {
        return {
            valid: false,
            error: "Unsupported image format. Please select a JPEG, PNG, or WebP image.",
        };
    }

    return { valid: true };
}

/**
 * Format bytes into human-readable string.
 *
 * @param {number} bytes
 * @returns {string}
 */
export function formatFileSize(bytes) {
    if (typeof bytes !== "number" || isNaN(bytes) || bytes < 0) return "0 B";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Parse and translate upload errors into user-friendly messages.
 * Catches HTTP 503 and STORAGE_UNAVAILABLE to explain unconfigured storage safely.
 *
 * @param {any} err
 * @returns {{ message: string, code?: string, status?: number }}
 */
export function parseUploadError(err) {
    const status = err?.status || err?.response?.status;
    const code = err?.code || err?.response?.data?.code;
    const rawMessage = err?.response?.data?.message || err?.message || "";

    // 1. Storage unconfigured / 503 Service Unavailable
    if (
        status === 503 ||
        code === "STORAGE_UNAVAILABLE" ||
        rawMessage.includes("STORAGE_UNAVAILABLE") ||
        rawMessage.includes("cloud storage") ||
        rawMessage.includes("temporarily unavailable")
    ) {
        return {
            status: 503,
            code: "STORAGE_UNAVAILABLE",
            message:
                "Profile photo uploads are currently unavailable because cloud storage has not been configured by the system administrator.",
        };
    }

    // 2. Authentication failure
    if (status === 401 || rawMessage.includes("unauthorized") || rawMessage.includes("authenticate")) {
        return {
            status: 401,
            code: "UNAUTHORIZED",
            message: "Authentication required. Please log in again to upload photos.",
        };
    }

    // 3. Rate limiting
    if (status === 429) {
        return {
            status: 429,
            code: "RATE_LIMITED",
            message: "Too many upload attempts. Please wait a few minutes before trying again.",
        };
    }

    // 4. File rejected or payload too large
    if (status === 413 || status === 422) {
        return {
            status,
            code: "INVALID_IMAGE",
            message: rawMessage || "The image file was rejected as malformed, oversized, or unsupported.",
        };
    }

    // 5. General Bad Request or server error
    return {
        status: status || 500,
        code: code || "UPLOAD_FAILED",
        message: rawMessage || "Photo upload failed. Please try again.",
    };
}

/**
 * Orchestrate the full 3-step profile photo upload flow:
 *   1. Request upload authorization token & pre-signed URL from backend
 *   2. Upload binary payload to provider URL (S3 / R2 / dev-mock)
 *   3. Confirm upload with backend to verify object and atomically update profile
 *
 * If ANY step fails, existing profile photos remain preserved.
 *
 * @param {object} params
 * @param {File|Blob} params.file The image file to upload
 * @param {number} [params.targetIndex] Optional target photo slot index (0..5)
 * @param {Function} params.requestUploadUrlFn Function calling POST /users/profile/photo/upload-url
 * @param {Function} params.uploadBinaryFn Function executing PUT to presigned URL
 * @param {Function} params.confirmUploadFn Function calling POST /users/profile/photo/confirm
 * @param {Function} [params.onProgress] Optional progress callback (percent: 0..100)
 * @returns {Promise<{ success: boolean, photos: string[], publicUrl: string }>}
 */
export async function executePhotoUploadFlow({
    file,
    targetIndex,
    requestUploadUrlFn,
    uploadBinaryFn,
    confirmUploadFn,
    onProgress,
}) {
    // Step 0: Client-side preflight validation
    const validation = validatePhotoFile(file);
    if (!validation.valid) {
        const error = new Error(validation.error);
        error.code = "CLIENT_VALIDATION_ERROR";
        error.step = "client_validation";
        throw error;
    }

    if (typeof onProgress === "function") {
        onProgress(5);
    }

    // Step 1: Request signed upload authorization from backend
    let authData;
    try {
        const response = await requestUploadUrlFn({
            filename: file.name || "photo.jpg",
            contentType: file.type || "image/jpeg",
            fileSize: file.size,
            targetIndex: targetIndex !== undefined && targetIndex !== null ? Number(targetIndex) : undefined,
        });

        authData = response?.data || response;
        if (!authData || !authData.uploadUrl || !authData.uploadToken) {
            throw new Error("Invalid response received from upload authorization service.");
        }
    } catch (err) {
        const parsed = parseUploadError(err);
        const error = new Error(parsed.message);
        error.status = parsed.status;
        error.code = parsed.code;
        error.step = "request_authorization";
        throw error;
    }

    if (typeof onProgress === "function") {
        onProgress(25);
    }

    // Step 2: Upload binary payload to provider URL
    try {
        await uploadBinaryFn(
            authData.uploadUrl,
            file,
            (percent) => {
                if (typeof onProgress === "function") {
                    // Map provider progress (0..100) to overall progress (25..85)
                    const overall = 25 + Math.round((percent * 60) / 100);
                    onProgress(Math.min(overall, 85));
                }
            }
        );
    } catch (err) {
        const parsed = parseUploadError(err);
        const error = new Error(`Failed to upload photo to storage provider: ${parsed.message}`);
        error.status = parsed.status;
        error.code = parsed.code;
        error.step = "provider_upload";
        throw error;
    }

    if (typeof onProgress === "function") {
        onProgress(90);
    }

    // Step 3: Confirm upload with backend
    let confirmResult;
    try {
        const response = await confirmUploadFn({
            key: authData.key,
            uploadToken: authData.uploadToken,
            targetIndex: authData.targetIndex !== undefined ? authData.targetIndex : targetIndex,
        });

        confirmResult = response?.data || response;
        if (!confirmResult || !confirmResult.photos) {
            throw new Error("Server confirmed upload but returned invalid profile photos data.");
        }
    } catch (err) {
        const parsed = parseUploadError(err);
        const error = new Error(`Failed to confirm photo upload: ${parsed.message}`);
        error.status = parsed.status;
        error.code = parsed.code;
        error.step = "confirm";
        throw error;
    }

    if (typeof onProgress === "function") {
        onProgress(100);
    }

    return {
        success: true,
        photos: confirmResult.photos,
        publicUrl: confirmResult.publicUrl || authData.publicUrl,
    };
}


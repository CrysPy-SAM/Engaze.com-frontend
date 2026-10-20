import {
    validatePhotoFile,
    formatFileSize,
    parseUploadError,
    executePhotoUploadFlow,
    ALLOWED_IMAGE_TYPES,
    ALLOWED_EXTENSIONS,
    MAX_PHOTO_BYTES,
    MAX_PHOTOS_COUNT,
} from "./photoUpload";

describe("Photo Upload Engine & Safety Tests (Prompt 14.3)", () => {
    describe("1. Constants & Limits", () => {
        test("allows only JPEG, PNG, and WebP formats", () => {
            expect(ALLOWED_IMAGE_TYPES).toEqual(["image/jpeg", "image/png", "image/webp"]);
            expect(ALLOWED_EXTENSIONS).toEqual([".jpg", ".jpeg", ".png", ".webp"]);
        });

        test("enforces maximum file size of 5MB", () => {
            expect(MAX_PHOTO_BYTES).toBe(5 * 1024 * 1024);
        });

        test("enforces maximum 6 photo slots", () => {
            expect(MAX_PHOTOS_COUNT).toBe(6);
        });
    });

    describe("2. File Validation and Size Limits", () => {
        test("accepts valid JPEG image", () => {
            const file = { name: "portrait.jpg", type: "image/jpeg", size: 1024 * 500 };
            const result = validatePhotoFile(file);
            expect(result.valid).toBe(true);
            expect(result.error).toBeUndefined();
        });

        test("accepts valid PNG image", () => {
            const file = { name: "avatar.png", type: "image/png", size: 1024 * 1024 };
            const result = validatePhotoFile(file);
            expect(result.valid).toBe(true);
        });

        test("accepts valid WebP image", () => {
            const file = { name: "photo.webp", type: "image/webp", size: 1024 * 200 };
            const result = validatePhotoFile(file);
            expect(result.valid).toBe(true);
        });

        test("rejects missing or null file", () => {
            expect(validatePhotoFile(null).valid).toBe(false);
            expect(validatePhotoFile(undefined).valid).toBe(false);
            expect(validatePhotoFile({}).valid).toBe(false);
        });

        test("rejects 0-byte empty file", () => {
            const emptyFile = { name: "empty.jpg", type: "image/jpeg", size: 0 };
            const result = validatePhotoFile(emptyFile);
            expect(result.valid).toBe(false);
            expect(result.error).toMatch(/empty/i);
        });

        test("rejects oversized file (>5MB)", () => {
            const bigFile = { name: "huge.jpg", type: "image/jpeg", size: 5 * 1024 * 1024 + 1 };
            const result = validatePhotoFile(bigFile);
            expect(result.valid).toBe(false);
            expect(result.error).toMatch(/5MB maximum limit/i);
        });

        test("rejects unsupported MIME types (SVG, GIF, PDF, HTML, EXE)", () => {
            const unsupported = [
                { name: "image.svg", type: "image/svg+xml", size: 1024 },
                { name: "anim.gif", type: "image/gif", size: 2048 },
                { name: "doc.pdf", type: "application/pdf", size: 4096 },
                { name: "page.html", type: "text/html", size: 512 },
                { name: "malicious.exe", type: "application/x-msdownload", size: 1024 },
            ];

            unsupported.forEach((file) => {
                const result = validatePhotoFile(file);
                expect(result.valid).toBe(false);
                expect(result.error).toMatch(/Unsupported image format/i);
            });
        });

        test("formats file sizes accurately", () => {
            expect(formatFileSize(0)).toBe("0 B");
            expect(formatFileSize(500)).toBe("500 B");
            expect(formatFileSize(1024)).toBe("1.0 KB");
            expect(formatFileSize(1024 * 512)).toBe("512.0 KB");
            expect(formatFileSize(1024 * 1024 * 2.5)).toBe("2.5 MB");
            expect(formatFileSize(null)).toBe("0 B");
            expect(formatFileSize(-10)).toBe("0 B");
        });
    });

    describe("3. Error Parsing and HTTP 503 Fail-Closed Safety", () => {
        test("maps HTTP 503 and STORAGE_UNAVAILABLE to clear explanation", () => {
            const err503 = {
                status: 503,
                code: "STORAGE_UNAVAILABLE",
                message: "Photo storage service is temporarily unavailable. Cloud storage provider is not configured.",
            };
            const parsed = parseUploadError(err503);
            expect(parsed.status).toBe(503);
            expect(parsed.code).toBe("STORAGE_UNAVAILABLE");
            expect(parsed.message).toContain("cloud storage has not been configured");
        });

        test("detects storage unavailable from nested response body", () => {
            const axiosErr = {
                response: {
                    status: 503,
                    data: {
                        success: false,
                        code: "STORAGE_UNAVAILABLE",
                        message: "Storage not configured",
                    },
                },
            };
            const parsed = parseUploadError(axiosErr);
            expect(parsed.status).toBe(503);
            expect(parsed.code).toBe("STORAGE_UNAVAILABLE");
            expect(parsed.message).toContain("cloud storage has not been configured");
        });

        test("maps 401 Unauthorized to authentication message", () => {
            const authErr = { status: 401, message: "Token expired" };
            const parsed = parseUploadError(authErr);
            expect(parsed.status).toBe(401);
            expect(parsed.code).toBe("UNAUTHORIZED");
            expect(parsed.message).toMatch(/Authentication required/i);
        });

        test("maps 429 to rate limiting message", () => {
            const rateErr = { status: 429, message: "Too many requests" };
            const parsed = parseUploadError(rateErr);
            expect(parsed.status).toBe(429);
            expect(parsed.code).toBe("RATE_LIMITED");
            expect(parsed.message).toMatch(/Too many upload attempts/i);
        });
    });

    describe("4. Upload Flow Orchestration & Safety Guarantees", () => {
        const validFile = {
            name: "profile.jpg",
            type: "image/jpeg",
            size: 1024 * 250,
        };

        const mockAuthData = {
            provider: "dev-mock",
            uploadUrl: "https://mock.storage/upload/photo123",
            publicUrl: "https://mock.storage/media/photo123.jpg",
            key: "profile-photos/user1/photo123.jpg",
            uploadToken: "mock.token.signature",
            maxSizeBytes: 5 * 1024 * 1024,
            targetIndex: 0,
        };

        test("successful 3-step upload pipeline with progress reporting", async () => {
            const progressUpdates = [];
            const mockRequestUrl = jest.fn().mockResolvedValue({ data: mockAuthData });
            const mockUploadBinary = jest.fn().mockImplementation((url, file, progressCb) => {
                progressCb(50);
                progressCb(100);
                return Promise.resolve({ ok: true });
            });
            const mockConfirm = jest.fn().mockResolvedValue({
                data: {
                    success: true,
                    photos: [mockAuthData.publicUrl],
                    publicUrl: mockAuthData.publicUrl,
                },
            });

            const result = await executePhotoUploadFlow({
                file: validFile,
                targetIndex: 0,
                requestUploadUrlFn: mockRequestUrl,
                uploadBinaryFn: mockUploadBinary,
                confirmUploadFn: mockConfirm,
                onProgress: (p) => progressUpdates.push(p),
            });

            // Verify steps executed in sequence
            expect(mockRequestUrl).toHaveBeenCalledWith({
                filename: "profile.jpg",
                contentType: "image/jpeg",
                fileSize: validFile.size,
                targetIndex: 0,
            });
            expect(mockUploadBinary).toHaveBeenCalledWith(
                mockAuthData.uploadUrl,
                validFile,
                expect.any(Function)
            );
            expect(mockConfirm).toHaveBeenCalledWith({
                key: mockAuthData.key,
                uploadToken: mockAuthData.uploadToken,
                targetIndex: 0,
            });

            // Verify progress milestones reached
            expect(progressUpdates).toContain(5);
            expect(progressUpdates).toContain(25);
            expect(progressUpdates).toContain(100);

            // Verify result
            expect(result.success).toBe(true);
            expect(result.photos).toEqual([mockAuthData.publicUrl]);
            expect(result.publicUrl).toBe(mockAuthData.publicUrl);
        });

        test("stops immediately on client validation error before network call", async () => {
            const badFile = { name: "virus.exe", type: "application/octet-stream", size: 100 };
            const mockRequestUrl = jest.fn();
            const mockUploadBinary = jest.fn();
            const mockConfirm = jest.fn();

            await expect(
                executePhotoUploadFlow({
                    file: badFile,
                    requestUploadUrlFn: mockRequestUrl,
                    uploadBinaryFn: mockUploadBinary,
                    confirmUploadFn: mockConfirm,
                })
            ).rejects.toThrow(/Unsupported image format/i);

            expect(mockRequestUrl).not.toHaveBeenCalled();
            expect(mockUploadBinary).not.toHaveBeenCalled();
            expect(mockConfirm).not.toHaveBeenCalled();
        });

        test("HTTP 503 from upload authorization fails safely without binary upload", async () => {
            const mockRequestUrl = jest.fn().mockRejectedValue({
                status: 503,
                code: "STORAGE_UNAVAILABLE",
                message: "Cloud storage provider is not configured.",
            });
            const mockUploadBinary = jest.fn();
            const mockConfirm = jest.fn();

            let caughtError;
            try {
                await executePhotoUploadFlow({
                    file: validFile,
                    requestUploadUrlFn: mockRequestUrl,
                    uploadBinaryFn: mockUploadBinary,
                    confirmUploadFn: mockConfirm,
                });
            } catch (err) {
                caughtError = err;
            }

            expect(caughtError).toBeDefined();
            expect(caughtError.status).toBe(503);
            expect(caughtError.code).toBe("STORAGE_UNAVAILABLE");
            expect(caughtError.message).toContain("cloud storage has not been configured");

            // Binary upload and confirmation MUST NOT be invoked
            expect(mockUploadBinary).not.toHaveBeenCalled();
            expect(mockConfirm).not.toHaveBeenCalled();
        });

        test("Authorization failure (401) stops flow safely", async () => {
            const mockRequestUrl = jest.fn().mockRejectedValue({
                status: 401,
                message: "Unauthorized",
            });
            const mockUploadBinary = jest.fn();
            const mockConfirm = jest.fn();

            await expect(
                executePhotoUploadFlow({
                    file: validFile,
                    requestUploadUrlFn: mockRequestUrl,
                    uploadBinaryFn: mockUploadBinary,
                    confirmUploadFn: mockConfirm,
                })
            ).rejects.toThrow(/Authentication required/i);

            expect(mockUploadBinary).not.toHaveBeenCalled();
            expect(mockConfirm).not.toHaveBeenCalled();
        });

        test("Provider binary upload failure stops flow before confirmation", async () => {
            const mockRequestUrl = jest.fn().mockResolvedValue({ data: mockAuthData });
            const mockUploadBinary = jest.fn().mockRejectedValue(new Error("Network connection dropped during S3 PUT"));
            const mockConfirm = jest.fn();

            let caughtError;
            try {
                await executePhotoUploadFlow({
                    file: validFile,
                    requestUploadUrlFn: mockRequestUrl,
                    uploadBinaryFn: mockUploadBinary,
                    confirmUploadFn: mockConfirm,
                });
            } catch (err) {
                caughtError = err;
            }

            expect(caughtError).toBeDefined();
            expect(caughtError.step).toBe("provider_upload");
            expect(caughtError.message).toContain("Failed to upload photo to storage provider");

            // Confirm MUST NOT be called if binary upload failed
            expect(mockConfirm).not.toHaveBeenCalled();
        });

        test("Backend confirmation failure preserves previous photos", async () => {
            const mockRequestUrl = jest.fn().mockResolvedValue({ data: mockAuthData });
            const mockUploadBinary = jest.fn().mockResolvedValue({ ok: true });
            const mockConfirm = jest.fn().mockRejectedValue({
                status: 400,
                message: "Uploaded photo not found in storage. Object must be uploaded before confirmation.",
            });

            // Simulate caller maintaining an existing photo list
            const initialPhotos = ["https://images.unsplash.com/photo-existing-1"];
            let currentPhotos = [...initialPhotos];

            try {
                const result = await executePhotoUploadFlow({
                    file: validFile,
                    requestUploadUrlFn: mockRequestUrl,
                    uploadBinaryFn: mockUploadBinary,
                    confirmUploadFn: mockConfirm,
                });
                // If successful, caller would update
                currentPhotos = result.photos;
            } catch (err) {
                expect(err.step).toBe("confirm");
                expect(err.message).toContain("Uploaded photo not found in storage");
            }

            // Existing photos array must remain untouched
            expect(currentPhotos).toEqual(initialPhotos);
        });
    });
});


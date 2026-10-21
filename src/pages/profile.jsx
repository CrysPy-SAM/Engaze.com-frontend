import React, { useContext, useEffect, useRef, useState } from "react";
import withAuth from "../utils/withAuth";
import { AuthContext } from "../contexts/AuthContext";
import Navbar from "../components/Navbar";
import { BRAND_COLORS } from "../theme";
import "../App.css";
import {
    Alert,
    Avatar,
    Box,
    Button,
    Card,
    Chip,
    CircularProgress,
    Container,
    FormControl,
    Grid,
    IconButton,
    InputLabel,
    LinearProgress,
    MenuItem,
    Paper,
    Select,
    Slider,
    Snackbar,
    Stack,
    Tab,
    Tabs,
    TextField,
    Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import PersonIcon from "@mui/icons-material/Person";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import SparklesIcon from "@mui/icons-material/AutoAwesome";
import PreviewIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import StarIcon from "@mui/icons-material/Star";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import RefreshIcon from "@mui/icons-material/Refresh";
import CloseIcon from "@mui/icons-material/Close";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import {
    validatePhotoFile,
    formatFileSize,
    parseUploadError,
    executePhotoUploadFlow,
    MAX_PHOTOS_COUNT,
} from "../utils/photoUpload";

const SUGGESTED_INTERESTS = [
    "Travel ✈️",
    "Coffee ☕",
    "Music 🎵",
    "Fitness 🏋️",
    "Foodie 🍕",
    "Gaming 🎮",
    "Photography 📷",
    "Art 🎨",
    "Books 📚",
    "Hiking 🏔️",
    "Movies 🎬",
    "Yoga 🧘",
];

function ProfilePage() {
    const {
        getProfile,
        updateProfile,
        requestPhotoUploadUrl,
        uploadPhotoBinary,
        confirmPhotoUpload,
        deleteProfilePhoto,
        userData,
    } = useContext(AuthContext);

    // Profile form state
    const [name, setName] = useState(userData?.name || "");
    const [username, setUsername] = useState(userData?.username || "");
    const [dob, setDob] = useState(() => {
        if (!userData?.dob) return "";
        const d = new Date(userData.dob);
        return !isNaN(d.getTime()) ? d.toISOString().split("T")[0] : "";
    });
    const [gender, setGender] = useState(userData?.gender || "");
    const [bio, setBio] = useState(userData?.bio || "");
    const [photos, setPhotos] = useState(userData?.photos || []);
    const [photoInput, setPhotoInput] = useState("");
    const [interests, setInterests] = useState(userData?.interests || []);
    const [interestInput, setInterestInput] = useState("");
    const [interestedIn, setInterestedIn] = useState(["everyone"]);
    const [ageRange, setAgeRange] = useState([18, 50]);
    const [isProfileComplete, setIsProfileComplete] = useState(false);

    // Photo upload pipeline state
    const fileInputRef = useRef(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [filePreviewUrl, setFilePreviewUrl] = useState(null);
    const [targetSlot, setTargetSlot] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadError, setUploadError] = useState(null);
    const [uploadErrorCode, setUploadErrorCode] = useState(null);
    const [isDeletingIndex, setIsDeletingIndex] = useState(null);
    const [showUrlInput, setShowUrlInput] = useState(false);

    // UI state
    const [activeTab, setActiveTab] = useState(0); // 0 = Edit, 1 = Live Match Card Preview
    const [loading, setLoading] = useState(!userData);
    const [saving, setSaving] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");
    const [alertSeverity, setAlertSeverity] = useState("info");
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [previewPhotoIndex, setPreviewPhotoIndex] = useState(0);

    // Calculate age from dob string
    const calculateAge = (dobString) => {
        if (!dobString) return null;
        const birthDate = new Date(dobString);
        if (isNaN(birthDate.getTime())) return null;
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    const currentAge = calculateAge(dob);

    // Calculate completion score
    const calculateCompletionScore = () => {
        let score = 0;
        if (name.trim()) score += 20;
        if (dob && currentAge >= 18) score += 15;
        if (gender) score += 15;
        if (bio.trim().length >= 10) score += 20;
        if (photos.length > 0) score += 20;
        if (interests.length >= 3) score += 10;
        return Math.min(score, 100);
    };

    const completionScore = calculateCompletionScore();

    // Fetch profile on mount
    useEffect(() => {
        let isMounted = true;
        const loadProfile = async () => {
            try {
                const profile = await getProfile();
                if (isMounted && profile) {
                    setName(profile.name || "");
                    setUsername(profile.username || "");
                    if (profile.dob) {
                        const dateObj = new Date(profile.dob);
                        if (!isNaN(dateObj.getTime())) {
                            setDob(dateObj.toISOString().split("T")[0]);
                        }
                    }
                    setGender(profile.gender || "");
                    setBio(profile.bio || "");
                    setPhotos(profile.photos || []);
                    setInterests(profile.interests || []);
                    if (profile.datingPreferences) {
                        if (profile.datingPreferences.interestedIn) {
                            setInterestedIn(profile.datingPreferences.interestedIn);
                        }
                        if (profile.datingPreferences.ageRange) {
                            setAgeRange([
                                profile.datingPreferences.ageRange.min || 18,
                                profile.datingPreferences.ageRange.max || 50,
                            ]);
                        }
                    }
                    setIsProfileComplete(Boolean(profile.isProfileComplete));
                }
            } catch (err) {
                if (isMounted) {
                    setAlertMessage(err.message || "Failed to load profile data");
                    setAlertSeverity("error");
                    setOpenSnackbar(true);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        loadProfile();
        return () => {
            isMounted = false;
        };
    }, [getProfile]);

    // Revoke object URL on unmount or when preview changes
    useEffect(() => {
        return () => {
            if (filePreviewUrl) {
                try {
                    URL.revokeObjectURL(filePreviewUrl);
                } catch (_) {}
            }
        };
    }, [filePreviewUrl]);

    // Trigger file selection for an optional specific slot (0..5) or next available (null)
    const handleTriggerFileInput = (slotIndex = null) => {
        if (slotIndex === null && photos.length >= MAX_PHOTOS_COUNT) {
            setAlertMessage("Maximum 6 profile photos reached. Please replace an existing photo or delete one first.");
            setAlertSeverity("warning");
            setOpenSnackbar(true);
            return;
        }

        setTargetSlot(slotIndex);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
            fileInputRef.current.click();
        }
    };

    // Client-side file selection and preview generation
    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Client-side preflight validation
        const validation = validatePhotoFile(file);
        if (!validation.valid) {
            setAlertMessage(validation.error);
            setAlertSeverity("error");
            setOpenSnackbar(true);
            return;
        }

        // Revoke prior preview if any
        if (filePreviewUrl) {
            try {
                URL.revokeObjectURL(filePreviewUrl);
            } catch (_) {}
        }

        const objectUrl = URL.createObjectURL(file);
        setSelectedFile(file);
        setFilePreviewUrl(objectUrl);
        setUploadError(null);
        setUploadErrorCode(null);
        setUploadProgress(0);
    };

    // Cancel pending file upload and reset preview
    const handleCancelUpload = () => {
        if (filePreviewUrl) {
            try {
                URL.revokeObjectURL(filePreviewUrl);
            } catch (_) {}
        }
        setSelectedFile(null);
        setFilePreviewUrl(null);
        setTargetSlot(null);
        setUploadError(null);
        setUploadErrorCode(null);
        setUploadProgress(0);
    };

    // Execute authenticated 3-step upload
    const handleStartUpload = async () => {
        if (!selectedFile) return;

        setIsUploading(true);
        setUploadProgress(0);
        setUploadError(null);
        setUploadErrorCode(null);

        try {
            const result = await executePhotoUploadFlow({
                file: selectedFile,
                targetIndex: targetSlot !== null ? targetSlot : undefined,
                requestUploadUrlFn: requestPhotoUploadUrl,
                uploadBinaryFn: uploadPhotoBinary,
                confirmUploadFn: confirmPhotoUpload,
                onProgress: (p) => setUploadProgress(p),
            });

            // Update photos strictly after confirmation succeeds
            if (result && Array.isArray(result.photos)) {
                setPhotos(result.photos);
            }

            if (filePreviewUrl) {
                try {
                    URL.revokeObjectURL(filePreviewUrl);
                } catch (_) {}
            }
            setSelectedFile(null);
            setFilePreviewUrl(null);
            setTargetSlot(null);
            setUploadProgress(100);

            setAlertMessage("Profile photo uploaded and verified successfully!");
            setAlertSeverity("success");
            setOpenSnackbar(true);
        } catch (err) {
            console.error("Photo upload error:", err);
            const parsed = parseUploadError(err);
            setUploadError(parsed.message);
            setUploadErrorCode(parsed.code);
            // CRITICAL: Previous photos state remains preserved on error
            setAlertMessage(parsed.message);
            setAlertSeverity(parsed.code === "STORAGE_UNAVAILABLE" ? "warning" : "error");
            setOpenSnackbar(true);
        } finally {
            setIsUploading(false);
        }
    };

    // Remove photo slot from profile and backend storage
    const handleDeletePhotoSlot = async (index) => {
        if (index < 0 || index >= photos.length) return;

        try {
            setIsDeletingIndex(index);
            const result = await deleteProfilePhoto(index);
            if (result && Array.isArray(result.photos)) {
                setPhotos(result.photos);
            } else {
                setPhotos((prev) => prev.filter((_, i) => i !== index));
            }

            if (previewPhotoIndex >= photos.length - 1) {
                setPreviewPhotoIndex(Math.max(0, photos.length - 2));
            }

            setAlertMessage("Profile photo removed successfully.");
            setAlertSeverity("success");
            setOpenSnackbar(true);
        } catch (err) {
            console.error("Failed to delete photo:", err);
            // If the photo was only in local unsaved draft state, remove locally
            if (err.message && (err.message.includes("Invalid photo index") || err.message.includes("not found"))) {
                setPhotos((prev) => prev.filter((_, i) => i !== index));
            } else {
                setAlertMessage(err.message || "Failed to remove photo.");
                setAlertSeverity("error");
                setOpenSnackbar(true);
            }
        } finally {
            setIsDeletingIndex(null);
        }
    };

    // Handle adding a photo URL (backward compatibility with approved CDNs)
    const handleAddPhoto = () => {
        const trimmed = photoInput.trim();
        if (!trimmed) return;

        if (photos.length >= MAX_PHOTOS_COUNT) {
            setAlertMessage("You can add a maximum of 6 photos.");
            setAlertSeverity("warning");
            setOpenSnackbar(true);
            return;
        }

        try {
            const parsed = new URL(trimmed);
            if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
                throw new Error("Invalid protocol");
            }
        } catch {
            setAlertMessage("Please enter a valid URL (starting with http:// or https://)");
            setAlertSeverity("error");
            setOpenSnackbar(true);
            return;
        }

        setPhotos([...photos, trimmed]);
        setPhotoInput("");
    };

    // Handle adding an interest tag
    const handleAddInterest = (tagToAdd) => {
        const target = tagToAdd || interestInput;
        const trimmed = target.trim();
        if (!trimmed) return;

        if (interests.length >= 15) {
            setAlertMessage("You can add up to 15 interests.");
            setAlertSeverity("warning");
            setOpenSnackbar(true);
            return;
        }

        if (interests.includes(trimmed)) {
            setInterestInput("");
            return;
        }

        setInterests([...interests, trimmed]);
        setInterestInput("");
    };

    const handleRemoveInterest = (interestToRemove) => {
        setInterests(interests.filter((item) => item !== interestToRemove));
    };

    // Save profile updates
    const handleSaveProfile = async (e) => {
        if (e) e.preventDefault();

        if (!name.trim()) {
            setAlertMessage("Display name cannot be empty.");
            setAlertSeverity("error");
            setOpenSnackbar(true);
            return;
        }

        if (dob) {
            const age = calculateAge(dob);
            if (age !== null && age < 18) {
                setAlertMessage("You must be at least 18 years old to use Engaze.");
                setAlertSeverity("error");
                setOpenSnackbar(true);
                return;
            }
        }

        setSaving(true);
        try {
            const payload = {
                name: name.trim(),
                dob: dob ? new Date(dob).toISOString() : null,
                gender: gender || undefined,
                bio: bio.trim(),
                photos,
                interests,
                datingPreferences: {
                    interestedIn,
                    ageRange: { min: ageRange[0], max: ageRange[1] },
                },
            };

            const result = await updateProfile(payload);
            setAlertMessage(result.message || "Profile updated successfully!");
            setAlertSeverity("success");
            setOpenSnackbar(true);

            if (result.profile) {
                setIsProfileComplete(Boolean(result.profile.isProfileComplete));
            }
        } catch (err) {
            setAlertMessage(err.message || "Failed to update profile. Please try again.");
            setAlertSeverity("error");
            setOpenSnackbar(true);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    minHeight: "100vh",
                    bgcolor: BRAND_COLORS.backgroundDark,
                }}
            >
                <CircularProgress size={50} sx={{ color: BRAND_COLORS.coralPink }} />
            </Box>
        );
    }

    return (
        <Box sx={{ minHeight: "100vh", bgcolor: BRAND_COLORS.backgroundDark, pb: 10 }}>
            {/* Unified Brand Navigation */}
            <Navbar />

            <Container maxWidth="lg" sx={{ mt: { xs: 2.5, md: 4 }, px: { xs: 1.5, sm: 3 } }}>
                {/* Profile Completion Card */}
                <Paper
                    elevation={0}
                    sx={{
                        p: { xs: 2.5, md: 3 },
                        mb: 3.5,
                        borderRadius: "24px",
                        bgcolor: BRAND_COLORS.surfaceDark,
                        border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                        display: "flex",
                        flexDirection: { xs: "column", sm: "row" },
                        alignItems: { xs: "flex-start", sm: "center" },
                        justifyContent: "space-between",
                        gap: 2,
                        position: "relative",
                        overflow: "hidden",
                    }}
                >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Box
                            sx={{
                                width: 52,
                                height: 52,
                                borderRadius: "16px",
                                bgcolor: isProfileComplete ? "rgba(16, 185, 129, 0.15)" : "rgba(253, 58, 115, 0.15)",
                                border: `1px solid ${isProfileComplete ? "rgba(16, 185, 129, 0.3)" : "rgba(253, 58, 115, 0.3)"}`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            {isProfileComplete ? (
                                <CheckCircleIcon sx={{ fontSize: 28, color: "#10B981" }} />
                            ) : (
                                <WarningAmberIcon sx={{ fontSize: 28, color: BRAND_COLORS.coralPink }} />
                            )}
                        </Box>
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 800, color: "#FFFFFF", fontSize: "1.05rem" }}>
                                {isProfileComplete
                                    ? "Profile Complete & Live on Discovery"
                                    : "Complete Your Profile"}
                            </Typography>
                            <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary }}>
                                {isProfileComplete
                                    ? "You're visible to eligible matches nearby. Keep your photos up to date!"
                                    : "Add your photos, bio, and age to get discovered by mutual matches."}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Progress Bar & Chip */}
                    <Box sx={{ width: { xs: "100%", sm: 200 }, textAlign: "right" }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.8 }}>
                            <Typography variant="caption" sx={{ color: BRAND_COLORS.textSecondary, fontWeight: 600 }}>
                                Strength
                            </Typography>
                            <Typography variant="caption" sx={{ color: BRAND_COLORS.coralPink, fontWeight: 800 }}>
                                {completionScore}%
                            </Typography>
                        </Stack>
                        <LinearProgress
                            variant="determinate"
                            value={completionScore}
                            sx={{
                                height: 8,
                                borderRadius: 4,
                                bgcolor: "rgba(255, 255, 255, 0.08)",
                                "& .MuiLinearProgress-bar": {
                                    background: BRAND_COLORS.primaryGradient,
                                    borderRadius: 4,
                                },
                            }}
                        />
                    </Box>
                </Paper>

                {/* View/Edit Mode Tabs */}
                <Box sx={{ mb: 3.5, display: "flex", justifyContent: "center" }}>
                    <Tabs
                        value={activeTab}
                        onChange={(_, val) => setActiveTab(val)}
                        sx={{
                            bgcolor: BRAND_COLORS.surfaceDark,
                            p: 0.5,
                            borderRadius: "16px",
                            border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                            "& .MuiTabs-indicator": { display: "none" },
                        }}
                    >
                        <Tab
                            icon={<EditIcon fontSize="small" />}
                            iconPosition="start"
                            label="Edit Profile"
                            sx={{
                                borderRadius: "12px",
                                textTransform: "none",
                                fontWeight: 700,
                                px: { xs: 1.5, sm: 3 },
                                minHeight: 44,
                                fontSize: { xs: "0.85rem", sm: "0.95rem" },
                                color: BRAND_COLORS.textSecondary,
                                "&.Mui-selected": {
                                    background: BRAND_COLORS.primaryGradient,
                                    color: "#FFFFFF",
                                    boxShadow: "0 4px 15px rgba(253, 58, 115, 0.35)",
                                },
                            }}
                        />
                        <Tab
                            icon={<PreviewIcon fontSize="small" />}
                            iconPosition="start"
                            label="Card Preview"
                            sx={{
                                borderRadius: "12px",
                                textTransform: "none",
                                fontWeight: 700,
                                px: { xs: 1.5, sm: 3 },
                                minHeight: 44,
                                fontSize: { xs: "0.85rem", sm: "0.95rem" },
                                color: BRAND_COLORS.textSecondary,
                                "&.Mui-selected": {
                                    background: BRAND_COLORS.primaryGradient,
                                    color: "#FFFFFF",
                                    boxShadow: "0 4px 15px rgba(253, 58, 115, 0.35)",
                                },
                            }}
                        />
                    </Tabs>
                </Box>

                {/* TAB 0: EDIT PROFILE */}
                {activeTab === 0 && (
                    <Grid container spacing={3.5}>
                        {/* Main Profile Form */}
                        <Grid item xs={12} md={7} lg={8}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: { xs: 2.5, md: 4 },
                                    borderRadius: "24px",
                                    bgcolor: BRAND_COLORS.surfaceDark,
                                    border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                                }}
                            >
                                <Typography variant="h6" sx={{ fontWeight: 800, color: "#FFFFFF", mb: 3 }}>
                                    Basic Information
                                </Typography>

                                <Grid container spacing={2.5}>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            label="Display Name"
                                            fullWidth
                                            required
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            helperText="Name visible to other members"
                                            sx={{
                                                "& .MuiOutlinedInput-root": {
                                                    borderRadius: "14px",
                                                    bgcolor: "rgba(255, 255, 255, 0.04)",
                                                },
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            label="Username"
                                            fullWidth
                                            disabled
                                            value={username}
                                            helperText="Unique username (cannot be changed)"
                                            sx={{
                                                "& .MuiOutlinedInput-root": {
                                                    borderRadius: "14px",
                                                    bgcolor: "rgba(255, 255, 255, 0.02)",
                                                },
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            label="Date of Birth"
                                            type="date"
                                            fullWidth
                                            value={dob}
                                            onChange={(e) => setDob(e.target.value)}
                                            InputLabelProps={{ shrink: true }}
                                            helperText={
                                                currentAge !== null
                                                    ? `Age: ${currentAge} years old ${currentAge < 18 ? "(Must be 18+)" : ""}`
                                                    : "Required for age verification (18+ only)"
                                            }
                                            error={currentAge !== null && currentAge < 18}
                                            sx={{
                                                "& .MuiOutlinedInput-root": {
                                                    borderRadius: "14px",
                                                    bgcolor: "rgba(255, 255, 255, 0.04)",
                                                },
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <FormControl fullWidth>
                                            <InputLabel id="gender-select-label">Gender</InputLabel>
                                            <Select
                                                labelId="gender-select-label"
                                                label="Gender"
                                                value={gender}
                                                onChange={(e) => setGender(e.target.value)}
                                                sx={{
                                                    borderRadius: "14px",
                                                    bgcolor: "rgba(255, 255, 255, 0.04)",
                                                }}
                                            >
                                                <MenuItem value="male">Male</MenuItem>
                                                <MenuItem value="female">Female</MenuItem>
                                                <MenuItem value="non-binary">Non-Binary</MenuItem>
                                                <MenuItem value="other">Other</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>

                                    <Grid item xs={12}>
                                        <TextField
                                            label="About Me (Bio)"
                                            multiline
                                            rows={3.5}
                                            fullWidth
                                            value={bio}
                                            onChange={(e) => setBio(e.target.value)}
                                            inputProps={{ maxLength: 500 }}
                                            helperText={`${bio.length}/500 characters. Share your passions, vibe, or what you're seeking.`}
                                            placeholder="A little bit about who you are, what makes you smile, and what kind of conversations you enjoy..."
                                            sx={{
                                                "& .MuiOutlinedInput-root": {
                                                    borderRadius: "14px",
                                                    bgcolor: "rgba(255, 255, 255, 0.04)",
                                                },
                                            }}
                                        />
                                    </Grid>
                                </Grid>

                                <Box sx={{ my: 4, height: "1px", bgcolor: BRAND_COLORS.surfaceDarkBorder }} />

                                <Typography variant="h6" sx={{ fontWeight: 800, color: "#FFFFFF", mb: 2.5 }}>
                                    Dating Preferences
                                </Typography>

                                <Grid container spacing={2.5}>
                                    <Grid item xs={12} sm={6}>
                                        <FormControl fullWidth>
                                            <InputLabel id="interested-in-label">Interested In</InputLabel>
                                            <Select
                                                labelId="interested-in-label"
                                                label="Interested In"
                                                value={interestedIn[0] || "everyone"}
                                                onChange={(e) => setInterestedIn([e.target.value])}
                                                sx={{
                                                    borderRadius: "14px",
                                                    bgcolor: "rgba(255, 255, 255, 0.04)",
                                                }}
                                            >
                                                <MenuItem value="everyone">Everyone</MenuItem>
                                                <MenuItem value="female">Women</MenuItem>
                                                <MenuItem value="male">Men</MenuItem>
                                                <MenuItem value="non-binary">Non-Binary</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>

                                    <Grid item xs={12} sm={6}>
                                        <Box sx={{ px: 1 }}>
                                            <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                                                <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary }}>
                                                    Preferred Age Range
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: BRAND_COLORS.coralPink, fontWeight: 700 }}>
                                                    {ageRange[0]} – {ageRange[1]} years
                                                </Typography>
                                            </Stack>
                                            <Slider
                                                value={ageRange}
                                                onChange={(_, val) => setAgeRange(val)}
                                                valueLabelDisplay="auto"
                                                min={18}
                                                max={80}
                                                sx={{
                                                    color: BRAND_COLORS.coralPink,
                                                    "& .MuiSlider-thumb": {
                                                        boxShadow: "0 0 10px rgba(253, 58, 115, 0.5)",
                                                    },
                                                }}
                                            />
                                        </Box>
                                    </Grid>
                                </Grid>

                                <Box sx={{ my: 4, height: "1px", bgcolor: BRAND_COLORS.surfaceDarkBorder }} />

                                <Typography variant="h6" sx={{ fontWeight: 800, color: "#FFFFFF", mb: 1 }}>
                                    Interests & Passions
                                </Typography>
                                <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary, mb: 2 }}>
                                    Choose or type tags that represent your lifestyle ({interests.length}/15 added)
                                </Typography>

                                <Stack direction="row" spacing={1.5} sx={{ mb: 2.5 }}>
                                    <TextField
                                        label="Add Custom Tag"
                                        size="small"
                                        fullWidth
                                        placeholder="e.g. Hiking, Jazz, Tech..."
                                        value={interestInput}
                                        onChange={(e) => setInterestInput(e.target.value)}
                                        onKeyPress={(e) => e.key === "Enter" && handleAddInterest()}
                                        sx={{
                                            "& .MuiOutlinedInput-root": {
                                                borderRadius: "12px",
                                                bgcolor: "rgba(255, 255, 255, 0.04)",
                                            },
                                        }}
                                    />
                                    <Button
                                        variant="outlined"
                                        onClick={() => handleAddInterest()}
                                        disabled={!interestInput.trim()}
                                        sx={{
                                            borderRadius: "12px",
                                            borderColor: BRAND_COLORS.coralPink,
                                            color: BRAND_COLORS.coralPink,
                                            px: 3,
                                            "&:hover": {
                                                borderColor: BRAND_COLORS.sunsetOrange,
                                                bgcolor: "rgba(253, 58, 115, 0.08)",
                                            },
                                        }}
                                    >
                                        Add
                                    </Button>
                                </Stack>

                                {/* Quick Suggestions */}
                                <Box sx={{ mb: 2.5 }}>
                                    <Typography variant="caption" sx={{ color: BRAND_COLORS.textSecondary, display: "block", mb: 1 }}>
                                        Popular suggestions (click to add):
                                    </Typography>
                                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.8 }}>
                                        {SUGGESTED_INTERESTS.filter((s) => !interests.includes(s)).slice(0, 8).map((tag) => (
                                            <Chip
                                                key={tag}
                                                label={tag}
                                                size="small"
                                                onClick={() => handleAddInterest(tag)}
                                                sx={{
                                                    bgcolor: "rgba(255, 255, 255, 0.05)",
                                                    color: BRAND_COLORS.textSecondary,
                                                    border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                                                    cursor: "pointer",
                                                    "&:hover": {
                                                        bgcolor: "rgba(253, 58, 115, 0.15)",
                                                        color: BRAND_COLORS.coralPink,
                                                        borderColor: BRAND_COLORS.coralPink,
                                                    },
                                                }}
                                            />
                                        ))}
                                    </Box>
                                </Box>

                                {/* Active Selected Chips */}
                                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, minHeight: 36 }}>
                                    {interests.length > 0 ? (
                                        interests.map((tag) => (
                                            <Chip
                                                key={tag}
                                                label={tag}
                                                onDelete={() => handleRemoveInterest(tag)}
                                                sx={{
                                                    background: "rgba(253, 58, 115, 0.15)",
                                                    border: "1px solid rgba(253, 58, 115, 0.35)",
                                                    color: "#FFFFFF",
                                                    fontWeight: 600,
                                                    "& .MuiChip-deleteIcon": {
                                                        color: BRAND_COLORS.coralPink,
                                                        "&:hover": { color: "#FFFFFF" },
                                                    },
                                                }}
                                            />
                                        ))
                                    ) : (
                                        <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary }}>
                                            No interests selected yet. Adding interests increases mutual match rates by 3x!
                                        </Typography>
                                    )}
                                </Box>

                                <Box sx={{ mt: 5, display: "flex", justifyContent: "flex-end" }}>
                                    <Button
                                        variant="contained"
                                        size="large"
                                        onClick={handleSaveProfile}
                                        disabled={saving}
                                        sx={{
                                            background: BRAND_COLORS.primaryGradient,
                                            color: "#FFFFFF",
                                            fontWeight: 800,
                                            borderRadius: "14px",
                                            px: 5,
                                            py: 1.5,
                                            boxShadow: "0 6px 20px rgba(253, 58, 115, 0.4)",
                                        }}
                                        startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SparklesIcon />}
                                    >
                                        {saving ? "Saving Changes..." : "Save Profile"}
                                    </Button>
                                </Box>
                            </Paper>
                        </Grid>

                        {/* Right Column: Photos Manager */}
                        <Grid item xs={12} md={5} lg={4}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: { xs: 2.5, md: 3 },
                                    borderRadius: "24px",
                                    bgcolor: BRAND_COLORS.surfaceDark,
                                    border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                                }}
                            >
                                <Typography variant="h6" sx={{ fontWeight: 800, color: "#FFFFFF", mb: 0.5 }}>
                                    Profile Photos
                                </Typography>
                                <Typography variant="body2" sx={{ color: BRAND_COLORS.textSecondary, mb: 2 }}>
                                    Upload up to 6 photos from your device (JPEG, PNG, WebP up to 5MB). Your first photo is displayed on dating cards.
                                </Typography>

                                {/* Accessible Hidden File Input */}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    accept="image/jpeg,image/png,image/webp"
                                    style={{ display: "none" }}
                                    onChange={handleFileChange}
                                    aria-label="Upload profile photo file"
                                />

                                {/* Pending Upload Preview Card */}
                                {selectedFile && (
                                    <Card
                                        sx={{
                                            p: 2,
                                            mb: 2.5,
                                            borderRadius: "16px",
                                            bgcolor: "rgba(255, 255, 255, 0.05)",
                                            border: `1px solid ${BRAND_COLORS.coralPink}`,
                                        }}
                                    >
                                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#FFFFFF", mb: 1 }}>
                                            {targetSlot !== null ? `Pending Upload for Slot ${targetSlot + 1}` : "Pending Photo Upload"}
                                        </Typography>

                                        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1.5 }}>
                                            <Box
                                                component="img"
                                                src={filePreviewUrl}
                                                alt="Pending photo preview"
                                                sx={{
                                                    width: 60,
                                                    height: 75,
                                                    borderRadius: "10px",
                                                    objectFit: "cover",
                                                    bgcolor: "rgba(0,0,0,0.4)",
                                                }}
                                            />
                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                <Typography variant="body2" sx={{ color: "#FFFFFF", fontWeight: 700, noWrap: true }}>
                                                    {selectedFile.name}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: BRAND_COLORS.textSecondary, display: "block" }}>
                                                    Size: {formatFileSize(selectedFile.size)}
                                                </Typography>
                                                {targetSlot !== null ? (
                                                    <Chip
                                                        size="small"
                                                        label={`Replacing Slot ${targetSlot + 1}`}
                                                        sx={{ mt: 0.5, height: 20, fontSize: "0.65rem", bgcolor: "rgba(253, 58, 115, 0.2)", color: BRAND_COLORS.coralPink }}
                                                    />
                                                ) : (
                                                    <Chip
                                                        size="small"
                                                        label={photos.length === 0 ? "Setting as Main Photo" : `Adding as Photo ${photos.length + 1}`}
                                                        sx={{ mt: 0.5, height: 20, fontSize: "0.65rem", bgcolor: "rgba(255, 255, 255, 0.1)", color: "#FFFFFF" }}
                                                    />
                                                )}
                                            </Box>
                                        </Stack>

                                        {isUploading && (
                                            <Box sx={{ mb: 1.5 }}>
                                                <LinearProgress
                                                    variant="determinate"
                                                    value={uploadProgress}
                                                    aria-label="Upload progress"
                                                    aria-valuenow={uploadProgress}
                                                    aria-valuemin={0}
                                                    aria-valuemax={100}
                                                    sx={{
                                                        height: 8,
                                                        borderRadius: 4,
                                                        bgcolor: "rgba(255, 255, 255, 0.1)",
                                                        "& .MuiLinearProgress-bar": {
                                                            background: BRAND_COLORS.primaryGradient,
                                                        },
                                                    }}
                                                />
                                                <Typography variant="caption" sx={{ color: BRAND_COLORS.textSecondary, display: "block", mt: 0.5, textAlign: "right" }}>
                                                    {uploadProgress}% • Uploading & verifying...
                                                </Typography>
                                            </Box>
                                        )}

                                        {uploadError && (
                                            <Alert
                                                severity={uploadErrorCode === "STORAGE_UNAVAILABLE" ? "warning" : "error"}
                                                sx={{ mb: 1.5, borderRadius: "10px", fontSize: "0.8rem" }}
                                            >
                                                {uploadError}
                                            </Alert>
                                        )}

                                        <Stack direction="row" spacing={1.5} justifyContent="flex-end">
                                            <Button
                                                data-testid="cancel-pending-photo-btn"
                                                size="small"
                                                variant="outlined"
                                                onClick={handleCancelUpload}
                                                disabled={isUploading}
                                                startIcon={<CloseIcon />}
                                                sx={{ color: BRAND_COLORS.textSecondary, borderColor: "rgba(255,255,255,0.2)", borderRadius: "10px", textTransform: "none" }}
                                            >
                                                Cancel
                                            </Button>
                                            {uploadError && uploadErrorCode !== "STORAGE_UNAVAILABLE" ? (
                                                <Button
                                                    data-testid="retry-upload-photo-btn"
                                                    size="small"
                                                    variant="contained"
                                                    onClick={handleStartUpload}
                                                    disabled={isUploading}
                                                    startIcon={isUploading ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon />}
                                                    sx={{ background: BRAND_COLORS.primaryGradient, borderRadius: "10px", fontWeight: 700, textTransform: "none" }}
                                                >
                                                    Retry Upload
                                                </Button>
                                            ) : (
                                                <Button
                                                    data-testid="upload-pending-photo-btn"
                                                    size="small"
                                                    variant="contained"
                                                    onClick={handleStartUpload}
                                                    disabled={isUploading || uploadErrorCode === "STORAGE_UNAVAILABLE"}
                                                    startIcon={isUploading ? <CircularProgress size={16} color="inherit" /> : <CloudUploadIcon />}
                                                    sx={{ background: BRAND_COLORS.primaryGradient, borderRadius: "10px", fontWeight: 700, textTransform: "none" }}
                                                >
                                                    {isUploading ? "Uploading..." : "Upload Photo"}
                                                </Button>
                                            )}
                                        </Stack>
                                    </Card>
                                )}

                                {/* Main Upload Trigger Button (when no file is currently selected) */}
                                {!selectedFile && (
                                    <Button
                                        variant="contained"
                                        fullWidth
                                        startIcon={<CloudUploadIcon />}
                                        onClick={() => handleTriggerFileInput(null)}
                                        disabled={photos.length >= MAX_PHOTOS_COUNT}
                                        sx={{
                                            background: BRAND_COLORS.primaryGradient,
                                            borderRadius: "14px",
                                            py: 1.2,
                                            fontWeight: 700,
                                            mb: 2.5,
                                            boxShadow: "0 4px 15px rgba(253, 58, 115, 0.3)",
                                        }}
                                    >
                                        {photos.length === 0 ? "Upload Main Photo" : "Upload Photo from Device"}
                                    </Button>
                                )}

                                {/* 6-slot photo grid */}
                                <Grid container spacing={1.5}>
                                    {[0, 1, 2, 3, 4, 5].map((index) => {
                                        const url = photos[index];
                                        const isMain = index === 0;

                                        return (
                                            <Grid item xs={4} key={index}>
                                                <Box
                                                    sx={{
                                                        position: "relative",
                                                        width: "100%",
                                                        pt: "125%", // 4:5 portrait ratio
                                                        borderRadius: "14px",
                                                        overflow: "hidden",
                                                        bgcolor: "rgba(255, 255, 255, 0.03)",
                                                        border: url
                                                            ? isMain
                                                                ? `2px solid ${BRAND_COLORS.coralPink}`
                                                                : `1px solid ${BRAND_COLORS.surfaceDarkBorder}`
                                                            : `1.5px dashed rgba(255, 255, 255, 0.15)`,
                                                        transition: "all 0.2s ease",
                                                    }}
                                                >
                                                    {url ? (
                                                        <>
                                                            <Box
                                                                component="img"
                                                                src={url}
                                                                alt={`Profile photo ${index + 1}`}
                                                                onError={(e) => {
                                                                    e.target.src = "/logo192.png";
                                                                }}
                                                                sx={{
                                                                    position: "absolute",
                                                                    top: 0,
                                                                    left: 0,
                                                                    width: "100%",
                                                                    height: "100%",
                                                                    objectFit: "cover",
                                                                }}
                                                            />
                                                            {isMain && (
                                                                <Chip
                                                                    icon={<StarIcon sx={{ fontSize: "14px !important", color: "#fff" }} />}
                                                                    label="Main"
                                                                    size="small"
                                                                    sx={{
                                                                        position: "absolute",
                                                                        top: 6,
                                                                        left: 6,
                                                                        background: BRAND_COLORS.primaryGradient,
                                                                        color: "#fff",
                                                                        fontWeight: 800,
                                                                        fontSize: "0.68rem",
                                                                        height: 22,
                                                                    }}
                                                                />
                                                            )}
                                                            <Stack
                                                                direction="row"
                                                                spacing={0.5}
                                                                sx={{
                                                                    position: "absolute",
                                                                    top: 6,
                                                                    right: 6,
                                                                }}
                                                            >
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => handleTriggerFileInput(index)}
                                                                    aria-label={`Replace photo in slot ${index + 1}`}
                                                                    sx={{
                                                                        backgroundColor: "rgba(0, 0, 0, 0.65)",
                                                                        backdropFilter: "blur(4px)",
                                                                        color: "#FFFFFF",
                                                                        "&:hover": { backgroundColor: BRAND_COLORS.coralPink },
                                                                        width: 24,
                                                                        height: 24,
                                                                    }}
                                                                >
                                                                    <PhotoCameraIcon sx={{ fontSize: 13 }} />
                                                                </IconButton>
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() => handleDeletePhotoSlot(index)}
                                                                    disabled={isDeletingIndex === index}
                                                                    aria-label={`Remove photo ${index + 1}`}
                                                                    sx={{
                                                                        backgroundColor: "rgba(0, 0, 0, 0.65)",
                                                                        backdropFilter: "blur(4px)",
                                                                        color: "#FFFFFF",
                                                                        "&:hover": { backgroundColor: "rgba(239, 68, 68, 0.85)" },
                                                                        width: 24,
                                                                        height: 24,
                                                                    }}
                                                                >
                                                                    {isDeletingIndex === index ? (
                                                                        <CircularProgress size={12} color="inherit" />
                                                                    ) : (
                                                                        <DeleteIcon sx={{ fontSize: 13 }} />
                                                                    )}
                                                                </IconButton>
                                                            </Stack>
                                                        </>
                                                    ) : (
                                                        <Box
                                                            role="button"
                                                            tabIndex={0}
                                                            aria-label={`Upload photo to slot ${index + 1}`}
                                                            onClick={() => handleTriggerFileInput(index)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === "Enter" || e.key === " ") {
                                                                    e.preventDefault();
                                                                    handleTriggerFileInput(index);
                                                                }
                                                            }}
                                                            sx={{
                                                                position: "absolute",
                                                                top: 0,
                                                                left: 0,
                                                                width: "100%",
                                                                height: "100%",
                                                                display: "flex",
                                                                flexDirection: "column",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                                color: "rgba(255, 255, 255, 0.35)",
                                                                cursor: "pointer",
                                                                "&:hover": {
                                                                    color: BRAND_COLORS.coralPink,
                                                                    bgcolor: "rgba(253, 58, 115, 0.05)",
                                                                },
                                                                "&:focus-visible": {
                                                                    outline: `2px solid ${BRAND_COLORS.coralPink}`,
                                                                },
                                                            }}
                                                        >
                                                            <Typography variant="caption" sx={{ fontWeight: 800, fontSize: "1.2rem" }}>
                                                                +
                                                            </Typography>
                                                            <Typography variant="caption" sx={{ fontSize: "0.68rem", fontWeight: 600 }}>
                                                                Slot {index + 1}
                                                            </Typography>
                                                        </Box>
                                                    )}
                                                </Box>
                                            </Grid>
                                        );
                                    })}
                                </Grid>

                                {/* Collapsible URL Input (for backward compatibility with approved CDN URLs) */}
                                <Box sx={{ mt: 2.5, pt: 2, borderTop: `1px solid ${BRAND_COLORS.surfaceDarkBorder}` }}>
                                    <Button
                                        size="small"
                                        onClick={() => setShowUrlInput((prev) => !prev)}
                                        sx={{
                                            color: BRAND_COLORS.textSecondary,
                                            fontSize: "0.75rem",
                                            textTransform: "none",
                                            p: 0,
                                            mb: showUrlInput ? 1.5 : 0,
                                            "&:hover": { color: "#FFFFFF" },
                                        }}
                                    >
                                        {showUrlInput ? "▲ Hide image URL option" : "▼ Or add an approved image URL"}
                                    </Button>

                                    {showUrlInput && (
                                        <Stack spacing={1.5}>
                                            <TextField
                                                label="Photo Image URL"
                                                size="small"
                                                fullWidth
                                                placeholder="https://images.unsplash.com/..."
                                                value={photoInput}
                                                onChange={(e) => setPhotoInput(e.target.value)}
                                                onKeyPress={(e) => e.key === "Enter" && handleAddPhoto()}
                                                sx={{
                                                    "& .MuiOutlinedInput-root": {
                                                        borderRadius: "12px",
                                                        bgcolor: "rgba(255, 255, 255, 0.04)",
                                                    },
                                                }}
                                            />
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                startIcon={<AddPhotoAlternateIcon />}
                                                onClick={handleAddPhoto}
                                                disabled={!photoInput.trim() || photos.length >= MAX_PHOTOS_COUNT}
                                                sx={{
                                                    borderColor: "rgba(255, 255, 255, 0.2)",
                                                    color: "#FFFFFF",
                                                    borderRadius: "10px",
                                                    fontWeight: 600,
                                                    textTransform: "none",
                                                }}
                                            >
                                                Add URL to Photos
                                            </Button>
                                        </Stack>
                                    )}
                                </Box>
                            </Paper>
                        </Grid>
                    </Grid>
                )}

                {/* TAB 1: PREVIEW DATING CARD */}
                {activeTab === 1 && (
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <Typography variant="caption" sx={{ color: BRAND_COLORS.textSecondary, mb: 2 }}>
                            This is how other members see your profile on Discovery
                        </Typography>

                        <Card
                            elevation={10}
                            sx={{
                                width: "100%",
                                maxWidth: 380,
                                height: 560,
                                borderRadius: "28px",
                                overflow: "hidden",
                                position: "relative",
                                bgcolor: BRAND_COLORS.surfaceDark,
                                border: `1px solid ${BRAND_COLORS.surfaceDarkBorder}`,
                                boxShadow: "0 20px 40px rgba(0, 0, 0, 0.5)",
                            }}
                        >
                            {/* Segmented Photo Progress Bar */}
                            {photos.length > 1 && (
                                <Box
                                    sx={{
                                        position: "absolute",
                                        top: 12,
                                        left: 14,
                                        right: 14,
                                        display: "flex",
                                        gap: 0.8,
                                        zIndex: 10,
                                    }}
                                >
                                    {photos.map((_, idx) => (
                                        <Box
                                            key={idx}
                                            sx={{
                                                flex: 1,
                                                height: 4,
                                                borderRadius: 2,
                                                bgcolor: idx === previewPhotoIndex ? "#FFFFFF" : "rgba(255, 255, 255, 0.35)",
                                                transition: "background-color 0.2s ease",
                                            }}
                                        />
                                    ))}
                                </Box>
                            )}

                            {/* Photo / Empty Avatar */}
                            <Box
                                sx={{
                                    position: "relative",
                                    width: "100%",
                                    height: "100%",
                                    cursor: photos.length > 1 ? "pointer" : "default",
                                }}
                                onClick={() => {
                                    if (photos.length > 1) {
                                        setPreviewPhotoIndex((prev) => (prev + 1) % photos.length);
                                    }
                                }}
                            >
                                {photos.length > 0 ? (
                                    <Box
                                        component="img"
                                        src={photos[previewPhotoIndex] || photos[0]}
                                        alt={name}
                                        onError={(e) => {
                                            e.target.src = "/logo192.png";
                                        }}
                                        sx={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                        }}
                                    />
                                ) : (
                                    <Box
                                        sx={{
                                            display: "flex",
                                            justifyContent: "center",
                                            alignItems: "center",
                                            height: "100%",
                                            bgcolor: "#141727",
                                        }}
                                    >
                                        <Avatar sx={{ width: 110, height: 110, bgcolor: "rgba(255,255,255,0.06)" }}>
                                            <PersonIcon sx={{ fontSize: 70, color: BRAND_COLORS.textSecondary }} />
                                        </Avatar>
                                    </Box>
                                )}

                                {/* Bottom Dark Gradient Overlay with Profile Details */}
                                <Box
                                    sx={{
                                        position: "absolute",
                                        bottom: 0,
                                        left: 0,
                                        right: 0,
                                        p: 3,
                                        pt: 8,
                                        background: "linear-gradient(to top, rgba(11, 13, 23, 0.98) 0%, rgba(11, 13, 23, 0.8) 55%, transparent 100%)",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 1.2,
                                    }}
                                >
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                        <Typography variant="h4" sx={{ fontWeight: 900, color: "#FFFFFF", letterSpacing: "-0.02em" }}>
                                            {name || "Your Name"}
                                            {currentAge ? `, ${currentAge}` : ""}
                                        </Typography>
                                    </Stack>

                                    <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.75)", textTransform: "capitalize" }}>
                                        {gender || "Gender not specified"} • @{username}
                                    </Typography>

                                    <Typography
                                        variant="body2"
                                        sx={{
                                            color: "#E2E8F0",
                                            fontSize: "0.92rem",
                                            lineHeight: 1.4,
                                            mt: 0.5,
                                            display: "-webkit-box",
                                            WebkitLineClamp: 3,
                                            WebkitBoxOrient: "vertical",
                                            overflow: "hidden",
                                        }}
                                    >
                                        {bio || "No bio added yet. Tell members about your passions and personality!"}
                                    </Typography>

                                    {interests.length > 0 && (
                                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.8, mt: 1 }}>
                                            {interests.slice(0, 4).map((tag) => (
                                                <Chip
                                                    key={tag}
                                                    label={tag}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: "rgba(255, 255, 255, 0.12)",
                                                        backdropFilter: "blur(8px)",
                                                        color: "#FFFFFF",
                                                        fontSize: "0.75rem",
                                                        fontWeight: 600,
                                                        border: "1px solid rgba(255, 255, 255, 0.15)",
                                                    }}
                                                />
                                            ))}
                                            {interests.length > 4 && (
                                                <Chip
                                                    label={`+${interests.length - 4}`}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: "rgba(255, 255, 255, 0.08)",
                                                        color: "#FFFFFF",
                                                        fontSize: "0.72rem",
                                                    }}
                                                />
                                            )}
                                        </Box>
                                    )}
                                </Box>
                            </Box>
                        </Card>
                    </Box>
                )}
            </Container>

            <Snackbar
                open={openSnackbar}
                autoHideDuration={4000}
                onClose={() => setOpenSnackbar(false)}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <Alert
                    onClose={() => setOpenSnackbar(false)}
                    severity={alertSeverity}
                    variant="filled"
                    sx={{
                        width: "100%",
                        borderRadius: "14px",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
                    }}
                >
                    {alertMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
}

export default withAuth(ProfilePage);

import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import withAuth from "../utils/withAuth";
import { AuthContext } from "../contexts/AuthContext";
import "../App.css";
import {
    Alert,
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Container,
    FormControl,
    Grid,
    IconButton,
    InputLabel,
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
import RestoreIcon from "@mui/icons-material/Restore";
import HomeIcon from "@mui/icons-material/Home";
import PersonIcon from "@mui/icons-material/Person";
import WhatshotIcon from "@mui/icons-material/Whatshot";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ChatIcon from "@mui/icons-material/Chat";
import VideocamIcon from "@mui/icons-material/Videocam";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

function ProfilePage() {
    const navigate = useNavigate();
    const { getProfile, updateProfile, handleLogout } = useContext(AuthContext);

    // Profile form state
    const [name, setName] = useState("");
    const [username, setUsername] = useState("");
    const [dob, setDob] = useState("");
    const [gender, setGender] = useState("");
    const [bio, setBio] = useState("");
    const [photos, setPhotos] = useState([]);
    const [photoInput, setPhotoInput] = useState("");
    const [interests, setInterests] = useState([]);
    const [interestInput, setInterestInput] = useState("");
    const [interestedIn, setInterestedIn] = useState(["everyone"]);
    const [ageRange, setAgeRange] = useState([18, 50]);
    const [isProfileComplete, setIsProfileComplete] = useState(false);

    // UI state
    const [activeTab, setActiveTab] = useState(0); // 0 = Edit, 1 = View Preview
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");
    const [alertSeverity, setAlertSeverity] = useState("info");
    const [openSnackbar, setOpenSnackbar] = useState(false);

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

    // Handle adding a photo URL
    const handleAddPhoto = () => {
        const trimmed = photoInput.trim();
        if (!trimmed) return;

        if (photos.length >= 6) {
            setAlertMessage("You can add a maximum of 6 photos.");
            setAlertSeverity("warning");
            setOpenSnackbar(true);
            return;
        }

        // Basic URL validation
        try {
            new URL(trimmed);
        } catch {
            setAlertMessage("Please enter a valid URL (starting with http:// or https://)");
            setAlertSeverity("error");
            setOpenSnackbar(true);
            return;
        }

        setPhotos([...photos, trimmed]);
        setPhotoInput("");
    };

    const handleRemovePhoto = (index) => {
        setPhotos(photos.filter((_, i) => i !== index));
    };

    // Handle adding an interest tag
    const handleAddInterest = () => {
        const trimmed = interestInput.trim();
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
                }}
            >
                <CircularProgress size={48} />
            </Box>
        );
    }

    return (
        <Box sx={{ minHeight: "100vh", backgroundColor: "#f8f9fa", pb: 6 }}>
            {/* Navigation Header */}
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    px: { xs: 2, md: 4 },
                    py: 2,
                    backgroundColor: "#ffffff",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
                }}
            >
                <Typography
                    variant="h5"
                    component="h1"
                    sx={{
                        fontWeight: 700,
                        color: "#FF9839",
                        cursor: "pointer",
                    }}
                    onClick={() => navigate("/home")}
                >
                    ENGAZE.com
                </Typography>

                <Stack direction="row" spacing={1} alignItems="center">
                    <Button
                        startIcon={<WhatshotIcon />}
                        onClick={() => navigate("/discovery")}
                        sx={{ color: "#333", textTransform: "none" }}
                    >
                        Discovery
                    </Button>
                    <Button
                        startIcon={<FavoriteIcon />}
                        onClick={() => navigate("/matches")}
                        sx={{ color: "#333", textTransform: "none" }}
                    >
                        Matches
                    </Button>
                    <Button
                        startIcon={<ChatIcon />}
                        onClick={() => navigate("/chat")}
                        sx={{ color: "#333", textTransform: "none" }}
                    >
                        Chat
                    </Button>
                    <Button
                        startIcon={<VideocamIcon />}
                        onClick={() => navigate("/random-video")}
                        sx={{ color: "#FF9839", fontWeight: 700, textTransform: "none" }}
                    >
                        Video Match
                    </Button>
                    <Button
                        startIcon={<HomeIcon />}
                        onClick={() => navigate("/home")}
                        sx={{ color: "#333", textTransform: "none" }}
                    >
                        Home
                    </Button>
                    <IconButton
                        title="History"
                        onClick={() => navigate("/history")}
                        sx={{ color: "#555" }}
                    >
                        <RestoreIcon />
                    </IconButton>
                    <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={handleLogout}
                        sx={{ textTransform: "none" }}
                    >
                        Logout
                    </Button>
                </Stack>
            </Box>

            <Container maxWidth="lg" sx={{ mt: 4 }}>
                {/* Profile Completion Banner */}
                <Paper
                    elevation={1}
                    sx={{
                        p: 2,
                        mb: 3,
                        borderRadius: 3,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: 2,
                        borderLeft: `6px solid ${isProfileComplete ? "#2e7d32" : "#ed6c02"}`,
                    }}
                >
                    <Stack direction="row" spacing={2} alignItems="center">
                        {isProfileComplete ? (
                            <CheckCircleIcon color="success" sx={{ fontSize: 36 }} />
                        ) : (
                            <WarningAmberIcon color="warning" sx={{ fontSize: 36 }} />
                        )}
                        <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                {isProfileComplete
                                    ? "Your Profile is Complete & Ready for Matching!"
                                    : "Complete Your Profile"}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {isProfileComplete
                                    ? "Other members can now discover your profile."
                                    : "Add your photo, age, gender, and bio to enable discovery."}
                            </Typography>
                        </Box>
                    </Stack>
                    <Chip
                        label={isProfileComplete ? "Complete" : "Incomplete"}
                        color={isProfileComplete ? "success" : "warning"}
                        variant="filled"
                    />
                </Paper>

                {/* View/Edit Mode Tabs */}
                <Tabs
                    value={activeTab}
                    onChange={(_, val) => setActiveTab(val)}
                    sx={{ mb: 3 }}
                    textColor="primary"
                    indicatorColor="primary"
                >
                    <Tab label="Edit Profile" icon={<PersonIcon />} iconPosition="start" />
                    <Tab label="Preview Match Card" />
                </Tabs>

                {/* TAB 0: EDIT PROFILE */}
                {activeTab === 0 && (
                    <Grid container spacing={3}>
                        {/* Main Profile Form */}
                        <Grid item xs={12} md={8}>
                            <Paper elevation={2} sx={{ p: { xs: 2, md: 4 }, borderRadius: 3 }}>
                                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                                    Basic Information
                                </Typography>

                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            label="Display Name"
                                            fullWidth
                                            required
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            helperText="Name visible to other members"
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            label="Username"
                                            fullWidth
                                            disabled
                                            value={username}
                                            helperText="Unique username (cannot be changed)"
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
                                            rows={3}
                                            fullWidth
                                            value={bio}
                                            onChange={(e) => setBio(e.target.value)}
                                            inputProps={{ maxLength: 500 }}
                                            helperText={`${bio.length}/500 characters. Share your passions, hobbies, or what you're looking for.`}
                                        />
                                    </Grid>
                                </Grid>

                                <Typography variant="h6" sx={{ fontWeight: 600, mt: 4, mb: 2 }}>
                                    Dating Preferences
                                </Typography>

                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <FormControl fullWidth>
                                            <InputLabel id="interested-in-label">Interested In</InputLabel>
                                            <Select
                                                labelId="interested-in-label"
                                                label="Interested In"
                                                value={interestedIn[0] || "everyone"}
                                                onChange={(e) => setInterestedIn([e.target.value])}
                                            >
                                                <MenuItem value="everyone">Everyone</MenuItem>
                                                <MenuItem value="female">Women</MenuItem>
                                                <MenuItem value="male">Men</MenuItem>
                                                <MenuItem value="non-binary">Non-Binary</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>

                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            Preferred Age Range: {ageRange[0]} - {ageRange[1]}
                                        </Typography>
                                        <Slider
                                            value={ageRange}
                                            onChange={(_, val) => setAgeRange(val)}
                                            valueLabelDisplay="auto"
                                            min={18}
                                            max={80}
                                        />
                                    </Grid>
                                </Grid>

                                <Typography variant="h6" sx={{ fontWeight: 600, mt: 4, mb: 2 }}>
                                    Interests & Hobbies
                                </Typography>

                                <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                                    <TextField
                                        label="Add Interest (e.g. Travel, Music, Fitness)"
                                        size="small"
                                        fullWidth
                                        value={interestInput}
                                        onChange={(e) => setInterestInput(e.target.value)}
                                        onKeyPress={(e) => e.key === "Enter" && handleAddInterest()}
                                    />
                                    <Button
                                        variant="outlined"
                                        onClick={handleAddInterest}
                                        disabled={!interestInput.trim()}
                                    >
                                        Add
                                    </Button>
                                </Stack>

                                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, minHeight: 32 }}>
                                    {interests.length > 0 ? (
                                        interests.map((tag) => (
                                            <Chip
                                                key={tag}
                                                label={tag}
                                                onDelete={() => handleRemoveInterest(tag)}
                                                color="primary"
                                                variant="outlined"
                                            />
                                        ))
                                    ) : (
                                        <Typography variant="body2" color="text.secondary">
                                            No interests added yet. Add up to 15 interests to find better matches.
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
                                            backgroundColor: "#FF9839",
                                            "&:hover": { backgroundColor: "#e68933" },
                                            px: 4,
                                        }}
                                        startIcon={saving ? <CircularProgress size={20} color="inherit" /> : null}
                                    >
                                        {saving ? "Saving Changes..." : "Save Profile"}
                                    </Button>
                                </Box>
                            </Paper>
                        </Grid>

                        {/* Right Column: Photos Manager */}
                        <Grid item xs={12} md={4}>
                            <Paper elevation={2} sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
                                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                                    Profile Photos
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    Add up to 6 photo URLs. The first photo will be your main avatar.
                                </Typography>

                                <Stack spacing={1} sx={{ mb: 2 }}>
                                    <TextField
                                        label="Photo URL"
                                        size="small"
                                        fullWidth
                                        placeholder="https://example.com/photo.jpg"
                                        value={photoInput}
                                        onChange={(e) => setPhotoInput(e.target.value)}
                                        onKeyPress={(e) => e.key === "Enter" && handleAddPhoto()}
                                    />
                                    <Button
                                        variant="contained"
                                        startIcon={<AddPhotoAlternateIcon />}
                                        onClick={handleAddPhoto}
                                        disabled={!photoInput.trim() || photos.length >= 6}
                                        sx={{ backgroundColor: "#333", "&:hover": { backgroundColor: "#111" } }}
                                    >
                                        Add Photo URL
                                    </Button>
                                </Stack>

                                <Grid container spacing={1.5}>
                                    {photos.map((url, index) => (
                                        <Grid item xs={6} key={index}>
                                            <Box
                                                sx={{
                                                    position: "relative",
                                                    width: "100%",
                                                    pt: "100%",
                                                    borderRadius: 2,
                                                    overflow: "hidden",
                                                    boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
                                                    border: index === 0 ? "3px solid #FF9839" : "1px solid #ddd",
                                                }}
                                            >
                                                <Box
                                                    component="img"
                                                    src={url}
                                                    alt={`Photo ${index + 1}`}
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
                                                {index === 0 && (
                                                    <Chip
                                                        label="Main"
                                                        size="small"
                                                        color="warning"
                                                        sx={{
                                                            position: "absolute",
                                                            top: 4,
                                                            left: 4,
                                                            fontWeight: 600,
                                                            fontSize: "0.7rem",
                                                        }}
                                                    />
                                                )}
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleRemovePhoto(index)}
                                                    sx={{
                                                        position: "absolute",
                                                        top: 4,
                                                        right: 4,
                                                        backgroundColor: "rgba(0,0,0,0.6)",
                                                        color: "white",
                                                        "&:hover": { backgroundColor: "rgba(220,0,0,0.8)" },
                                                    }}
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Box>
                                        </Grid>
                                    ))}
                                </Grid>

                                {photos.length === 0 && (
                                    <Box
                                        sx={{
                                            border: "2px dashed #ccc",
                                            borderRadius: 2,
                                            p: 3,
                                            textAlign: "center",
                                            color: "text.secondary",
                                            mt: 1,
                                        }}
                                    >
                                        <Typography variant="body2">
                                            No photos added yet. Paste image URLs above to add your profile pictures.
                                        </Typography>
                                    </Box>
                                )}
                            </Paper>
                        </Grid>
                    </Grid>
                )}

                {/* TAB 1: PREVIEW DATING CARD */}
                {activeTab === 1 && (
                    <Box sx={{ display: "flex", justifyContent: "center" }}>
                        <Card
                            sx={{
                                maxWidth: 400,
                                width: "100%",
                                borderRadius: 4,
                                overflow: "hidden",
                                boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                            }}
                        >
                            <Box sx={{ position: "relative", width: "100%", height: 380, bgcolor: "#222" }}>
                                {photos.length > 0 ? (
                                    <Box
                                        component="img"
                                        src={photos[0]}
                                        alt={name}
                                        onError={(e) => {
                                            e.target.src = "/logo192.png";
                                        }}
                                        sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                                    />
                                ) : (
                                    <Box
                                        sx={{
                                            display: "flex",
                                            justifyContent: "center",
                                            alignItems: "center",
                                            height: "100%",
                                            color: "#888",
                                        }}
                                    >
                                        <Avatar sx={{ width: 100, height: 100, bgcolor: "#555" }}>
                                            <PersonIcon sx={{ fontSize: 60 }} />
                                        </Avatar>
                                    </Box>
                                )}
                                <Box
                                    sx={{
                                        position: "absolute",
                                        bottom: 0,
                                        left: 0,
                                        right: 0,
                                        p: 2,
                                        background: "linear-gradient(transparent, rgba(0,0,0,0.85))",
                                        color: "white",
                                    }}
                                >
                                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                                        {name || "Your Name"}{" "}
                                        {currentAge ? `, ${currentAge}` : ""}
                                    </Typography>
                                    <Typography variant="body2" sx={{ opacity: 0.9, textTransform: "capitalize" }}>
                                        {gender || "Gender not specified"} • @{username}
                                    </Typography>
                                </Box>
                            </Box>

                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                    About Me
                                </Typography>
                                <Typography variant="body1" sx={{ mb: 2 }}>
                                    {bio || "No bio added yet. Tell people something interesting about yourself!"}
                                </Typography>

                                {interests.length > 0 && (
                                    <>
                                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                            Interests
                                        </Typography>
                                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                                            {interests.map((tag) => (
                                                <Chip key={tag} label={tag} size="small" variant="filled" />
                                            ))}
                                        </Box>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </Box>
                )}
            </Container>

            <Snackbar
                open={openSnackbar}
                autoHideDuration={4000}
                onClose={() => setOpenSnackbar(false)}
            >
                <Alert
                    onClose={() => setOpenSnackbar(false)}
                    severity={alertSeverity}
                    sx={{ width: "100%" }}
                >
                    {alertMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
}

export default withAuth(ProfilePage);


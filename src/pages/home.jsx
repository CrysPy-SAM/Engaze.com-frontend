import React, { useContext, useState } from 'react'
import withAuth from '../utils/withAuth'
import { useNavigate } from 'react-router-dom'
import "../App.css";
import { Button, IconButton, TextField } from '@mui/material';
import RestoreIcon from '@mui/icons-material/Restore';
import PersonIcon from '@mui/icons-material/Person';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ChatIcon from '@mui/icons-material/Chat';
import VideocamIcon from '@mui/icons-material/Videocam';
import { AuthContext } from '../contexts/AuthContext';

function HomeComponent() {


    let navigate = useNavigate();
    const [meetingCode, setMeetingCode] = useState("");


    const {addToUserHistory} = useContext(AuthContext);
    let handleJoinVideoCall = async () => {
        await addToUserHistory(meetingCode)
        navigate(`/${meetingCode}`)
    }

    return (
        <>

            <div className="navBar">

                <div style={{ display: "flex", alignItems: "center" }}>

                    <h2>ENGAZE.com</h2>
                </div>

                <div style={{ display: "flex", alignItems: "center" }}>
                    <Button
                        startIcon={<WhatshotIcon />}
                        onClick={() => navigate("/discovery")}
                        sx={{ color: "#FF9839", fontWeight: 600, textTransform: "none", mr: 1 }}
                    >
                        Discovery
                    </Button>
                    <Button
                        startIcon={<FavoriteIcon />}
                        onClick={() => navigate("/matches")}
                        sx={{ color: "#333", textTransform: "none", mr: 1 }}
                    >
                        Matches
                    </Button>
                    <Button
                        startIcon={<ChatIcon />}
                        onClick={() => navigate("/chat")}
                        sx={{ color: "#333", textTransform: "none", mr: 1 }}
                    >
                        Chat
                    </Button>
                    <Button
                        startIcon={<VideocamIcon />}
                        onClick={() => navigate("/random-video")}
                        sx={{ color: "#FF9839", fontWeight: 700, textTransform: "none", mr: 1 }}
                    >
                        Video Match
                    </Button>

                    <IconButton title="Profile" onClick={() => navigate("/profile")}>
                        <PersonIcon />
                    </IconButton>
                    <p style={{ cursor: "pointer", marginRight: "10px" }} onClick={() => navigate("/profile")}>Profile</p>

                    <IconButton onClick={
                        () => {
                            navigate("/history")
                        }
                    }>
                        <RestoreIcon />
                    </IconButton>
                    <p>History</p>

                    <Button onClick={() => {
                        localStorage.removeItem("token")
                        navigate("/auth")
                    }}>
                        Logout
                    </Button>
                </div>


            </div>


            <div className="meetContainer">
                <div className="leftPanel">
                    <div>
                        <h2>Connect & Meet Face-to-Face Instantly on Engaze.</h2>

                        {/* Random Video Quick Action Card */}
                        <div style={{
                            margin: "20px 0 30px 0",
                            padding: "20px",
                            backgroundColor: "#fff7ed",
                            borderRadius: "16px",
                            border: "1px solid #fed7aa",
                            boxShadow: "0 4px 15px rgba(255, 152, 57, 0.15)"
                        }}>
                            <h3 style={{ margin: "0 0 8px 0", color: "#FF9839" }}>Random 1-to-1 Video Match</h3>
                            <p style={{ margin: "0 0 16px 0", color: "#475569", fontSize: "14px" }}>
                                Find another available member online right now and start a private video call.
                            </p>
                            <Button
                                variant="contained"
                                size="large"
                                startIcon={<VideocamIcon />}
                                onClick={() => navigate("/random-video")}
                                sx={{
                                    backgroundColor: "#FF9839",
                                    "&:hover": { backgroundColor: "#ea580c" },
                                    fontWeight: 700,
                                    borderRadius: 4,
                                    px: 4,
                                    textTransform: "none",
                                    boxShadow: "0 4px 14px rgba(255, 152, 57, 0.4)"
                                }}
                            >
                                Start Video Match
                            </Button>
                        </div>

                        <p style={{ color: "#64748b", fontSize: "13px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                            Or join with a meeting code:
                        </p>
                        <div style={{ display: 'flex', gap: "10px" }}>

                            <TextField onChange={e => setMeetingCode(e.target.value)} id="outlined-basic" label="Meeting Code" variant="outlined" />
                            <Button onClick={handleJoinVideoCall} variant='contained'>Join</Button>

                        </div>
                    </div>
                </div>
                <div className='rightPanel'>
                    <img srcSet='/logo3.png' alt="" />
                </div>
            </div>
        </>
    )
}


export default withAuth(HomeComponent)
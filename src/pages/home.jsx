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
                        <h2>Providing Quality Video Call Just Like Quality Education.</h2>

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
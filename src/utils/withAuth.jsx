import React, { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { Box, CircularProgress } from "@mui/material";

const withAuth = (WrappedComponent) => {
    const AuthComponent = (props) => {
        const navigate = useNavigate();
        const { isAuthenticated, loading } = useContext(AuthContext);

        useEffect(() => {
            if (!loading && !isAuthenticated) {
                navigate("/auth", { replace: true });
            }
        }, [loading, isAuthenticated, navigate]);

        if (loading) {
            return (
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        minHeight: "100vh",
                        backgroundColor: "#f5f5f5"
                    }}
                >
                    <CircularProgress size={48} />
                </Box>
            );
        }

        if (!isAuthenticated) {
            return null;
        }

        return <WrappedComponent {...props} />;
    };

    return AuthComponent;
};

export default withAuth;
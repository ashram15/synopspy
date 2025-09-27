import React from "react";
import './App.css'
import { useAuth0 } from "@auth0/auth0-react";

const LoginButton = () => {
    const { loginWithRedirect, isAuthenticated } = useAuth0();

    return (
        <div>
            {!isAuthenticated && (
                <button onClick={() => loginWithRedirect()}>Log In</button>
            )}
        </div>
    );
};

export default LoginButton;
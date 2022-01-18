import React, { useState } from "react";
import Auth from "./auth.js"

function LoginForm() {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleClick = () => {
        try {
            Auth({ email, password });
        } catch (e) {
            alert("Failed to login");
            console.log(e);
            setEmail("");
            setPassword("");
        }
    };

    return(
        <div className="loginForm">
            <input 
                type="text"
                id="email" 
                name="email" 
                value={email}
                placeholder="email"
                onChange={({ target: { value } }) => setEmail(value)}
            />
            <input
                type="password" 
                id="password" 
                name="password"
                value={password}
                onChange={({ target: { value } }) => setPassword(value)}
                placeholder="password"
            />
            <button className="signInBtn" onClick={handleClick}>Sign in</button>
        </div>
    )
}

export default LoginForm;
// pages/login.js
"use client";
import { useState } from "react";

/**
 * Idiotinloggning för att skydda sidan...
 */
function AccessDenied() {
    const [password, setPassword] = useState("");

    const handleSubmit = async (event: any) => {
        event.preventDefault();
        // const password = new FormData(event.currentTarget).get("password");

        if (password === "avail") {
            // Set a session cookie
            window.document.cookie = `auth=true; Path=/; SameSite=Strict; Secure`;
            window.location.href = "/";
        } else {
            alert("Incorrect password!");
        }
    };

    return (
        <div className="flex flex-col items-center mt-5 p-5 bg-slate-100">
            <form onSubmit={handleSubmit}>
                <label>Password:</label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <button type="submit">Enter</button>
            </form>
        </div>
    );
}

export default AccessDenied;

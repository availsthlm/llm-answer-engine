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

    if (password === "3yixtL699i+.") {
      // Set a session cookie
      window.document.cookie = `auth=true; Path=/; SameSite=Strict; Secure`;
      window.location.href = "/";
    } else if (password === "pass4vision") {
      // Calculate the expiration date
      const expirationDate = new Date();
      expirationDate.setTime(expirationDate.getTime() + 6 * 60 * 60 * 1000); // 12 hours in milliseconds
      const expires = expirationDate.toUTCString();

      // Set the cookie
      window.document.cookie = `auth=true; Path=/; SameSite=Strict; Secure; Expires=${expires}`;
      window.location.href = "/";
    } else {
      alert("Incorrect password!");
    }
  };

  return (
    <div className="flex flex-col items-center mt-5 p-5 bg-red-50">
      <form onSubmit={handleSubmit}>
        <label>Lösenord:</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input className="ml-2 bg-midnight text-tahiti" type="submit" />
      </form>
    </div>
  );
}

export default AccessDenied;

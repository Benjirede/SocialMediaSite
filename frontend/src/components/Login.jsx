import { useState } from "react";
import { api } from "../api/client";

export default function Login({ onSuccess }) {
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);

    const submit = async (e) => {
        e.preventDefault();
        setError(null);

        const res = await api("/login", {
            method: "POST",
            body: JSON.stringify({ identifier, password }),
        });

        if (!res.ok) {
            const data = await res.json();
            setError(data.message || "Login failed");
            return;
        }

        onSuccess();
    };

    return (
        <form onSubmit={submit}>
            <h2>Login</h2>

            <input
                placeholder="Username or Email"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
            />
            <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />

            <button type="submit">Login</button>
            
            {error && <p style={{ color: "red" }}>{error}</p>}
        </form>
    );
}
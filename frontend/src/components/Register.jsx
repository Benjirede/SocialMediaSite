import { useState } from "react";
import { api } from "../api/client";

export default function Register({ onSuccess }) {
    const [form, setForm] = useState({
        username: "",
        email: "",
        password: "",
    });
    const [error, setError] = useState(null);

    const submit = async (e) => {
        e.preventDefault();
        setError(null);

        const res = await api("/users", {
            method: "POST",
            body: JSON.stringify(form),
        });

        if (!res.ok) {
            const data = await res.json();
            setError(data.error || "Registration failed");
            return;
        }

        onSuccess();
    };

    return (
        <form onSubmit={submit}>
            <h2>Register</h2>

            <input
                placeholder="Username"
                value={form.username}
                onChange={(e) => setForm({...form, username: e.target.value})}
            />
            <input
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({...form, email: e.target.value})}
            />
            <input
                type="password"
                placeholder="Password"
                value={form.password}
                onChange={(e) => setForm({...form, password: e.target.value})}
            />

            <button type="submit">Register</button>
            
            {error && <p style={{ color: "red" }}>{error}</p>}
        </form>
    );
}
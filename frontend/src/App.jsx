import { useEffect, useState } from "react"
import Login from "./components/Login.jsx"
import Register from "./components/Register.jsx"
import { api } from "./api/client.js"

function App() {
  const [user, setUser] = useState(null)
  const [mode, setMode] = useState("login") // "login" or "register"

  const fetchMe = async () => {
    const res = await api("/me")
    if (res.ok) {
      const users = await res.json()
      setUser(users) 
    } else {
      setUser(null)
    }
  };

  useEffect(() => {
    fetchMe();
  }, []);

  if (!user) {
    return (
      <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
        {mode === "login" ? (
          <>
            <Login onSuccess={fetchMe} />
            <p>Need an account?</p>
            <button onClick={() => setMode("register")}>
              Register
            </button>
          </>
        ) : (
          <>
            <Register onSuccess={() => setMode("login")} />
            <p>Have an account?</p>
            <button onClick={() => setMode("login")}>
              Login
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Welcome, {user.username}!</h1>
      <p>You are logged in.</p>
      <button
        onClick={async () => {
          await api("/logout", { method: "POST" });
          setUser(null); // reset local state
        }}
      >
        Logout
      </button>
    </div>
  );
}

export default App

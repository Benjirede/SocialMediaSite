import { useEffect, useState } from "react"
import Login from "./components/Login.jsx"
import Register from "./components/Register.jsx"
import Posts from "./components/Posts.jsx"
import FriendRequests from "./components/FriendRequests.jsx"
import Users from "./components/Users.jsx"
import { api } from "./api/client.js"

function App() {
  const [user, setUser] = useState(null)
  const [mode, setMode] = useState("login") // "login" or "register"
  const [page, setPage] = useState("feed");

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

      <div style={{ marginBottom: "1rem" }}>
        <button onClick={() => setPage("feed")}>Feed</button>{" "}
        <button onClick={() => setPage("friends")}>Friend Requests</button>{" "}
        <button onClick={() => setPage("users")}>Find New Friends</button>
      </div>


      {page === "feed" && <Posts user={user} />}

      {page === "friends" && <FriendRequests />}

      {page === "users" && <Users user={user} />}

    </div>
  );
}

export default App

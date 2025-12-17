import { useEffect, useState } from "react"

function App() {
  const [status, setStatus] = useState("Loading...")

  useEffect(() => {
    fetch("http://localhost:5000/health", {
      credentials: "include",
    })
      .then(res => res.json())
      .then(data => setStatus(data.status))
      .catch(() => setStatus("Backend unreachable"))
  }, [])

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Social Media App</h1>
      <p>Backend status: {status}</p>
    </div>
  )
}

export default App

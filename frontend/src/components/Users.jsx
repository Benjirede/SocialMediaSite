import { useEffect, useState } from "react";
import { api } from "../api/client";

export default function Users({ user }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const isFriend = friends.some(f => f.id === user.id);
  const requestSent = pendingRequests.some(r => r.from.id === user.id);


  useEffect(() => {
    if (query.length === 0) {
      setResults([]);
      return;
    }

    const timeout = setTimeout(() => {
      searchUsers();
    }, 300); // debounce

    
    const fetchFriends = async () => {
        const res = await api("/friends");
        if (res.ok) setFriends(await res.json());
    };
    
    const fetchPending = async () => {
        const res = await api("/friends/requests");
        if (res.ok) {
            const data = await res.json();
            // Only outgoing requests
            setPendingRequests(data.filter(r => r.from.id === user.id));
        }
    };
    
    fetchFriends();
    fetchPending();
    return () => clearTimeout(timeout);
  }, [query]);

  const searchUsers = async () => {
    setLoading(true);

    const res = await api(`/users/search?q=${encodeURIComponent(query)}`);
    if (res.ok) {
      setResults(await res.json());
    }

    setLoading(false);
  };

  const sendRequest = async (userId) => {
    const res = await api("/friends", {
      method: "POST",
      body: JSON.stringify({ friend_id: userId }),
    });
    if (res.ok) {
        setPendingRequests((prev) => [...prev, { from: user }]);
        alert("Friend request sent");
    }
  };

  return (
    <div style={{ marginTop: "2rem" }}>
      <h2>Find Friends</h2>

      <input
        placeholder="Search by username..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ padding: "0.5rem", width: "100%" }}
      />

      {loading && <p>Searching...</p>}

      {query && results.length === 0 && !loading && (
        <p>No users found.</p>
      )}

      {results.map((u) => (
        <div
          key={u.id}
          style={{
            border: "1px solid #ccc",
            padding: "0.75rem",
            marginTop: "0.5rem",
          }}
        >
          <strong>{u.username}</strong>

          <button
            onClick={() => sendRequest(u.id)}
            disabled={isFriend || requestSent}
            style={{ marginLeft: "1rem" }}
          >
            {isFriend ? "Friends" : requestSent ? "Request Sent" : "Add Friend"}
          </button>
        </div>
      ))}
    </div>
  );
}

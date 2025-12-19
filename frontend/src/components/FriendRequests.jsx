import { useEffect, useState } from "react";
import { api } from "../api/client";

export default function FriendRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    const res = await api("/friends/requests");
    if (res.ok) {
      const data = await res.json();
      setRequests(data);
    }
    setLoading(false);
  };

  const respond = async (requestId, action) => {
    const res = await api(`/friends/${requestId}`, {
      method: "PUT",
      body: JSON.stringify({ action }),
    });

    if (res.ok) {
      // remove request from UI
      setRequests((prev) =>
        prev.filter((r) => r.id !== requestId)
      );
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  if (loading) return <p>Loading friend requests...</p>;

  if (requests.length === 0) {
    return <p>No friend requests.</p>;
  }

  return (
    <div style={{ marginTop: "2rem" }}>
      <h2>Friend Requests</h2>

      {requests.map((req) => (
        <div
          key={req.id}
          style={{
            border: "1px solid #ccc",
            padding: "1rem",
            marginBottom: "1rem",
          }}
        >
          <p>
            <strong>{req.from.username}</strong> wants to be your friend
          </p>

          <button
            onClick={() => respond(req.id, "accept")}
            style={{ marginRight: "0.5rem" }}
          >
            Accept
          </button>

          <button
            onClick={() => respond(req.id, "reject")}
          >
            Reject
          </button>
        </div>
      ))}
    </div>
  );
}

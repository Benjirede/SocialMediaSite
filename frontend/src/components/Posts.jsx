import { use, useEffect, useState } from "react";
import { api } from "../api/client";

export default function Posts({ user }) {
    const [posts, setPosts] = useState([]);
    const [content, setContent] = useState("");

    // Fetch all posts
    const fetchPosts = async () => {
        const res = await api("/posts");
        if (res.ok) {
            const data = await res.json();
            setPosts(data);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    // Create a new post
    const createPost = async () => {
        if(!content.trim()) return;
        const res = await api("/posts", { method: "POST", body: JSON.stringify({ content }) });
        if (res.ok) {
            const newPost = await res.json();
            setContent("");
            fetchPosts();
        } else {
            console.error("Failed to create post");
        }
    };

    // Delete a post
    const deletePost = async (id) => {
        const res = await api(`/posts/${id}`, "DELETE");
        if (res.ok) {
            fetchPosts();
        }
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    return (
        <div>
            <h2>Posts</h2>

            <div style={{ marginBottom: "1rem" }}>
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="What's on your mind?"
                    rows={3}
                    style={{ width: "100%" }}
                />
                <button onClick={createPost}>Post</button>
            </div>

            {posts.map((post) => (
                <div
                    key={post.id}
                    style={{ border: "1px solid #000000ff", padding: "1rem", marginBottom: "1rem" }}
                >
                    <p>{post.content}</p>
                    <small>
                        By {post.author.username} at {new Date(post.timestamp).toLocaleString()}
                    </small>
                    {post.author.id === user.id && (
                        <div>
                            <button onClick={() => deletePost(post.id)}>Delete</button>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
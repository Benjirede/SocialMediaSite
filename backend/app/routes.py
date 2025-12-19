from flask import Blueprint, jsonify, request
from flask_login import login_user, logout_user, login_required, current_user
from . import db, login_manager
from .models import User, Post, Friend, Message
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

main = Blueprint('main', __name__)

# Health check
@main.route('/health')
def health_check():
    return jsonify(status='ok'), 200

# --------------------------
# User Routes
# --------------------------
@main.route('/users', methods=['POST'])
def create_user():
    data = request.get_json()
    if not data or not data.get("username") or not data.get("email") or not data.get("password"):
        return jsonify(error="Missing required fields"), 400

    if User.query.filter((User.username==data["username"]) | (User.email==data["email"])).first():
        return jsonify(error="User already exists"), 409

    user = User(
        username=data["username"],
        email=data["email"],
        password_hash=generate_password_hash(data["password"])
    )
    db.session.add(user)
    db.session.commit()

    return jsonify(id=user.id, username=user.username, email=user.email), 201

@main.route('/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    user = User.query.get_or_404(user_id)
    return jsonify(id=user.id, username=user.username, email=user.email)

@main.route('/users', methods=['GET'])
def list_users():
    users = User.query.all()
    return jsonify([{"id": u.id, "username": u.username, "email": u.email} for u in users])

@main.route('/users/<int:user_id>', methods=['PUT'])
@login_required
def update_user(user_id):
    if current_user.id != user_id:
        return jsonify(error="Unauthorized"), 403
    user = User.query.get_or_404(user_id)
    data = request.get_json()
    if "username" in data:
        user.username = data["username"]
    if "email" in data:
        user.email = data["email"]
    if "password" in data:
        user.password_hash = generate_password_hash(data["password"])
    db.session.commit()
    return jsonify(message="User updated")

@main.route('/users/<int:user_id>', methods=['DELETE'])
@login_required
def delete_user(user_id):
    if current_user.id != user_id:
        return jsonify(error="Unauthorized"), 403
    user = User.query.get_or_404(user_id)
    logout_user()
    db.session.delete(user)
    db.session.commit()
    return jsonify(message="User deleted"), 200

# --------------------------
# Authentication
# --------------------------
@main.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    print("Login payload:", data) # Debug statement
    identifier = data.get("identifier") or data.get("username") or data.get("email")  # can be username or email
    password = data.get("password")
    if not identifier or not password:
        return jsonify(error="Missing credentials"), 400

    user = User.query.filter((User.username==identifier) | (User.email==identifier)).first()
    if user and check_password_hash(user.password_hash, password):
        login_user(user)
        return jsonify(message="Logged in")
    return jsonify(message="Invalid credentials"), 401

@main.route('/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify(message="Logged out")

# --------------------------
# Current User
# --------------------------
@main.route('/me', methods=['GET'])
@login_required
def get_current_user():
    return jsonify(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email
    )


# --------------------------
# Post Routes
# --------------------------
@main.route('/posts', methods=['POST'])
@login_required
def create_post():
    data = request.get_json()
    print("Create post payload:", data)  # Debug statement
    print("Current user ID:", current_user.id)  # Debug statement
    if not data.get("content"):
        return jsonify(error="Content required"), 400
    post = Post(user_id=current_user.id, content=data["content"], image_url=data.get("image_url"))
    db.session.add(post)
    db.session.commit()
    return jsonify(id=post.id, content=post.content, timestamp=post.timestamp.isoformat()), 201

@main.route('/posts', methods=['GET'])
@login_required
def get_posts():
    # Get IDs of friends with accepted requests
    friends = Friend.query.filter(
        ((Friend.user_id == current_user.id) | (Friend.friend_id == current_user.id)) &
        (Friend.status == "accepted")
    ).all()

    friend_ids = [
        f.friend_id if f.user_id == current_user.id else f.user_id
        for f in friends
    ]

    # Include your own user ID
    allowed_ids = friend_ids + [current_user.id]

    # Fetch posts by allowed IDs
    posts = Post.query.filter(Post.user_id.in_(allowed_ids)).order_by(Post.timestamp.desc()).all()

    return jsonify([
        {
            "id": p.id,
            "content": p.content,
            "timestamp": p.timestamp.isoformat(),
            "author": {
                "id": p.user.id,
                "username": p.user.username
            }
        }
        for p in posts
    ])

@main.route('/posts/<int:post_id>', methods=['GET'])
def get_post(post_id):
    post = Post.query.get_or_404(post_id)
    return jsonify(id=post.id, user_id=post.user_id, content=post.content, timestamp=post.timestamp.isoformat())

@main.route('/posts/<int:post_id>', methods=['DELETE'])
@login_required
def delete_post(post_id):
    post = Post.query.get_or_404(post_id)
    if post.user_id != current_user.id:
        return jsonify(error="Unauthorized"), 403
    db.session.delete(post)
    db.session.commit()
    return jsonify(message="Post deleted"), 200

# --------------------------
# Friend Routes
# --------------------------
@main.route('/friends', methods=['POST'])
@login_required
def add_friend():
    data = request.get_json()
    friend_id = data.get("friend_id")
    if not friend_id:
        return jsonify(error="friend_id required"), 400
    if friend_id == current_user.id:
        return jsonify(error="Cannot add yourself as a friend"), 400
    friend = User.query.get(friend_id)
    if not friend:
        return jsonify(error="User not found"), 404
    existing = Friend.query.filter(
        ((Friend.user_id==current_user.id) & (Friend.friend_id==friend_id)) |
        ((Friend.user_id==friend_id) & (Friend.friend_id==current_user.id))
    ).first()
    if existing:
        return jsonify(error="Friend request already exists or you are already friends"), 409
    
    request_obj = Friend(user_id=current_user.id, friend_id=friend_id, status='pending')
    db.session.add(request_obj)
    db.session.commit()
    return jsonify(id=request_obj.id, status=request_obj.status), 201

@main.route('/friends/<int:request_id>', methods=['PUT'])
@login_required
def respond_friend_request(request_id):
    data = request.get_json()
    action = data.get("action")  # "accept" or "reject"

    if action not in ("accept", "reject"):
        return jsonify(error="Action must be accept or reject"), 400

    friend_request = Friend.query.get_or_404(request_id)

    # Only receiver can respond
    if friend_request.friend_id != current_user.id:
        return jsonify(error="Not authorized"), 403

    if action == "accept":
        friend_request.status = "accepted"
    else:
        db.session.delete(friend_request)

    db.session.commit()

    return jsonify(message=f"Friend request {action}ed"), 200

@main.route('/friends', methods=['GET'])
@login_required
def list_friends():
    friends = Friend.query.filter(
        (
            (Friend.user_id == current_user.id) |
            (Friend.friend_id == current_user.id)
        ) &
        (Friend.status == "accepted")
    ).all()

    results = []
    for f in friends:
        friend_user = f.friend_id if f.user_id == current_user.id else f.user_id
        user = User.query.get(friend_user)

        results.append({
            "id": user.id,
            "username": user.username,
            "email": user.email
        })

    return jsonify(results), 200

@main.route('/friends/requests', methods=['GET'])
@login_required
def pending_friend_requests():
    requests = Friend.query.filter_by(
        friend_id=current_user.id,
        status="pending"
    ).all()

    return jsonify([{
        "id": r.id,
        "from": {
            "id": r.sender.id,
            "username": r.sender.username
        }
    } for r in requests])


# --------------------------
# Messages Routes
# --------------------------
@main.route('/messages', methods=['POST'])
@login_required
def send_message():
    are_friends = Friend.query.filter(
        (
            (Friend.user_id == current_user.id) &
            (Friend.friend_id == request.json.get("receiver_id"))
        ) |
        (
            (Friend.user_id == request.json.get("receiver_id")) &
            (Friend.friend_id == current_user.id)
        ),
        Friend.status == "accepted"
    ).first()
    if not are_friends:
        return jsonify(error="You can only message your friends"), 403
    data = request.get_json()
    receiver_id = data.get("receiver_id")
    content = data.get("content")
    if not receiver_id or not content:
        return jsonify(error="Missing fields"), 400
    message = Message(sender_id=current_user.id, receiver_id=receiver_id, content=content)
    db.session.add(message)
    db.session.commit()
    return jsonify(id=message.id, sender_id=message.sender_id, receiver_id=message.receiver_id, content=message.content, timestamp=message.timestamp.isoformat()), 201

@main.route('/messages', methods=['GET'])
@login_required
def get_messages():
    messages = Message.query.filter(
        (Message.sender_id==current_user.id) | (Message.receiver_id==current_user.id)
    ).order_by(Message.timestamp.desc()).all()
    return jsonify([{
        "id": m.id,
        "sender_id": m.sender_id,
        "receiver_id": m.receiver_id,
        "content": m.content,
        "timestamp": m.timestamp.isoformat()
    } for m in messages])

@main.route('/messages/<int:message_id>', methods=['GET'])
@login_required
def get_conversation(message_id):
    message = Message.query.get_or_404(message_id)
    if current_user.id not in [message.sender_id, message.receiver_id]:
        return jsonify(error="Unauthorized"), 403
    return jsonify(id=message.id, sender_id=message.sender_id, receiver_id=message.receiver_id, content=message.content, timestamp=message.timestamp.isoformat())

# --------------------------
# User Search
# --------------------------
@main.route("/users/search")
@login_required
def search_users():
    q = request.args.get("q", "").strip()

    if len(q) < 1:
        return jsonify([])

    users = (
        User.query
        .filter(User.username.ilike(f"%{q}%"))
        .filter(User.id != current_user.id)
        .limit(50)
        .all()
    )

    return jsonify([
        {
            "id": u.id,
            "username": u.username
        }
        for u in users
    ])

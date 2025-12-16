import os

class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev_secret_key")
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL",
        "postgresql://sm_user:sm_pass@localhost:5432/social_media"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
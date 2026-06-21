from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")

client = MongoClient(MONGODB_URI)
db = client["neurostudy_db"]

# Collections
users_collection = db["users"]
documents_collection = db["documents"]
notes_collection = db["notes"]
quizzes_collection = db["quizzes"]
planners_collection = db["planners"]
chat_collection = db["chat_history"]

def get_db():
    return db

def ping_db():
    try:
        client.admin.command("ping")
        print("MongoDB connected successfully!")
        return True
    except Exception as e:
        print(f"MongoDB connection failed: {e}")
        return False
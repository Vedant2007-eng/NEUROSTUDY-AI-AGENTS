from routers import revision
from routers import planner
from routers import doubt
from routers import quiz
from routers import notes
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from services.mongo_service import ping_db
from routers import upload, agents, chat, user

app = FastAPI(
    title="NeuroStudy AI",
    description="Multi-Agent AI Study System API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    ping_db()
    print("NeuroStudy AI backend started!")

app.include_router(upload.router)
app.include_router(notes.router, prefix="/api")
app.include_router(quiz.router, prefix="/api")
app.include_router(doubt.router, prefix="/api")
app.include_router(planner.router, prefix="/api")
app.include_router(revision.router, prefix="/api")
app.include_router(agents.router)
app.include_router(chat.router)
app.include_router(user.router)

@app.get("/")
def read_root():
    return {
        "message": "NeuroStudy AI backend is running!",
        "version": "1.0.0",
        "endpoints": ["/upload", "/run-agents", "/chat", "/user", "/documents"]
    }
from fastapi import APIRouter

router = APIRouter()

@router.post("/run-agents")
async def run_agents():
    return {"message": "Agents router is ready!"}
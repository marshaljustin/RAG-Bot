from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from app.qdrant_api import search_qdrant
import logging


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[""],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"Request: {request.method} {request.url}")
    response = await call_next(request)
    logger.info(f"Response status: {response.status_code}")
    return response

@app.get("/search")
async def search(query: str):
    try:
        logger.info(f"Processing query: '{query}'")
        results = search_qdrant(query, "bangalore_properties", limit=5)
        
        if not results.get('success'):
            raise HTTPException(status_code=500, detail=results.get('error'))
            
        return {
            "success": True,
            "llm_response": results['llm_response'],
            "results": results['results'],
            "error": None
        }
        
    except Exception as e:
        logger.error(f"Search error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
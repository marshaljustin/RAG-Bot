from qdrant_client import QdrantClient
from app.embedder import generate_query_embedding   
from app.langchainutils import enhance_results_with_langchain
from dotenv import load_dotenv
import os


load_dotenv()


HUGGINGFACE_API_KEY = os.getenv("HUGGINGFACE_API_KEY")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")
QDRANT_URL = os.getenv("QDRANT_URL")

from qdrant_client import QdrantClient

qdrant_client = QdrantClient(
    url=QDRANT_URL,
    api_key=QDRANT_API_KEY,
    timeout=120
)
    
def search_qdrant(query, collection_name, limit=5):
    try:
        print(f"Performing Qdrant search for query: {query}")
        
        query_vector = generate_query_embedding(query)
        
        results = qdrant_client.search(
            collection_name=collection_name,
            query_vector=query_vector,
            limit=max(limit, 5),
            with_payload=True
        )

        parsed_results = []
        for res in results:
            try:
                parsed_results.append({
                    "id": res.payload.get("original_id", ""),
                    "title": res.payload.get("title", "N/A"),
                    "location": res.payload.get("location", "N/A"),
                    "price": f"{res.payload.get('price', 0):.2f}",
                    "size": str(res.payload.get("bedrooms", "N/A")) + " BHK",
                    "sqft": res.payload.get("area_sqft", "N/A"),
                    "score": f"{res.score:.2f}",
                    'amenities': res.payload.get('amenities', [])
                })
            except Exception as e:
                print(f"Error parsing result: {str(e)}")
                continue
        
        # Enhanced LLM response
        llm_response = enhance_results_with_langchain(parsed_results, query)
        
        return {
            "success": True,
            "results": parsed_results,
            "llm_response": llm_response,
            "error": None
        }
    except Exception as e:
        return {
            "success": False,
            "results": [],
            "llm_response": "Sorry, I'm having trouble finding properties right now.",
            "error": str(e)
        }
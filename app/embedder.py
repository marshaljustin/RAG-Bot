from sentence_transformers import SentenceTransformer

embedding_model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')

def generate_query_embedding(query: str):
    """Generate embedding for search queries"""
    try:
        processed_query = f"Search query: {query}"
        return embedding_model.encode([processed_query])[0].tolist()
    except Exception as e:
        raise RuntimeError(f"Query embedding failed: {str(e)}") 
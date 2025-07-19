from huggingface_hub import InferenceClient
from dotenv import load_dotenv
import os


load_dotenv()

HF_API_KEY = os.getenv("HUGGINGFACE_API_KEY")
HF_MODEL_NAME = os.getenv("HUGGINGFACE_MODEL_NAME")

def initialize_huggingface_pipeline():
    try:
        client = InferenceClient(
            model=HF_MODEL_NAME,
             token=HF_API_KEY
        )
        
        return client  
    except Exception as e:
        print(f"Error initializing HF client: {e}")
        raise
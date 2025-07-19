# RagBot — Real Estate Chatbot 
 
This is **RagBot**, my first AI-powered real estate chatbot project.  
It can answer questions about properties — like location, amenities, price, and more — by retrieving relevant data from a vector database and using a large language model to generate helpful answers.

The idea is to make searching and learning about real estate properties more natural, conversational, and fun!

---

## About
RagBot uses **retrieval-augmented generation (RAG)** to answer questions about real estate listings.  
You can ask things like:
- “Show me 2BHK apartments near MG Road with a swimming pool”
- “What properties have owner rating above 4?”

It then searches a vector database of property data and uses a language model to answer in natural language.

---

## Features
- Ask about properties by location, amenities, ratings, and more  
- Uses a **vector database** (Qdrant) for fast semantic search  
- Natural, conversational answers powered by **Mistral-7B** via Hugging Face  
- Embeddings created with **sentence-transformers**  
- Orchestrated with **LangChain** for RAG pipeline  
- Fast and lightweight backend built with **FastAPI**  
- Modular code: separate `app/` and `backend/` folders

---

## Tech Stack
- **FastAPI** – for building the backend APIs
- **Qdrant** – vector database to store and search property embeddings
- **Mistral-7B** – large language model via Hugging Face
- **sentence-transformers** – to generate embeddings from text
- **LangChain** – to handle the retrieval-augmented generation flow
- Python 

---
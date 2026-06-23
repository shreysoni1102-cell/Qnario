import os
import random
import logging
from typing import List, Dict, Any
import requests

logger = logging.getLogger(__name__)

# Try importing chromadb. Since we added it to requirements, we handle import gracefully.
try:
    
    # pyrefly: ignore [missing-import]
    import chromadb
    CHROMA_AVAILABLE = True
except ImportError:
    CHROMA_AVAILABLE = False
    logger.warning("chromadb package is not installed. Chroma functionality will be disabled or mocked.")

class EmbeddingGenerationError(Exception):
    """Custom exception raised when embedding generation fails."""
    pass

class RetrievalService:
    def __init__(self, persist_directory: str = "chroma_db"):
        self.persist_directory = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", persist_directory))
        self.client = None
        if CHROMA_AVAILABLE:
            try:
                self.client = chromadb.PersistentClient(path=self.persist_directory)
                logger.info(f"Chroma DB client initialized at {self.persist_directory}")
            except Exception as e:
                logger.error(f"Failed to initialize Chroma DB client: {e}")
        else:
            logger.warning("Chroma Client NOT initialized (Chroma package missing)")

    def chunk_text(self, text: str, chunk_size: int = 1000, chunk_overlap: int = 100) -> List[str]:
        """Recursively splits text into chunks of at most chunk_size characters with overlap."""
        if not text:
            return []
        if len(text) <= chunk_size:
            return [text]

        # Try splitting by double newline
        parts = text.split("\n\n")
        if len(parts) > 1:
            chunks = []
            current = ""
            for p in parts:
                if not current:
                    current = p
                elif len(current) + len(p) + 2 <= chunk_size:
                    current += "\n\n" + p
                else:
                    chunks.append(current)
                    overlap_start = max(0, len(current) - chunk_overlap)
                    current = current[overlap_start:] + "\n\n" + p
            if current:
                chunks.append(current)
            return chunks

        # Fallback to single newline
        parts = text.split("\n")
        if len(parts) > 1:
            chunks = []
            current = ""
            for p in parts:
                if not current:
                    current = p
                elif len(current) + len(p) + 1 <= chunk_size:
                    current += "\n" + p
                else:
                    chunks.append(current)
                    overlap_start = max(0, len(current) - chunk_overlap)
                    current = current[overlap_start:] + "\n" + p
            if current:
                chunks.append(current)
            return chunks

        # Fallback to space
        parts = text.split(" ")
        chunks = []
        current = ""
        for p in parts:
            if not current:
                current = p
            elif len(current) + len(p) + 1 <= chunk_size:
                current += " " + p
            else:
                chunks.append(current)
                overlap_start = max(0, len(current) - chunk_overlap)
                current = current[overlap_start:] + " " + p
        if current:
            chunks.append(current)
        return chunks

    def get_embedding(self, text: str, api_key: str) -> List[float]:
        """Gets embedding representation from Gemini Embeddings API."""
        if not api_key or "dummy" in api_key.lower():
            raise EmbeddingGenerationError("No valid Gemini API key provided (missing or dummy key).")

        headers = {"Content-Type": "application/json"}
        payload = {
            "model": "models/gemini-embedding-2",
            "content": {
                "parts": [{"text": text}]
            }
        }
        
        primary_err = None
        # Try primary model: gemini-embedding-2
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent?key={api_key}"
        try:
            resp = requests.post(url, headers=headers, json=payload, timeout=15)
            if resp.status_code == 200:
                return resp.json()["embedding"]["values"]
            primary_err = f"Status {resp.status_code}: {resp.text}"
        except Exception as e:
            primary_err = f"Exception: {str(e)}"

        # Try fallback model: gemini-embedding-001
        fallback_err = None
        url_fallback = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key={api_key}"
        payload["model"] = "models/gemini-embedding-001"
        try:
            resp_fallback = requests.post(url_fallback, headers=headers, json=payload, timeout=15)
            if resp_fallback.status_code == 200:
                return resp_fallback.json()["embedding"]["values"]
            fallback_err = f"Status {resp_fallback.status_code}: {resp_fallback.text}"
        except Exception as e:
            fallback_err = f"Exception: {str(e)}"

        raise EmbeddingGenerationError(
            f"Embedding API call failed. Primary (gemini-embedding-2) error: [{primary_err}], "
            f"Fallback (gemini-embedding-001) error: [{fallback_err}]."
        )

    def index_document(self, syllabus_id: str, text: str, api_key: str) -> Dict[str, Any]:
        """Chunks, embeds, and stores the document in a collection named after the syllabus_id."""
        if not self.client:
            return {"success": False, "error": "Chroma DB not initialized"}

        try:
            chunks = self.chunk_text(text, chunk_size=1000, chunk_overlap=100)
            if not chunks:
                return {"success": False, "error": "No text chunks generated"}

            # Clean name to verify Chroma requirements (alphanumeric, underscore, dash, between 3 and 63 chars, starts/ends with alphanumeric)
            coll_name = f"syllabus_{syllabus_id}"
            # Ensure name fits limits and format
            coll_name = "".join(c if c.isalnum() or c in ("_", "-") else "_" for c in coll_name)
            if len(coll_name) > 63:
                coll_name = coll_name[:63]

            # Re-create collection to start clean
            try:
                self.client.delete_collection(name=coll_name)
            except Exception:
                pass

            collection = self.client.create_collection(name=coll_name)
            
            embeddings = []
            ids = []
            for idx, chunk in enumerate(chunks):
                try:
                    emb = self.get_embedding(chunk, api_key)
                except EmbeddingGenerationError as e:
                    logger.error(f"Embedding generation failed at chunk {idx}: {e}")
                    try:
                        self.client.delete_collection(name=coll_name)
                    except Exception:
                        pass
                    return {"success": False, "error": str(e), "failed_at_chunk": idx}
                embeddings.append(emb)
                ids.append(f"chunk_{idx}")

            collection.add(
                ids=ids,
                embeddings=embeddings,
                documents=chunks
            )

            logger.info(f"Indexed document {syllabus_id}: {len(chunks)} chunks stored.")
            return {"success": True, "chunks_count": len(chunks)}
        except Exception as e:
            logger.error(f"Failed to index document {syllabus_id}: {e}")
            return {"success": False, "error": str(e)}

    def retrieve_chunks(self, syllabus_id: str, query: str, api_key: str, k: int = 4) -> List[str]:
        """Retrieves top-k chunks from the Chroma collection that match the query."""
        if not self.client:
            logger.warning("Chroma client not initialized. Returning empty search results.")
            return []

        try:
            coll_name = f"syllabus_{syllabus_id}"
            coll_name = "".join(c if c.isalnum() or c in ("_", "-") else "_" for c in coll_name)
            if len(coll_name) > 63:
                coll_name = coll_name[:63]

            collection = self.client.get_collection(name=coll_name)
            
            try:
                query_emb = self.get_embedding(query, api_key)
            except EmbeddingGenerationError as e:
                logger.error(f"Embedding generation failed for query: {e}")
                raise e

            results = collection.query(
                query_embeddings=[query_emb],
                n_results=k
            )

            if results and "documents" in results and results["documents"]:
                return results["documents"][0]
        except Exception as e:
            if isinstance(e, EmbeddingGenerationError):
                raise e
            logger.error(f"Failed to retrieve chunks for syllabus {syllabus_id}: {e}")

        return []

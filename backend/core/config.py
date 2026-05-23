import os
from dotenv import load_dotenv


load_dotenv()


def _to_bool(value: str, default: bool = False) -> bool:
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
RAG_ENABLED = _to_bool(os.getenv("RAG_ENABLED"), default=False)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
SUPABASE_DB_CONNECTION_STRING = os.getenv("SUPABASE_DB_CONNECTION_STRING", "")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "gemini-embedding-001")
EMBEDDING_DIMENSION = int(os.getenv("EMBEDDING_DIMENSION", "768"))
CHAT_MODEL = os.getenv("CHAT_MODEL", "gemini-2.5-flash")
RAG_COLLECTION_NAME = os.getenv("RAG_COLLECTION_NAME", "contract_documents")
RAG_TOP_K = int(os.getenv("RAG_TOP_K", "4"))
CHUNK_SIZE = int(os.getenv("CHUNK_SIZE", "1000"))
CHUNK_OVERLAP = int(os.getenv("CHUNK_OVERLAP", "150"))
MIN_CHUNK_CHARS = int(os.getenv("MIN_CHUNK_CHARS", "40"))
MAX_DOC_CHARS = int(os.getenv("MAX_DOC_CHARS", "250000"))

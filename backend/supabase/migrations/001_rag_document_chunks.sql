-- SynopSpy RAG storage uses the official `vecs` Python client
-- (see backend/services/rag_engine.py). vecs creates and manages its own
-- Postgres schema/tables for the collection named by RAG_COLLECTION_NAME
-- (default: contract_documents).
--
-- You only need the pgvector extension enabled. Do NOT create a manual
-- `public.document_chunks` table or `match_document_chunks` RPC — the app
-- does not query those objects.
--
-- Prerequisite: set SUPABASE_DB_CONNECTION_STRING to a direct/pooler
-- Postgres URL (Dashboard → Settings → Database).

create extension if not exists vector;

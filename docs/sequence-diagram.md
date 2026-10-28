# SynopSpy Sequence Diagram

The diagram shows the primary user journeys: document upload and analysis, authenticated persistence and background RAG ingestion, analysis PDF download, and document-scoped chat.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant UI as React UI
    participant Auth0 as Auth0
    participant API as FastAPI API
    participant Parser as File Service
    participant Gemini as Google Gemini
    participant Mongo as MongoDB
    participant RAG as RAG Service
    participant Embed as Gemini Embeddings
    participant Vector as Supabase pgvector

    User->>UI: Select PDF or DOCX
    UI->>UI: Preview file locally
    opt Authenticated user
        UI->>Auth0: Request access token
        Auth0-->>UI: JWT access token
    end

    UI->>API: POST /upload (file + optional JWT)
    API->>API: Validate optional JWT

    alt Unsupported file or extraction failure
        API-->>UI: 400 error
        UI-->>User: Show upload error
    else Valid PDF or DOCX
        API->>Parser: Extract document text
        Parser-->>API: Plain text
        API->>Gemini: Analyze text
        Gemini-->>API: Summary, risk score, flags, questions

        alt Authenticated upload
            API->>Mongo: Insert analysis and metadata
            Mongo-->>API: upload_id
            API-->>UI: Analysis result + upload_id
            API-)RAG: Schedule background ingestion
            RAG->>RAG: Chunk document
            RAG->>Embed: Create chunk embeddings
            Embed-->>RAG: Vectors
            RAG->>Vector: Upsert chunks with upload_id
            Vector-->>RAG: Ingestion complete
        else Anonymous upload
            API-->>UI: Analysis result without upload_id
        end
        UI-->>User: Display analysis results
    end

    opt Authenticated user views upload history
        UI->>Auth0: Request access token
        Auth0-->>UI: JWT access token
        UI->>API: GET /uploads + JWT
        API->>Mongo: Find uploads for user_id
        Mongo-->>API: Upload history
        API-->>UI: Upload history
        UI-->>User: Display past uploads
    end

    opt Authenticated user downloads analysis PDF
        User->>UI: Choose Download PDF
        UI->>Auth0: Request access token
        Auth0-->>UI: JWT access token
        UI->>API: GET /analysis/{upload_id}/pdf + JWT
        API->>Mongo: Find upload for user_id
        Mongo-->>API: Stored analysis
        API->>API: Render analysis HTML as PDF
        API-->>UI: PDF stream
        UI-->>User: Download analysis.pdf
    end

    opt Authenticated user asks a document question
        User->>UI: Enter question
        UI->>Auth0: Request access token
        Auth0-->>UI: JWT access token
        UI->>API: POST /uploads/{upload_id}/chat + JWT
        API->>Mongo: Verify upload belongs to user
        Mongo-->>API: Upload found
        API->>RAG: Answer question for upload_id
        RAG->>Embed: Embed question
        Embed-->>RAG: Query vector
        RAG->>Vector: Similarity search filtered by upload_id
        Vector-->>RAG: Relevant document chunks
        RAG->>Gemini: Answer using retrieved chunks only
        Gemini-->>RAG: Grounded answer
        RAG-->>API: Answer + upload_id
        API-->>UI: JSON response
        UI-->>User: Display answer
    end
```

## Main Contracts

- `POST /upload` accepts PDF and DOCX files and permits anonymous analysis.
- Authenticated uploads are stored in MongoDB and receive an `upload_id`.
- RAG ingestion runs as a FastAPI background task after the upload response is prepared; MongoDB `rag_status` moves from `pending` → `ready`/`failed`.
- Chat UI polls `GET /uploads/{upload_id}/rag-status` and stays gated until `ready`.
- Re-opening a past upload calls `POST /uploads/{upload_id}/ensure-rag` to (re)index when needed.
- `POST /uploads/{upload_id}/chat` is authenticated, rejects non-ready indexes, and filters vector retrieval by `upload_id`.
- `GET /analysis/{upload_id}/pdf` is authenticated and verifies ownership before generating the PDF.
- Vector storage uses Supabase **vecs** (`contract_documents`); enable the `vector` extension only.

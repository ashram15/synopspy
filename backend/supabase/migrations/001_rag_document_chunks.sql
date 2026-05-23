create extension if not exists vector;

create table if not exists public.document_chunks (
    id uuid primary key default gen_random_uuid(),
    upload_id text not null,
    user_id text not null,
    filename text not null,
    chunk_index integer not null,
    content text not null,
    token_count integer not null default 0,
    embedding vector(768) not null,
    created_at timestamptz not null default now()
);

create index if not exists idx_document_chunks_user_id
    on public.document_chunks (user_id);

create index if not exists idx_document_chunks_upload_id
    on public.document_chunks (upload_id);

create index if not exists idx_document_chunks_embedding
    on public.document_chunks
    using ivfflat (embedding vector_cosine_ops)
    with (lists = 100);

alter table public.document_chunks enable row level security;

create policy if not exists "service_role_full_access_document_chunks"
    on public.document_chunks
    for all
    using (auth.role() = 'service_role')
    with check (auth.role() = 'service_role');

create or replace function public.match_document_chunks(
    query_embedding vector(768),
    filter_user_id text,
    filter_upload_id text,
    match_count integer default 6
)
returns table (
    id uuid,
    upload_id text,
    user_id text,
    filename text,
    chunk_index integer,
    content text,
    token_count integer,
    similarity float
)
language sql
stable
as $$
    select
        dc.id,
        dc.upload_id,
        dc.user_id,
        dc.filename,
        dc.chunk_index,
        dc.content,
        dc.token_count,
        1 - (dc.embedding <=> query_embedding) as similarity
    from public.document_chunks dc
    where dc.user_id = filter_user_id
      and dc.upload_id = filter_upload_id
    order by dc.embedding <=> query_embedding
    limit greatest(match_count, 1);
$$;

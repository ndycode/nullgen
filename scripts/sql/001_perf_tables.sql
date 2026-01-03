create extension if not exists "pgcrypto";

create table if not exists file_metadata (
    id uuid primary key default gen_random_uuid(),
    code text unique not null,
    storage_key text not null,
    original_name text not null,
    size bigint not null,
    mime_type text not null,
    expires_at timestamptz not null,
    max_downloads integer not null,
    download_count integer not null default 0,
    password_hash text,
    downloaded boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists file_metadata_expires_at_idx on file_metadata (expires_at);
create index if not exists file_metadata_download_count_idx on file_metadata (download_count);

create table if not exists upload_sessions (
    code text primary key,
    storage_key text not null,
    original_name text not null,
    size bigint not null,
    mime_type text not null,
    expires_at timestamptz not null,
    max_downloads integer not null,
    password_hash text,
    created_at timestamptz not null default now(),
    session_expires_at timestamptz not null
);

create index if not exists upload_sessions_session_expires_at_idx on upload_sessions (session_expires_at);

create table if not exists share_contents (
    id uuid primary key default gen_random_uuid(),
    content text not null,
    created_at timestamptz not null default now()
);

create table if not exists shares (
    id uuid primary key default gen_random_uuid(),
    code text unique not null,
    type text not null,
    content_id uuid not null references share_contents(id) on delete cascade,
    original_name text,
    mime_type text,
    size bigint,
    language text,
    expires_at timestamptz not null,
    password_hash text,
    burn_after_reading boolean not null default false,
    view_count integer not null default 0,
    burned boolean not null default false,
    created_at timestamptz not null default now()
);

create index if not exists shares_expires_at_idx on shares (expires_at);
create index if not exists shares_burned_idx on shares (burned);

create table if not exists download_tokens (
    token text primary key,
    file_id uuid not null references file_metadata(id) on delete cascade,
    code text not null,
    delete_after boolean not null default false,
    expires_at timestamptz not null,
    created_at timestamptz not null default now()
);

create index if not exists download_tokens_expires_at_idx on download_tokens (expires_at);
create index if not exists download_tokens_code_idx on download_tokens (code);

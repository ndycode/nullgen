-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.download_tokens (
  token text NOT NULL,
  file_id uuid NOT NULL,
  code text NOT NULL,
  delete_after boolean NOT NULL DEFAULT false,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT download_tokens_pkey PRIMARY KEY (token),
  CONSTRAINT download_tokens_file_id_fkey FOREIGN KEY (file_id) REFERENCES public.file_metadata(id)
);
CREATE TABLE public.file_metadata (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  storage_key text NOT NULL,
  original_name text NOT NULL,
  size bigint NOT NULL,
  mime_type text NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  max_downloads integer NOT NULL CHECK (max_downloads = '-1'::integer OR max_downloads >= 1),
  download_count integer NOT NULL DEFAULT 0 CHECK (download_count >= 0),
  password_hash text,
  downloaded boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT file_metadata_pkey PRIMARY KEY (id)
);
CREATE TABLE public.share_contents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT share_contents_pkey PRIMARY KEY (id)
);
CREATE TABLE public.shares (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  type text NOT NULL CHECK (type = ANY (ARRAY['link'::text, 'paste'::text, 'image'::text, 'note'::text, 'code'::text, 'json'::text, 'csv'::text])),
  content_id uuid NOT NULL,
  original_name text,
  mime_type text,
  size bigint,
  language text,
  expires_at timestamp with time zone NOT NULL,
  password_hash text,
  burn_after_reading boolean NOT NULL DEFAULT false,
  view_count integer NOT NULL DEFAULT 0 CHECK (view_count >= 0),
  burned boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT shares_pkey PRIMARY KEY (id),
  CONSTRAINT shares_content_id_fkey FOREIGN KEY (content_id) REFERENCES public.share_contents(id)
);
CREATE TABLE public.upload_sessions (
  code text NOT NULL,
  storage_key text NOT NULL,
  original_name text NOT NULL,
  size bigint NOT NULL,
  mime_type text NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  max_downloads integer NOT NULL,
  password_hash text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  session_expires_at timestamp with time zone NOT NULL,
  CONSTRAINT upload_sessions_pkey PRIMARY KEY (code)
);
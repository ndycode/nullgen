-- =============================================================================
-- Atomic Functions for Data Integrity
-- =============================================================================
-- These functions ensure multi-table writes happen atomically within
-- a single transaction, preventing orphaned records on crash/timeout.
-- =============================================================================

-- Create share_contents and shares atomically
CREATE OR REPLACE FUNCTION create_share_atomic(
    p_content TEXT,
    p_code TEXT,
    p_type TEXT,
    p_original_name TEXT DEFAULT NULL,
    p_mime_type TEXT DEFAULT NULL,
    p_size BIGINT DEFAULT NULL,
    p_language TEXT DEFAULT NULL,
    p_expires_at TIMESTAMPTZ DEFAULT NULL,
    p_password_hash TEXT DEFAULT NULL,
    p_burn_after_reading BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
    share_id UUID,
    content_id UUID,
    code TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_content_id UUID;
    v_share_id UUID;
    v_created_at TIMESTAMPTZ;
BEGIN
    -- Insert share_contents first
    INSERT INTO share_contents (content)
    VALUES (p_content)
    RETURNING id INTO v_content_id;

    -- Insert shares with reference to content
    INSERT INTO shares (
        code,
        type,
        content_id,
        original_name,
        mime_type,
        size,
        language,
        expires_at,
        password_hash,
        burn_after_reading,
        view_count,
        burned
    )
    VALUES (
        p_code,
        p_type,
        v_content_id,
        p_original_name,
        p_mime_type,
        p_size,
        p_language,
        p_expires_at,
        p_password_hash,
        p_burn_after_reading,
        0,
        FALSE
    )
    RETURNING id, shares.created_at INTO v_share_id, v_created_at;

    RETURN QUERY SELECT v_share_id, v_content_id, p_code, v_created_at;
EXCEPTION
    WHEN unique_violation THEN
        -- Code already exists, return empty result
        -- Transaction is automatically rolled back
        RETURN;
END;
$$;

-- Finalize upload session atomically (move from upload_sessions to file_metadata)
CREATE OR REPLACE FUNCTION finalize_upload_atomic(p_code TEXT)
RETURNS TABLE (
    id UUID,
    code TEXT,
    storage_key TEXT,
    original_name TEXT,
    size BIGINT,
    mime_type TEXT,
    expires_at TIMESTAMPTZ,
    max_downloads INTEGER,
    password_hash TEXT,
    download_count INTEGER,
    downloaded BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_session RECORD;
    v_file_id UUID;
    v_created_at TIMESTAMPTZ;
    v_updated_at TIMESTAMPTZ;
BEGIN
    -- Get and lock the session row
    SELECT * INTO v_session
    FROM upload_sessions
    WHERE upload_sessions.code = p_code
    FOR UPDATE;

    IF NOT FOUND THEN
        -- Session doesn't exist
        RETURN;
    END IF;

    -- Check if session has expired
    IF v_session.session_expires_at < NOW() THEN
        -- Delete expired session
        DELETE FROM upload_sessions WHERE upload_sessions.code = p_code;
        RETURN;
    END IF;

    -- Insert into file_metadata
    INSERT INTO file_metadata (
        code,
        storage_key,
        original_name,
        size,
        mime_type,
        expires_at,
        max_downloads,
        password_hash,
        downloaded
    )
    VALUES (
        v_session.code,
        v_session.storage_key,
        v_session.original_name,
        v_session.size,
        v_session.mime_type,
        v_session.expires_at,
        v_session.max_downloads,
        v_session.password_hash,
        FALSE
    )
    RETURNING 
        file_metadata.id,
        file_metadata.created_at,
        file_metadata.updated_at
    INTO v_file_id, v_created_at, v_updated_at;

    -- Delete the session
    DELETE FROM upload_sessions WHERE upload_sessions.code = p_code;

    -- Return the created file record
    RETURN QUERY SELECT 
        v_file_id,
        v_session.code,
        v_session.storage_key,
        v_session.original_name,
        v_session.size,
        v_session.mime_type,
        v_session.expires_at,
        v_session.max_downloads,
        v_session.password_hash,
        0,
        FALSE,
        v_created_at,
        v_updated_at;
EXCEPTION
    WHEN unique_violation THEN
        -- File already exists (duplicate finalization)
        -- Delete session to prevent retry
        DELETE FROM upload_sessions WHERE upload_sessions.code = p_code;
        RETURN;
END;
$$;

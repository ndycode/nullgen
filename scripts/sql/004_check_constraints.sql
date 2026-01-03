-- =============================================================================
-- CHECK Constraints for Data Integrity
-- =============================================================================
-- These constraints enforce valid states at the database level,
-- preventing invalid data from being inserted by any client.
-- =============================================================================

-- Ensure shares.type is one of the valid types
ALTER TABLE shares ADD CONSTRAINT shares_type_check 
CHECK (type IN ('link', 'paste', 'image', 'note', 'code', 'json', 'csv'));

-- Ensure file_metadata.max_downloads is valid (-1 = unlimited, 1+ = limit)
-- Explicitly disallow 0 which would make files impossible to download
ALTER TABLE file_metadata ADD CONSTRAINT file_metadata_max_downloads_check 
CHECK (max_downloads = -1 OR max_downloads >= 1);

-- Ensure view_count and download_count are non-negative
ALTER TABLE shares ADD CONSTRAINT shares_view_count_check 
CHECK (view_count >= 0);

ALTER TABLE file_metadata ADD CONSTRAINT file_metadata_download_count_check 
CHECK (download_count >= 0);

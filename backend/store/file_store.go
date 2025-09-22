package store

import (
	"balkan/models"
	"context"
	"database/sql"
	"fmt"

	"github.com/google/uuid"
	"github.com/lib/pq"
)

// FileStore defines the interface for file data operations.
type FileStore interface {
	// ProcessUpload handles the database transaction for a file upload.
	ProcessUpload(ctx context.Context, logicalFile *models.LogicalFile, physicalFile *models.PhysicalFile) (*models.LogicalFile, bool, error)
	GetFileCountByUserID(userID string) (int64, error)
	GetStorageUsageByUserID(userID string) (int64, error)
	IsFileOwner(ctx context.Context, userID, fileID string) (bool, error)
	SetFileVisibilityPrivate(ctx context.Context, fileID string) error
	SetFileVisibilityPublic(ctx context.Context, fileID string) (string, error)
	SetFileVisibilitySpecific(ctx context.Context, fileID string, userIDs []string) error
	GetFileByPublicToken(ctx context.Context, token string) (*models.LogicalFile, error)
	IncrementFileDownloadCount(ctx context.Context, fileID string) error
	GetFilesByUserID(ctx context.Context, userID string) ([]models.FileMetadata, error)
}

// DBFileStore is a concrete implementation of FileStore.
type DBFileStore struct {
	db *sql.DB
}

func NewFileStore(db *sql.DB) *DBFileStore {
	return &DBFileStore{db: db}
}

// ProcessUpload handles the logic of checking for duplicates and creating
// file records within a single database transaction. It returns the created
// logical file, a boolean indicating if it was a duplicate, and an error.
func (s *DBFileStore) ProcessUpload(ctx context.Context, logicalFile *models.LogicalFile, physicalFile *models.PhysicalFile) (*models.LogicalFile, bool, error) {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, false, fmt.Errorf("could not begin transaction: %w", err)
	}
	defer tx.Rollback() // Rollback on any error.

	// 1. Check if the physical file (by hash) already exists.
	var existingPhysicalFile models.PhysicalFile
	query := "SELECT id FROM physical_files WHERE sha256_hash = $1"
	err = tx.QueryRowContext(ctx, query, physicalFile.FileHash).Scan(&existingPhysicalFile.ID)

	isDuplicate := (err != sql.ErrNoRows)
	if err != nil && err != sql.ErrNoRows {
		return nil, false, fmt.Errorf("failed to check for existing physical file: %w", err)
	}

	if isDuplicate {
		// --- PATH A: File is a duplicate ---
		logicalFile.PhysicalFileID = existingPhysicalFile.ID
		// 2a. Increment the reference count on the existing physical file.
		updateRefQuery := "UPDATE physical_files SET reference_count = reference_count + 1 WHERE id = $1"
		_, err = tx.ExecContext(ctx, updateRefQuery, existingPhysicalFile.ID)
		if err != nil {
			return nil, false, fmt.Errorf("failed to increment reference count: %w", err)
		}
	} else {
		// --- PATH B: File is new ---
		// 2b. Insert the new physical file record.
		insertPhysicalQuery := `
			INSERT INTO physical_files (sha256_hash, mime_type, size, storage_path)
			VALUES ($1, $2, $3, $4) RETURNING id`
		err = tx.QueryRowContext(ctx, insertPhysicalQuery,
			physicalFile.FileHash,
			physicalFile.MimeType,
			physicalFile.Size,
			physicalFile.StoragePath,
		).Scan(&logicalFile.PhysicalFileID)
		if err != nil {
			return nil, false, fmt.Errorf("failed to insert new physical file: %w", err)
		}
	}

	// 3. Insert the logical file record for the user.
	insertLogicalQuery := `
        INSERT INTO logical_files (owner_id, physical_file_id, filename, visibility)
        VALUES ($1, $2, $3, $4) 
        RETURNING id, created_at, updated_at, visibility`
	err = tx.QueryRowContext(ctx, insertLogicalQuery,
		logicalFile.OwnerID,
		logicalFile.PhysicalFileID,
		logicalFile.FileName,
		logicalFile.Visibility,
	).Scan(&logicalFile.ID, &logicalFile.CreatedAt, &logicalFile.UpdatedAt, &logicalFile.Visibility)
	if err != nil {
		return nil, false, fmt.Errorf("failed to insert logical file: %w", err)
	}

	// 4. Update the user's storage usage (only if it was a new file).
	if !isDuplicate {
		updateUserStorageQuery := "UPDATE users SET storage_used = storage_used + $1 WHERE id = $2"
		_, err = tx.ExecContext(ctx, updateUserStorageQuery, physicalFile.Size, logicalFile.OwnerID)
		if err != nil {
			return nil, false, fmt.Errorf("failed to update user storage: %w", err)
		}
	}

	// Commit the transaction if all steps were successful.
	if err = tx.Commit(); err != nil {
		return nil, false, fmt.Errorf("failed to commit transaction: %w", err)
	}

	return logicalFile, isDuplicate, nil
}

func (s *DBFileStore) GetFileCountByUserID(userID string) (int64, error) {
	var count int64
	query := `SELECT COUNT(*) 
              FROM logical_files 
              WHERE owner_id = $1`

	err := s.db.QueryRow(query, userID).Scan(&count)
	return count, err
}

// GetStorageUsageByUserID calculates the total storage used by a user's files.
// This sums the size of all physical files linked to the user's logical files.
// Add this to your FileStore implementation (e.g., in file_store.go)
func (s *DBFileStore) GetStorageUsageByUserID(userID string) (int64, error) {
	var totalStorage int64
	// COALESCE ensures we return 0 instead of NULL if the user has no files
	query := `SELECT COALESCE(SUM(pf.size), 0)
              FROM logical_files lf
              JOIN physical_files pf ON lf.physical_file_id = pf.id
              WHERE lf.owner_id = $1`

	err := s.db.QueryRow(query, userID).Scan(&totalStorage)
	return totalStorage, err
}

// IsFileOwner checks if a given user is the owner of a file.
func (s *DBFileStore) IsFileOwner(ctx context.Context, userID, fileID string) (bool, error) {
	query := `SELECT EXISTS(SELECT 1 FROM logical_files WHERE id = $1 AND owner_id = $2)`

	var exists bool
	err := s.db.QueryRowContext(ctx, query, fileID, userID).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("failed to check file ownership: %w", err)
	}

	return exists, nil
}

// SetFileVisibilityPrivate sets a file's visibility to private, clearing all shares.
func (s *DBFileStore) SetFileVisibilityPrivate(ctx context.Context, fileID string) error {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback() // Rollback is a no-op if Commit succeeds

	// 1. Update visibility and clear public token
	queryUpdate := `UPDATE logical_files SET visibility = 'private', public_share_token = NULL WHERE id = $1`
	if _, err := tx.ExecContext(ctx, queryUpdate, fileID); err != nil {
		return fmt.Errorf("failed to set visibility to private: %w", err)
	}

	// 2. Delete all specific user shares
	queryDelete := `DELETE FROM file_shares WHERE logical_file_id = $1`
	if _, err := tx.ExecContext(ctx, queryDelete, fileID); err != nil {
		return fmt.Errorf("failed to delete specific shares: %w", err)
	}

	return tx.Commit()
}

// SetFileVisibilityPublic sets a file's visibility to public and returns its share token.
func (s *DBFileStore) SetFileVisibilityPublic(ctx context.Context, fileID string) (string, error) {
	// Generate a new token to use *if* one doesn't exist
	newToken := uuid.NewString()

	query := `
        UPDATE logical_files 
        SET 
            visibility = 'public', 
            public_share_token = COALESCE(public_share_token, $1) 
        WHERE id = $2 
        RETURNING public_share_token
    `

	var token string
	err := s.db.QueryRowContext(ctx, query, newToken, fileID).Scan(&token)
	if err != nil {
		return "", fmt.Errorf("failed to set visibility to public: %w", err)
	}

	return token, nil
}

// SetFileVisibilitySpecific shares a file with a specific list of users.
func (s *DBFileStore) SetFileVisibilitySpecific(ctx context.Context, fileID string, userIDs []string) error {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	// 1. Update visibility and clear public token
	queryUpdate := `UPDATE logical_files SET visibility = 'specific', public_share_token = NULL WHERE id = $1`
	if _, err := tx.ExecContext(ctx, queryUpdate, fileID); err != nil {
		return fmt.Errorf("failed to set visibility to specific: %w", err)
	}

	// 2. Delete any old shares
	queryDelete := `DELETE FROM file_shares WHERE logical_file_id = $1`
	if _, err := tx.ExecContext(ctx, queryDelete, fileID); err != nil {
		return fmt.Errorf("failed to delete old specific shares: %w", err)
	}

	// 3. Insert the new shares (only if there are IDs to insert)
	if len(userIDs) > 0 {
		queryInsert := `
            INSERT INTO file_shares (logical_file_id, shared_with_user_id)
            SELECT $1, id
            FROM unnest($2::uuid[]) AS t(id)
        `
		if _, err := tx.ExecContext(ctx, queryInsert, fileID, pq.Array(userIDs)); err != nil {
			return fmt.Errorf("failed to insert new specific shares: %w", err)
		}
	}

	return tx.Commit()
}

// GetFileByPublicToken finds a file by its public token and joins its physical file data.
// NOTE: This assumes your models.LogicalFile struct has a `PhysicalFile *models.PhysicalFile` field.
func (s *DBFileStore) GetFileByPublicToken(ctx context.Context, token string) (*models.LogicalFile, error) {
	query := `
        SELECT 
            lf.id, lf.owner_id, lf.physical_file_id, lf.filename, 
            lf.visibility, lf.download_count, lf.created_at,
            pf.id, pf.sha256_hash, pf.size, pf.mime_type, pf.storage_path
        FROM logical_files lf
        JOIN physical_files pf ON lf.physical_file_id = pf.id
        WHERE lf.public_share_token = $1 AND lf.visibility = 'public'
    `

	lf := &models.LogicalFile{
		PhysicalFile: &models.PhysicalFile{}, // Important: Initialize the nested struct
	}

	// Assumes your LogicalFile struct fields match this order
	err := s.db.QueryRowContext(ctx, query, token).Scan(
		&lf.ID, &lf.OwnerID, &lf.PhysicalFileID, &lf.FileName,
		&lf.Visibility, &lf.DownloadCount, &lf.CreatedAt,
		&lf.PhysicalFile.ID, &lf.PhysicalFile.FileHash, &lf.PhysicalFile.Size,
		&lf.PhysicalFile.MimeType, &lf.PhysicalFile.StoragePath,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, err // Handler will check for this
		}
		return nil, fmt.Errorf("failed to get file by public token: %w", err)
	}

	return lf, nil
}

// IncrementFileDownloadCount increases the download counter for a file.
func (s *DBFileStore) IncrementFileDownloadCount(ctx context.Context, fileID string) error {
	query := `UPDATE logical_files SET download_count = download_count + 1 WHERE id = $1`

	_, err := s.db.ExecContext(ctx, query, fileID)
	if err != nil {
		return fmt.Errorf("failed to increment download count: %w", err)
	}

	return nil
}

// GetFilesByUserID retrieves all files owned by a user with joined data.
func (s *DBFileStore) GetFilesByUserID(ctx context.Context, userID string) ([]models.FileMetadata, error) {
	query := `
        SELECT 
            lf.id, lf.filename, lf.filename AS originalName, pf.size, pf.mime_type, 
            SUBSTRING(lf.filename FROM '\.([^\.]*)$') AS extension,
            pf.sha256_hash, lf.visibility, 'ready' AS status, 
            lf.created_at, lf.updated_at, u.id AS user_id, u.username, u.email,
            lf.download_count
        FROM logical_files lf
        JOIN physical_files pf ON lf.physical_file_id = pf.id
        JOIN users u ON lf.owner_id = u.id
        WHERE lf.owner_id = $1
        ORDER BY lf.created_at DESC
    `
	rows, err := s.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to query files: %w", err)
	}
	defer rows.Close()

	var files []models.FileMetadata
	for rows.Next() {
		var f models.FileMetadata
		var ext sql.NullString // --- 1. Use a temporary variable for scanning ---

		err := rows.Scan(
			&f.ID, &f.Name, &f.OriginalName, &f.Size, &f.MimeType,
			&ext, // --- 2. Scan into the temporary variable ---
			&f.Hash, &f.Visibility, &f.Status,
			&f.UploadedAt, &f.UpdatedAt, &f.UploadedBy.ID, &f.UploadedBy.Name, &f.UploadedBy.Email,
			&f.DownloadCount,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan file row: %w", err)
		}

		// --- 3. Check if the string is valid and assign it ---
		if ext.Valid {
			f.Extension = ext.String
		} else {
			f.Extension = "" // Assign an empty string if null
		}

		f.IsOwner = true // This query only fetches the owner's files
		// Note: You need a route for this, e.g., /api/files/download/{id}
		// For now, we'll construct a placeholder or leave it.
		// f.DownloadURL = fmt.Sprintf("/api/files/download/%s", f.ID)

		files = append(files, f)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error during rows iteration: %w", err)
	}

	// This part was in your file_handler.go, it's better to ensure it here.
	if files == nil {
		files = []models.FileMetadata{}
	}

	return files, nil
}

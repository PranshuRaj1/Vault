package store

import (
	"balkan/models"
	"context"
	"database/sql"
	"fmt"
)

// FileStore defines the interface for file data operations.
type FileStore interface {
	// ProcessUpload handles the database transaction for a file upload.
	ProcessUpload(ctx context.Context, logicalFile *models.LogicalFile, physicalFile *models.PhysicalFile) (*models.LogicalFile, bool, error)
	GetFileCountByUserID(userID string) (int64, error)
	GetStorageUsageByUserID(userID string) (int64, error)
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
		INSERT INTO logical_files (owner_id, physical_file_id, filename)
		VALUES ($1, $2, $3) RETURNING id, created_at, updated_at`
	err = tx.QueryRowContext(ctx, insertLogicalQuery,
		logicalFile.OwnerID,
		logicalFile.PhysicalFileID,
		logicalFile.FileName,
	).Scan(&logicalFile.ID, &logicalFile.CreatedAt, &logicalFile.UpdatedAt)
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

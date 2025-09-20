package models

import "time"

// PhysicalFile represents the actual stored content on disk.
// One physical file can be referenced by many logical files (deduplication).
type PhysicalFile struct {
	ID             string    `json:"id"`
	FileHash       string    `json:"sha256_hash"`
	MimeType       string    `json:"mime_type"`
	Size           int64     `json:"size"`
	StoragePath    string    `json:"storage_path"`
	ReferenceCount int       `json:"reference_count"`
	CreatedAt      time.Time `json:"created_at"`
}

// LogicalFile represents a user's view of a file. It's a pointer
// to a PhysicalFile and contains user-specific metadata.
type LogicalFile struct {
	ID             string    `json:"id"`
	OwnerID        string    `json:"owner_id"`
	PhysicalFileID string    `json:"physical_file_id"`
	FileName       string    `json:"file_name"`
	IsPublic       bool      `json:"is_public"`
	ShareToken     string    `json:"share_token"`
	DownloadCount  int       `json:"download_count"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

// FileUploadResponse is the structure returned after a successful file upload.
type FileUploadResponse struct {
	FileName      string `json:"file_name"`
	Size          int64  `json:"size"`
	Message       string `json:"message"`
	LogicalFileID string `json:"logical_file_id"`
}

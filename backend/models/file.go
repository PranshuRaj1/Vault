package models

import (
	"database/sql"
	"time"
)

// file visblity options
const (
	VisibilityPrivate  = "private"
	VisibilityPublic   = "public"
	VisibilitySpecific = "specific"
)

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
	Visibility     string    `json:"visibility"`
	IsPublic       bool      `json:"is_public"`
	ShareToken     string    `json:"share_token"`
	DownloadCount  int       `json:"download_count"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`

	// Use sql.NullString for nullable fields
	PublicShareToken sql.NullString `json:"public_share_token"`

	// --- This is the new field for JOINed data ---
	// It's ignored by default when writing to JSON if empty.
	PhysicalFile *PhysicalFile `json:"physical_file,omitempty"`
}

// FileUploadResponse is the structure returned after a successful file upload.
type FileUploadResponse struct {
	FileName      string `json:"file_name"`
	Size          int64  `json:"size"`
	Message       string `json:"message"`
	LogicalFileID string `json:"logical_file_id"`
	PublicLink    string `json:"publicLink,omitempty"`
}

// UserFile represents a joined view of a file for the owner.
// This is used to get a list of files for the "My Files" page.
type UserFile struct {
	ID            string    `json:"id"`
	FileName      string    `json:"fileName"`
	Size          int64     `json:"size"`
	MimeType      string    `json:"mimeType"`
	Visibility    string    `json:"visibility"`
	CreatedAt     time.Time `json:"createdAt"`
	UpdatedAt     time.Time `json:"updatedAt"`
	UploaderName  string    `json:"uploaderName"`
	UploaderEmail string    `json:"uploaderEmail"`
	DownloadCount int       `json:"downloadCount"`
}

type FileMetadata struct {
	ID            string         `json:"id"`
	Name          string         `json:"name"` // From logical_files (filename)
	OriginalName  string         `json:"originalName"`
	Size          int64          `json:"size"`       // From physical_files
	MimeType      string         `json:"mimeType"`   // From physical_files
	Extension     string         `json:"extension"`  // Derived from filename
	Hash          string         `json:"hash"`       // From physical_files
	Visibility    string         `json:"visibility"` // From logical_files
	Status        string         `json:"status"`
	UploadedAt    time.Time      `json:"uploadedAt"`    // From logical_files
	UpdatedAt     time.Time      `json:"updatedAt"`     // From logical_files
	UploadedBy    UploadedByInfo `json:"uploadedBy"`    // Joined from users
	DownloadCount int            `json:"downloadCount"` // From logical_files
	IsOwner       bool           `json:"isOwner"`
	DownloadURL   string         `json:"downloadUrl"`
}

// Add this helper struct as well
// UploadedByInfo is a subset of user info for FileMetadata.
type UploadedByInfo struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Email string `json:"email"`
}

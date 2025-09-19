package models

import "time"

// User represents a user in the system.
type User struct {
	ID           string    `json:"id"`
	Username     string    `json:"username"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"` // Never expose this in JSON responses
	StorageQuota int64     `json:"storage_quota"`
	Role         string    `json:"role"`
	CreatedAt    time.Time `json:"created_at"`
}

// --- API Request/Response Structs ---

// RegisterRequest defines the shape of the registration request body.
type RegisterRequest struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

// LoginRequest defines the shape of the login request body.
type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

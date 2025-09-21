package store

import (
	"database/sql"
	"fmt"

	"balkan/models"
)

// UserStore defines the interface for user data operations.
type UserStore interface {
	CreateUser(user *models.User) error
	GetUserByEmail(email string) (*models.User, error)
	GetUserByID(id string) (*models.User, error)
}

// DBUserStore is a concrete implementation of UserStore using a SQL database.
type DBUserStore struct {
	db *sql.DB
}

// NewUserStore creates a new DBUserStore.
func NewUserStore(db *sql.DB) *DBUserStore {
	return &DBUserStore{db: db}
}

// CreateUser inserts a new user into the database.
func (s *DBUserStore) CreateUser(user *models.User) error {
	query := `INSERT INTO users (username, email, password_hash, storage_quota, role)
              VALUES ($1, $2, $3, $4, $5)`
	_, err := s.db.Exec(query, user.Username, user.Email, user.PasswordHash, user.StorageQuota, user.Role)
	if err != nil {
		return fmt.Errorf("failed to create user: %w", err)
	}
	return nil
}

// GetUserByEmail retrieves a user from the database by their email.
func (s *DBUserStore) GetUserByEmail(email string) (*models.User, error) {
	user := &models.User{}
	query := `SELECT id, username, email, password_hash, storage_quota, role, created_at FROM users WHERE email = $1`
	err := s.db.QueryRow(query, email).Scan(
		&user.ID,
		&user.Username,
		&user.Email,
		&user.PasswordHash,
		&user.StorageQuota,
		&user.Role,
		&user.CreatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("user not found")
		}
		return nil, fmt.Errorf("failed to get user by email: %w", err)
	}
	return user, nil
}

func (s *DBUserStore) GetUserByID(id string) (*models.User, error) {
	user := &models.User{}

	// Selects only the fields needed for the dashboard, excluding the password hash
	query := `SELECT id, username, email, role, storage_quota 
              FROM users 
              WHERE id = $1`

	// Assumes your models.User struct can be scanned in this order
	err := s.db.QueryRow(query, id).Scan(
		&user.ID,
		&user.Username,
		&user.Email,
		&user.Role,
		&user.StorageQuota,
	)

	if err != nil {
		return nil, err
	}
	return user, nil
}

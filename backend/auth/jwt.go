package auth

import (
	"fmt"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// CreateJWT generates a new JWT token for a given user ID and role.
func CreateJWT(userID string, userRole string) (string, error) {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		return "", fmt.Errorf("JWT_SECRET environment variable not set")
	}

	// Create the claims
	claims := jwt.MapClaims{
		"userID": userID,
		"role":   userRole,
		"exp":    time.Now().Add(time.Hour * 72).Unix(), // Token expires in 72 hours
		"iat":    time.Now().Unix(),
	}

	// Create token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// Sign token with secret
	return token.SignedString([]byte(secret))
}

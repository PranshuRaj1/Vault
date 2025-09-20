package auth

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"strings"

	"balkan/utils" // Using your existing JSON writer

	"github.com/golang-jwt/jwt/v5"
)

// Define a custom key type to avoid context key collisions.
type contextKey string

const UserIDKey = contextKey("userID")
const UserRoleKey = contextKey("userRole")

// AuthMiddleware is a chi-compatible middleware for JWT authentication.
func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// 1. Get the Authorization header
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			utils.WriteJSON(w, http.StatusUnauthorized, utils.ErrorResponse("Authorization header is required"))
			return
		}

		// 2. Validate the header format (Bearer <token>)
		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			utils.WriteJSON(w, http.StatusUnauthorized, utils.ErrorResponse("Invalid token format. Must be Bearer <token>"))
			return
		}

		// 3. Get the JWT secret
		jwtSecret := os.Getenv("JWT_SECRET")
		if jwtSecret == "" {
			// This is a server error, not a client one.
			utils.WriteJSON(w, http.StatusInternalServerError, utils.ErrorResponse("Server configuration error"))
			return
		}

		// 4. Parse and validate the token
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			return []byte(jwtSecret), nil
		})

		if err != nil {
			utils.WriteJSON(w, http.StatusUnauthorized, utils.ErrorResponse("Invalid or expired token"))
			return
		}

		// 5. Extract claims and add them to the request context
		if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
			userID, okUserID := claims["userID"].(string)
			userRole, okUserRole := claims["role"].(string)

			if !okUserID || !okUserRole {
				utils.WriteJSON(w, http.StatusUnauthorized, utils.ErrorResponse("Invalid token claims"))
				return
			}

			// Add user info to the context
			ctx := context.WithValue(r.Context(), UserIDKey, userID)
			ctx = context.WithValue(ctx, UserRoleKey, userRole)

			// Serve the next handler with the new context
			next.ServeHTTP(w, r.WithContext(ctx))
		} else {
			utils.WriteJSON(w, http.StatusUnauthorized, utils.ErrorResponse("Invalid token"))
		}
	})
}

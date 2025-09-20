package auth

import (
	"balkan/utils"
	"context"
	"fmt"
	"net/http"
	"os"

	"github.com/golang-jwt/jwt/v5"
)

// Define a custom key type to avoid context key collisions.
type contextKey string

const UserIDKey = contextKey("userID")
const UserRoleKey = contextKey("userRole")

// AuthMiddleware is a chi-compatible middleware for JWT authentication
// Reads the token from an httpOnly cookie.
func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

		// 1. Get the cookie from the request
		cookie, err := r.Cookie("auth_token") //Read cookie
		if err != nil {
			if err == http.ErrNoCookie {
				// If the cookie is not set, return an unauthorized status
				utils.WriteJSON(w, http.StatusUnauthorized, utils.ErrorResponse("Unauthorized: No session cookie provided"))
				return
			}
			// For any other error, return a bad request status
			utils.WriteJSON(w, http.StatusBadRequest, utils.ErrorResponse("Bad request"))
			return
		}

		// 2. Get the token string from the cookie
		tokenString := cookie.Value

		// 3. Get the JWT secret
		jwtSecret := os.Getenv("JWT_SECRET")
		if jwtSecret == "" {
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

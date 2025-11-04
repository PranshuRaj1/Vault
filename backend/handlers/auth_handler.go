package handlers

import (
	"encoding/json"
	"log" // <-- Import the log package
	"net/http"
	"time"

	"balkan/auth"
	"balkan/models"
	"balkan/store"
	"balkan/utils"

	"golang.org/x/crypto/bcrypt"
)

// AuthHandler handles authentication-related HTTP requests.
type AuthHandler struct {
	userStore store.UserStore
}

// NewAuthHandler creates a new AuthHandler with the given UserStore.
func NewAuthHandler(us store.UserStore) *AuthHandler {
	return &AuthHandler{userStore: us}
}

// Register handles new user registration.
func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req models.RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteJSON(w, http.StatusBadRequest, utils.ErrorResponse("Invalid request payload"))
		return
	}

	if req.Email == "" || req.Password == "" || req.Username == "" {
		utils.WriteJSON(w, http.StatusBadRequest, utils.ErrorResponse("Username, email, and password are required"))
		return
	}

	_, err := h.userStore.GetUserByEmail(req.Email)
	if err == nil {
		utils.WriteJSON(w, http.StatusConflict, utils.ErrorResponse("User with this email already exists"))
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		utils.WriteJSON(w, http.StatusInternalServerError, utils.ErrorResponse("Failed to hash password"))
		return
	}

	user := &models.User{
		Username:     req.Username,
		Email:        req.Email,
		PasswordHash: string(hashedPassword),
		StorageQuota: 10 * 1024 * 1024, // 10 MB
		Role:         "user",
	}

	if err := h.userStore.CreateUser(user); err != nil {
		// Logging the detailed, internal error to the server console.
		log.Printf("ERROR: Failed to create user in database. Internal error: %v", err)

		utils.WriteJSON(w, http.StatusInternalServerError, utils.ErrorResponse("Failed to create user"))
		return
	}
	// 1. Create a JWT for the new user
	createdUser, err := h.userStore.GetUserByEmail(user.Email)
	if err != nil {
		log.Printf("ERROR: Failed to fetch created user by email %s: %v", user.Email, err)
		utils.WriteJSON(w, http.StatusInternalServerError, utils.ErrorResponse("Failed to complete registration"))
		return
	}

	token, err := auth.CreateJWT(createdUser.ID, createdUser.Role)
	if err != nil {
		// Log the internal error, but send a generic success message
		// The user was created, but login failed.
		log.Printf("ERROR: Failed to create token for new user %s: %v", user.Email, err)
		// We can still return success, but they will have to log in manually
		utils.WriteJSON(w, http.StatusCreated, map[string]string{"message": "User registered, but auto-login failed. Please log in."})
		return
	}

	// 2. Set the httpOnly cookie
	http.SetCookie(w, &http.Cookie{
		Name:     "auth_token",
		Value:    token,
		Expires:  time.Now().Add(24 * time.Hour),
		HttpOnly: true,
		Secure:   r.TLS != nil,
		Path:     "/",
		SameSite: http.SameSiteLaxMode,
	})

	// 3. Send back a success response
	utils.WriteJSON(w, http.StatusCreated, map[string]string{
		"message":  "User registered successfully",
		"username": createdUser.Username,
		"email":    createdUser.Email,
		"userID":   createdUser.ID,
		"userRole": createdUser.Role,
	})

}

// Login handles user login.
func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req models.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.WriteJSON(w, http.StatusBadRequest, utils.ErrorResponse("Invalid request payload"))
		return
	}

	if req.Email == "" || req.Password == "" {
		utils.WriteJSON(w, http.StatusBadRequest, utils.ErrorResponse("Email and password are required"))
		return
	}

	user, err := h.userStore.GetUserByEmail(req.Email)
	if err != nil {
		log.Printf("ERROR: Failed to create user in database. [GetUserByEmail] Internal error: %v", err)
		utils.WriteJSON(w, http.StatusUnauthorized, utils.ErrorResponse("Invalid email or password"))
		return
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password))
	if err != nil {
		log.Printf("ERROR: Failed to create user in database. [CompareHashAndPassword] Internal error: %v", err)
		utils.WriteJSON(w, http.StatusUnauthorized, utils.ErrorResponse("Invalid email or password"))
		return
	}

	token, err := auth.CreateJWT(user.ID, user.Role)
	if err != nil {
		utils.WriteJSON(w, http.StatusInternalServerError, utils.ErrorResponse("Failed to create token"))
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "auth_token",
		Value:    token,
		Expires:  time.Now().Add(24 * time.Hour), // 24-hour expiry
		HttpOnly: true,                           // Prevents JS access
		Secure:   r.TLS != nil,                   // True in production (HTTPS)
		Path:     "/",                            // Available to entire site
		SameSite: http.SameSiteLaxMode,
	})

	utils.WriteJSON(w, http.StatusOK, map[string]string{"token": token})
}

// Logout handles user logout by clearing the cookie.
func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	// Set a cookie with the same name, but with an expiry time in the past
	http.SetCookie(w, &http.Cookie{
		Name:     "auth_token",
		Value:    "",
		Expires:  time.Now().Add(-time.Hour), // An hour in the past
		HttpOnly: true,
		Secure:   r.TLS != nil,
		Path:     "/",
		SameSite: http.SameSiteLaxMode,
	})

	utils.WriteJSON(w, http.StatusOK, map[string]string{"message": "Logged out successfully"})
}

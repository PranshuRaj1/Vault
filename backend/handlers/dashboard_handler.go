package handlers

import (
	"balkan/auth"
	"balkan/store"
	"balkan/utils"
	"log"
	"net/http"
)

// DashboardHandler handles dashboard-related HTTP requests.
type DashboardHandler struct {
	userStore store.UserStore
	fileStore store.FileStore
}

// NewDashboardHandler creates a new DashboardHandler with the given stores.
func NewDashboardHandler(us store.UserStore, fs store.FileStore) *DashboardHandler {
	return &DashboardHandler{
		userStore: us,
		fileStore: fs,
	}
}

// DashboardStatsResponse defines the structure for the dashboard data.
type DashboardStatsResponse struct {
	Username     string `json:"username"`
	Email        string `json:"email"`
	Role         string `json:"role"`
	TotalFiles   int64  `json:"totalFiles"`
	TotalStorage int64  `json:"totalStorage"` // in bytes
	// You can add more stats here later, like public/private file counts
}

// GetDashboardStats fetches and returns key statistics for the user's dashboard.
func (h *DashboardHandler) GetDashboardStats(w http.ResponseWriter, r *http.Request) {
	// 1. Get userID from context (set by AuthMiddleware)
	userID, ok := r.Context().Value(auth.UserIDKey).(string)
	if !ok {
		utils.WriteJSON(w, http.StatusUnauthorized, utils.ErrorResponse("Invalid user context"))
		return
	}

	// 2. Fetch User Details (Username, Email, Role)
	// We need a GetUserByID method in the UserStore for this.
	user, err := h.userStore.GetUserByID(userID)
	if err != nil {
		log.Printf("ERROR: Failed to get user by ID (%s): %v", userID, err)
		utils.WriteJSON(w, http.StatusNotFound, utils.ErrorResponse("User not found"))
		return
	}

	// 3. Fetch Total Files
	totalFiles, err := h.fileStore.GetFileCountByUserID(userID)
	if err != nil {
		log.Printf("ERROR: Failed to get file count for user (%s): %v", userID, err)
		utils.WriteJSON(w, http.StatusInternalServerError, utils.ErrorResponse("Failed to fetch file statistics"))
		return
	}

	// 4. Fetch Total Storage Used
	totalStorage, err := h.fileStore.GetStorageUsageByUserID(userID)
	if err != nil {
		log.Printf("ERROR: Failed to get storage usage for user (%s): %v", userID, err)
		utils.WriteJSON(w, http.StatusInternalServerError, utils.ErrorResponse("Failed to fetch storage statistics"))
		return
	}

	// 5. Construct and send the response
	response := DashboardStatsResponse{
		Username:     user.Username,
		Email:        user.Email,
		Role:         user.Role,
		TotalFiles:   totalFiles,
		TotalStorage: totalStorage,
	}

	utils.WriteJSON(w, http.StatusOK, response)
}

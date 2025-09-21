package handlers

import (
	"balkan/auth"
	"balkan/models" // Assuming you have a models package
	"balkan/store"
	"balkan/utils"
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"path/filepath" // For serving files

	"github.com/go-chi/chi/v5"
)

// ShareHandler handles file/folder sharing operations.
type ShareHandler struct {
	fileStore store.FileStore
	userStore store.UserStore
	// You would also add a folderStore if you implement folder sharing
}

// NewShareHandler creates a new ShareHandler.
func NewShareHandler(fs store.FileStore, us store.UserStore) *ShareHandler {
	return &ShareHandler{
		fileStore: fs,
		userStore: us,
	}
}

// UpdateFileShareSettingsRequest defines the expected JSON body
// for changing a file's visibility.
type UpdateFileShareSettingsRequest struct {
	Visibility string   `json:"visibility"` // "private", "public", or "specific"
	ShareWith  []string `json:"shareWith"`  // List of user *emails* for "specific"
}

// UpdateFileShareSettings handles updating the visibility of a single file.
func (h *ShareHandler) UpdateFileShareSettings(w http.ResponseWriter, r *http.Request) {
	// 1. Get authenticated user ID from context
	userID, ok := r.Context().Value(auth.UserIDKey).(string)
	if !ok {
		utils.WriteJSON(w, http.StatusUnauthorized, utils.ErrorResponse("Invalid user context"))
		return
	}

	// 2. Get fileID from URL parameter
	fileID := chi.URLParam(r, "fileID")
	if fileID == "" {
		utils.WriteJSON(w, http.StatusBadRequest, utils.ErrorResponse("File ID is required"))
		return
	}

	// 3. Decode the request body
	var req UpdateFileShareSettingsRequest
	if err := utils.DecodeJSON(r, &req); err != nil { // Assuming you have a JSON decoder in utils
		utils.WriteJSON(w, http.StatusBadRequest, utils.ErrorResponse("Invalid request payload"))
		return
	}

	// 4. *** CRITICAL: Verify Ownership ***
	// We need a new store method to check if the user owns this file.
	isOwner, err := h.fileStore.IsFileOwner(r.Context(), userID, fileID)
	if err != nil {
		utils.WriteJSON(w, http.StatusInternalServerError, utils.ErrorResponse("Failed to verify ownership"))
		return
	}
	if !isOwner {
		utils.WriteJSON(w, http.StatusForbidden, utils.ErrorResponse("You do not have permission to modify this file"))
		return
	}

	// 5. Process the visibility change
	var responseData map[string]interface{}

	switch req.Visibility {
	case models.VisibilityPrivate:
		// Set to private, clear shares and public token
		if err := h.fileStore.SetFileVisibilityPrivate(r.Context(), fileID); err != nil {
			utils.WriteJSON(w, http.StatusInternalServerError, utils.ErrorResponse("Failed to update file visibility"))
			return
		}
		responseData = map[string]interface{}{"message": "File set to private."}

	case models.VisibilityPublic:
		// Set to public, generate a share token if one doesn't exist
		token, err := h.fileStore.SetFileVisibilityPublic(r.Context(), fileID)
		if err != nil {
			utils.WriteJSON(w, http.StatusInternalServerError, utils.ErrorResponse("Failed to make file public"))
			return
		}
		publicLink := "http://" + r.Host + "/api/public/file/" + token // Construct the link
		responseData = map[string]interface{}{
			"message":    "File is now public.",
			"publicLink": publicLink,
			"token":      token,
		}

	case models.VisibilitySpecific:
		// (Bonus) Set to specific users
		if len(req.ShareWith) == 0 {
			utils.WriteJSON(w, http.StatusBadRequest, utils.ErrorResponse("User emails must be provided for specific sharing"))
			return
		}
		// Get user IDs from the provided emails
		userIDs, err := h.userStore.GetUserIDsByEmails(r.Context(), req.ShareWith)
		if err != nil {
			utils.WriteJSON(w, http.StatusInternalServerError, utils.ErrorResponse("Failed to find specified users"))
			return
		}
		// Update the database
		if err := h.fileStore.SetFileVisibilitySpecific(r.Context(), fileID, userIDs); err != nil {
			utils.WriteJSON(w, http.StatusInternalServerError, utils.ErrorResponse("Failed to share file with users"))
			return
		}
		responseData = map[string]interface{}{
			"message":   "File shared with specific users.",
			"shareWith": req.ShareWith,
		}

	default:
		utils.WriteJSON(w, http.StatusBadRequest, utils.ErrorResponse("Invalid visibility level"))
		return
	}

	utils.WriteJSON(w, http.StatusOK, responseData)
}

// GetPublicFile handles the download of a publicly shared file.
func (h *ShareHandler) GetPublicFile(w http.ResponseWriter, r *http.Request) {
	// 1. Get token from URL
	token := chi.URLParam(r, "token")
	if token == "" {
		utils.WriteJSON(w, http.StatusBadRequest, utils.ErrorResponse("Invalid share link"))
		return
	}

	// 2. Get file details from store using the token
	file, err := h.fileStore.GetFileByPublicToken(r.Context(), token)
	if err != nil {
		if err == sql.ErrNoRows {
			utils.WriteJSON(w, http.StatusNotFound, utils.ErrorResponse("File not found or link is invalid"))
			return
		}
		log.Printf("ERROR: Failed to get file by public token: %v", err)
		utils.WriteJSON(w, http.StatusInternalServerError, utils.ErrorResponse("Error retrieving file"))
		return
	}

	// 3. Increment download count (can be done in a goroutine to not block)
	go func() {
		if err := h.fileStore.IncrementFileDownloadCount(r.Context(), file.ID); err != nil {
			log.Printf("WARN: Failed to increment download count for file %s: %v", file.ID, err)
		}
	}()

	// 4. Set headers to force download
	w.Header().Set("Content-Type", file.PhysicalFile.MimeType)
	w.Header().Set("Content-Length", fmt.Sprintf("%d", file.PhysicalFile.Size))
	w.Header().Set("Content-Disposition", "attachment; filename=\""+filepath.Base(file.FileName)+"\"")

	// 5. Serve the actual file from its storage path
	http.ServeFile(w, r, file.PhysicalFile.StoragePath)
}

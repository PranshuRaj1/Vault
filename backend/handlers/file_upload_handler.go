package handlers

import (
	"balkan/auth"
	"balkan/models"
	"balkan/store"
	"balkan/utils"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"log"
	"mime"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"

	"github.com/google/uuid"
)

const maxUploadSize = 50 * 1024 * 1024 // 50 MB
const uploadPath = "./uploads"

// FileHandler handles file-related HTTP requests.
type FileHandler struct {
	userStore store.UserStore
	fileStore store.FileStore
}

// NewFileHandler creates a new FileHandler.
func NewFileHandler(us store.UserStore, fs store.FileStore) *FileHandler {
	return &FileHandler{
		userStore: us,
		fileStore: fs,
	}
}

// UploadFiles handles multipart file uploads.
func (h *FileHandler) UploadFiles(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(auth.UserIDKey).(string)
	if !ok {
		utils.WriteJSON(w, http.StatusUnauthorized, utils.ErrorResponse("Invalid user context"))
		return
	}

	r.Body = http.MaxBytesReader(w, r.Body, maxUploadSize)
	if err := r.ParseMultipartForm(maxUploadSize); err != nil {
		utils.WriteJSON(w, http.StatusBadRequest, utils.ErrorResponse(fmt.Sprintf("File(s) too large. Total size must not exceed %dMB.", maxUploadSize/(1024*1024))))
		return
	}

	if err := os.MkdirAll(uploadPath, os.ModePerm); err != nil {
		log.Printf("ERROR: Could not create upload directory: %v", err)
		utils.WriteJSON(w, http.StatusInternalServerError, utils.ErrorResponse("Could not process upload"))
		return
	}

	files := r.MultipartForm.File["files"]
	if len(files) == 0 {
		utils.WriteJSON(w, http.StatusBadRequest, utils.ErrorResponse("No files were uploaded. Use the 'files' form field."))
		return
	}

	var responses []models.FileUploadResponse
	for _, fileHeader := range files {
		resp, err := h.processSingleFile(r, userID, fileHeader)
		if err != nil {
			utils.WriteJSON(w, http.StatusInternalServerError, utils.ErrorResponse(err.Error()))
			return
		}
		responses = append(responses, *resp)
	}

	utils.WriteJSON(w, http.StatusCreated, responses)
}

// processSingleFile contains the logic for hashing, storing, and creating DB records for one file.
func (h *FileHandler) processSingleFile(r *http.Request, userID string, fileHeader *multipart.FileHeader) (*models.FileUploadResponse, error) {
	file, err := fileHeader.Open()
	if err != nil {
		return nil, fmt.Errorf("could not open uploaded file '%s'", fileHeader.Filename)
	}
	defer file.Close()

	tempFile, err := os.CreateTemp(uploadPath, "upload-*.tmp")
	if err != nil {
		return nil, fmt.Errorf("server error: could not create temp file")
	}
	defer os.Remove(tempFile.Name())

	hasher := sha256.New()
	multiWriter := io.MultiWriter(tempFile, hasher)

	size, err := io.Copy(multiWriter, file)
	if err != nil {
		return nil, fmt.Errorf("could not read file content for '%s'", fileHeader.Filename)
	}

	hashString := hex.EncodeToString(hasher.Sum(nil))

	tempFile.Seek(0, 0)
	buffer := make([]byte, 512)
	_, err = tempFile.Read(buffer)
	if err != nil && err != io.EOF {
		return nil, fmt.Errorf("server error: could not detect MIME type")
	}
	mimeType := http.DetectContentType(buffer)

	ext := filepath.Ext(fileHeader.Filename)
	expectedMime := mime.TypeByExtension(ext)
	if expectedMime != "" && mimeType != expectedMime {
		log.Printf("WARN: Mismatched MIME type for file %s. Declared: %s, Detected: %s", fileHeader.Filename, expectedMime, mimeType)
	}

	permanentPath := filepath.Join(uploadPath, uuid.NewString())
	physicalFile := &models.PhysicalFile{
		FileHash:    hashString,
		MimeType:    mimeType,
		Size:        size,
		StoragePath: permanentPath,
	}
	logicalFile := &models.LogicalFile{
		OwnerID:  userID,
		FileName: fileHeader.Filename,
	}

	createdLogicalFile, isDuplicate, err := h.fileStore.ProcessUpload(r.Context(), logicalFile, physicalFile)
	if err != nil {
		return nil, fmt.Errorf("failed to save file metadata: %w", err)
	}

	if !isDuplicate {
		if err := os.Rename(tempFile.Name(), permanentPath); err != nil {
			log.Printf("CRITICAL ERROR: Could not move temp file to permanent storage: %v.", err)
			return nil, fmt.Errorf("server error: failed to finalize file storage")
		}
	}

	message := "Uploaded successfully"
	if isDuplicate {
		message = "Linked to existing file (deduplicated)"
	}
	response := &models.FileUploadResponse{
		FileName:      fileHeader.Filename,
		Size:          size,
		Message:       message,
		LogicalFileID: createdLogicalFile.ID,
	}
	return response, nil
}

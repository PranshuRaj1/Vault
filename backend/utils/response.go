package utils

import (
	"encoding/json"
	"net/http"
)

// ErrorResponse creates a standard JSON error response.
func ErrorResponse(message string) map[string]string {
	return map[string]string{"error": message}
}

// WriteJSON sends a JSON response with a given status code and payload.
func WriteJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

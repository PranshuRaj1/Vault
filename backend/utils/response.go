package utils

import (
	"encoding/json"
	"fmt"
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

// DecodeJSON is a helper function to parse a JSON request body.
func DecodeJSON(r *http.Request, v interface{}) error {
	// Create a new decoder for the request body
	decoder := json.NewDecoder(r.Body)
	defer r.Body.Close() // Make sure to close the body

	// This is good practice: it will return an error if the client
	// sends JSON fields that don't exist in your struct (v).
	decoder.DisallowUnknownFields()

	// Decode the JSON from the request body into the provided struct (v)
	err := decoder.Decode(v)
	if err != nil {
		return fmt.Errorf("failed to decode JSON body: %w", err)
	}

	return nil
}

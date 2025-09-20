package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"balkan/auth"
	"balkan/handlers"
	"balkan/store"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/joho/godotenv"
)

func main() {
	// Load .env file.
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables.")
	}

	// --- Database Connection ---
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL environment variable is not set")
	}

	db, err := sql.Open("pgx", dbURL)
	if err != nil {
		log.Fatalf("Unable to open database connection: %v\n", err)
	}
	defer db.Close()

	if err = db.Ping(); err != nil {
		log.Fatalf("Unable to ping database: %v\n", err)
	}
	fmt.Println("Successfully connected to Neon database!")

	// --- Dependency Injection ---
	userStore := store.NewUserStore(db)
	fileStore := store.NewFileStore(db) // New dependency for file operations
	authHandler := handlers.NewAuthHandler(userStore)
	fileHandler := handlers.NewFileHandler(userStore, fileStore) // New handler for files

	// --- Router Setup ---
	r := chi.NewRouter()

	// --- Middleware ---
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.Timeout(60 * time.Second))

	// CORS middleware configuration
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://*", "https://*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// --- API Routes ---
	r.Route("/api", func(r chi.Router) {
		// --- Public Routes (No Auth Required) ---
		r.Post("/register", authHandler.Register)
		r.Post("/login", authHandler.Login)

		// --- Protected Routes (Auth Required) ---
		r.Group(func(r chi.Router) {
			// Apply the AuthMiddleware to this entire group of routes
			r.Use(auth.AuthMiddleware)

			// Route for user info
			r.Get("/me", func(w http.ResponseWriter, r *http.Request) {
				userID := r.Context().Value(auth.UserIDKey).(string)
				userRole := r.Context().Value(auth.UserRoleKey).(string)
				w.Header().Set("Content-Type", "application/json")
				fmt.Fprintf(w, `{"message": "This is a protected route", "userID": "%s", "userRole": "%s"}`, userID, userRole)
			})

			// Route for handling file uploads
			r.Post("/files", fileHandler.UploadFiles)
		})
	})

	// A simple health check endpoint
	r.Get("/", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("File Vault API is running."))
	})

	// --- Start Server ---
	port := ":8080"
	log.Printf("Server starting on port %s", port)
	if err := http.ListenAndServe(port, r); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"balkan/handlers"
	"balkan/store"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/joho/godotenv"
)

func main() {
	// Load .env file. In production, these should be actual environment variables.
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
	// Create instances of our dependencies (store, auth, handlers)
	userStore := store.NewUserStore(db)
	authHandler := handlers.NewAuthHandler(userStore)

	// --- Router Setup ---
	r := chi.NewRouter()

	// --- Middleware ---
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)    // Log requests to the console
	r.Use(middleware.Recoverer) // Recover from panics without crashing
	r.Use(middleware.Timeout(60 * time.Second))

	// Basic CORS middleware. In production, you would restrict this
	// to your actual frontend domain.
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://*", "https://*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300, // Maximum value not ignored by any browser
	}))

	// --- API Routes ---
	r.Route("/api", func(r chi.Router) {
		r.Post("/register", authHandler.Register)
		r.Post("/login", authHandler.Login)
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

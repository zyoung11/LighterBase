package main

import (
	"context"
	"database/sql"
	"embed"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"

	"LighterBase/database"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	_ "github.com/mattn/go-sqlite3"
)

//go:embed SQL/schema.sql
var schemaFS embed.FS

var queries *database.Queries

var routes = []Route{
	{Method: "GET", Path: "/health", Handler: health},
	{Method: "GET", Path: "/api/web/security", Handler: getAllSecurity},
}

type Route struct {
	Method  string
	Path    string
	Handler fiber.Handler
}

func init() {
	if err := initDatabase(); err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	log.Println("Database initialized successfully!")
}

func NewApp(name string, routes []Route) *fiber.App {
	app := fiber.New(fiber.Config{AppName: name})

	app.Use(cors.New())

	app.Use(logger.New())

	for _, r := range routes {
		app.Add(strings.ToUpper(r.Method), r.Path, r.Handler)
	}

	return app
}

func Run(name string, port int, routes []Route) {
	app := NewApp(name, routes)
	log.Fatal(app.Listen(fmt.Sprintf(":%d", port)))
}

func initDatabase() error {
	dbPath := "./LighterBaseDate/metaDate.db"

	if err := os.MkdirAll(filepath.Dir(dbPath), 0o755); err != nil {
		return fmt.Errorf("could not create database directory: %w", err)
	}

	if _, err := os.Stat(dbPath); os.IsNotExist(err) {
		log.Printf("Database file not found at %s. Initializing...", dbPath)

		db, err := sql.Open("sqlite3", dbPath)
		if err != nil {
			return fmt.Errorf("could not open database: %w", err)
		}
		defer db.Close()

		if err := runSchema(db); err != nil {
			return fmt.Errorf("could not run database schema: %w", err)
		}
		log.Println("Database schema executed successfully.")
	} else {
		log.Printf("Database file found at %s. Skipping initialization.", dbPath)
	}

	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		return fmt.Errorf("could not open database for queries: %w", err)
	}

	queries = database.New(db)

	return nil
}

func runSchema(db *sql.DB) error {
	schemaBytes, err := schemaFS.ReadFile("SQL/schema.sql")
	if err != nil {
		return fmt.Errorf("could not read embedded schema file: %w", err)
	}

	_, err = db.Exec(string(schemaBytes))
	if err != nil {
		return fmt.Errorf("could not execute schema: %w", err)
	}

	return nil
}

func main() {
	Run("LighterBase", 8080, routes)
}

func health(c *fiber.Ctx) error {
	return c.SendStatus(200)
}

func getAllSecurity(c *fiber.Ctx) error {
	securities, err := queries.ListSecurities(context.Background())
	if err != nil {
		return c.Status(500).SendString(err.Error())
	}
	return c.JSON(securities)
}

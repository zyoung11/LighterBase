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

var dataDB *sql.DB

var routes = []Route{
	{Method: "GET", Path: "/health", Handler: health},
	{Method: "GET", Path: "/api/web/security", Handler: getAllSecurity},
	{Method: "GET", Path: "/api/data/:table", Handler: getDataFromTable},
}

type Route struct {
	Method  string
	Path    string
	Handler fiber.Handler
}

func init() {
	if err := initMetaDatabase(); err != nil {
		log.Fatalf("Failed to initialize meta database: %v", err)
	}
	log.Println("Meta database initialized successfully!")

	if err := initDataDatabase(); err != nil {
		log.Fatalf("Failed to initialize data database: %v", err)
	}
	log.Println("Data database initialized successfully!")
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

func initMetaDatabase() error {
	dbPath := "./LighterBaseDate/metaDate.db"
	if err := os.MkdirAll(filepath.Dir(dbPath), 0o755); err != nil {
		return fmt.Errorf("could not create database directory: %w", err)
	}
	if _, err := os.Stat(dbPath); os.IsNotExist(err) {
		log.Printf("Meta database file not found. Initializing...")
		db, err := sql.Open("sqlite3", dbPath)
		if err != nil {
			return fmt.Errorf("could not open meta database: %w", err)
		}
		defer db.Close()
		if err := runSchema(db); err != nil {
			return fmt.Errorf("could not run meta database schema: %w", err)
		}
		log.Println("Meta database schema executed.")
	}
	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		return fmt.Errorf("could not open meta database for queries: %w", err)
	}
	queries = database.New(db)
	return nil
}

func initDataDatabase() error {
	dbPath := "./LighterBaseDate/data.db"
	if err := os.MkdirAll(filepath.Dir(dbPath), 0o755); err != nil {
		return fmt.Errorf("could not create database directory: %w", err)
	}
	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		return fmt.Errorf("could not open data database: %w", err)
	}
	if _, err := os.Stat(dbPath); os.IsNotExist(err) {
		log.Printf("Data database file not found. Initializing...")
		if err := createUsersTable(db); err != nil {
			return fmt.Errorf("could not create users table: %w", err)
		}
		log.Println("Users table created in data database.")
	}
	dataDB = db
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

func createUsersTable(db *sql.DB) error {
	createTableSQL := `
	CREATE TABLE IF NOT EXISTS users (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT NOT NULL,
		password_hash TEXT NOT NULL,
		email TEXT NOT NULL UNIQUE,
		"create" TEXT NOT NULL,
		"update" TEXT NOT NULL
	);`
	_, err := db.Exec(createTableSQL)
	return err
}

// getTableColumns 获取一个表的所有列名
func getTableColumns(db *sql.DB, tableName string) ([]string, error) {
	query := fmt.Sprintf("PRAGMA table_info(%s)", tableName)
	rows, err := db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to query table info for %s: %w", tableName, err)
	}
	defer rows.Close()

	var columns []string
	for rows.Next() {
		var cid int
		var name, dataType string
		var notNull, pk int
		var defaultValue interface{}
		if err := rows.Scan(&cid, &name, &dataType, &notNull, &defaultValue, &pk); err != nil {
			return nil, fmt.Errorf("failed to scan column info: %w", err)
		}
		columns = append(columns, name)
	}
	return columns, nil
}

// queryTableAsMap 通用查询函数，返回 []map[string]interface{}
func queryTableAsMap(db *sql.DB, tableName string, whereClause string, args ...interface{}) ([]map[string]interface{}, error) {
	columns, err := getTableColumns(db, tableName)
	if err != nil {
		return nil, err
	}
	if len(columns) == 0 {
		return []map[string]interface{}{}, nil
	}

	query := fmt.Sprintf("SELECT * FROM %s", tableName)
	if whereClause != "" {
		query += " " + whereClause
	}

	rows, err := db.Query(query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to execute query on table %s: %w", tableName, err)
	}
	defer rows.Close()

	values := make([]interface{}, len(columns))
	scanArgs := make([]interface{}, len(columns))
	for i := range values {
		scanArgs[i] = &values[i]
	}

	var results []map[string]interface{}
	for rows.Next() {
		if err := rows.Scan(scanArgs...); err != nil {
			return nil, fmt.Errorf("failed to scan row: %w", err)
		}

		rowMap := make(map[string]interface{})
		for i, colName := range columns {
			val := values[i]
			b, ok := val.([]byte)
			if ok {
				rowMap[colName] = string(b)
			} else {
				rowMap[colName] = val
			}
		}
		results = append(results, rowMap)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error during rows iteration: %w", err)
	}

	return results, nil
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

func getDataFromTable(c *fiber.Ctx) error {
	tableName := c.Params("table")
	if tableName == "" {
		return c.Status(400).SendString("Table name is required")
	}

	whereClause := "WHERE 1=1"
	var args []interface{}
	if name := c.Query("name"); name != "" {
		whereClause += " AND name = ?"
		args = append(args, name)
	}

	data, err := queryTableAsMap(dataDB, tableName, whereClause, args...)
	if err != nil {
		if strings.Contains(err.Error(), "no such table") {
			return c.Status(404).SendString(fmt.Sprintf("Table '%s' not found", tableName))
		}
		return c.Status(500).SendString(err.Error())
	}

	return c.JSON(data)
}

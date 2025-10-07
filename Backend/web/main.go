package main

import (
	"database/sql"
	"embed"
	"errors"
	"fmt"
	"io/fs"
	"log"
	"net/http"
	"os"
	"os/exec"
	"os/user"
	"path"
	"path/filepath"
	"runtime"
	"strings"
	"time"

	"LighterBaseHub/database"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/golang-jwt/jwt/v5"
	_ "github.com/mattn/go-sqlite3"
	"golang.org/x/crypto/bcrypt"
)

//go:embed SQL/schema.sql
var schemaFS embed.FS

var queries *database.Queries

var dataDB *sql.DB

var routes = []Route{
	{Method: "GET", Path: "/health", Handler: health},
}

type Route struct {
	Method  string
	Path    string
	Handler fiber.Handler
}

//------------------------------------JWT---------------------------------------

type MyCustomClaims struct {
	UserID int64 `json:"user_id"`
	jwt.RegisteredClaims
}

var jwtSecret = []byte("my_super_super_super_secret_key_that_is_very_long_and_not_that_random")

// GenerateJWT 为给定用户 ID 生成一个新的 JWT
func GenerateJWT(userID int64) (string, time.Time, error) {
	expirationTime := time.Now().Add(48 * time.Hour)

	claims := &MyCustomClaims{
		UserID: userID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(jwtSecret)
	if err != nil {
		return "", time.Time{}, err
	}

	return tokenString, expirationTime, nil
}

// ParseJWT 解析并验证 JWT，返回用户 ID
func ParseJWT(tokenString string) (int64, error) {
	token, err := jwt.ParseWithClaims(tokenString, &MyCustomClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return jwtSecret, nil
	})
	if err != nil {
		return 0, err
	}

	if claims, ok := token.Claims.(*MyCustomClaims); ok && token.Valid {
		return claims.UserID, nil
	}

	return 0, errors.New("invalid token")
}

//------------------------------------init--------------------------------------

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

//------------------------------------web---------------------------------------

func web() {
	buildPath := "./dist"

	if _, err := os.Stat(buildPath); os.IsNotExist(err) {
		fmt.Printf("Directory %s does not exist", buildPath)
		return
	}

	fileServer := http.FileServer(http.Dir(buildPath))

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		requestedPath := path.Join(buildPath, path.Clean(r.URL.Path))
		if _, err := os.Stat(requestedPath); os.IsNotExist(err) {
			r.URL.Path = "/"
		}
		fileServer.ServeHTTP(w, r)
	})

	port := "8090"
	if envPort := os.Getenv("PORT"); envPort != "" {
		port = envPort
	}

	go func() {
		time.Sleep(500 * time.Millisecond)
		openBrowser("http://localhost:8090")
	}()

	log.Printf("Server starting on port %s...", port)
	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatal("Server failed:", err)
	}
}

//go:embed build/*
var embeddedFiles embed.FS

func webEmbed() {
	buildFS, err := fs.Sub(embeddedFiles, "build")
	if err != nil {
		log.Fatal("Failed to create sub filesystem:", err)
	}

	fileServer := http.FileServer(http.FS(buildFS))

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		_, err := buildFS.Open(path.Clean(r.URL.Path))
		if os.IsNotExist(err) {
			r.URL.Path = "/"
		}
		fileServer.ServeHTTP(w, r)
	})

	port := "8070"
	if envPort := os.Getenv("PORT"); envPort != "" {
		port = envPort
	}

	go func() {
		time.Sleep(500 * time.Millisecond)
		openBrowser("http://localhost:8070")
	}()

	log.Printf("Server starting on port %s...", port)
	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatal("Server failed:", err)
	}
}

func openBrowser(url string) error {
	var cmd string
	var args []string

	currentUser, _ := user.Current()
	if currentUser != nil && currentUser.Uid == "0" {
		if sudoUser := os.Getenv("SUDO_USER"); sudoUser != "" {
			return exec.Command("sudo", "-u", sudoUser, "xdg-open", url).Start()
		} else {
			env := os.Environ()
			env = append(env, "DISPLAY=:0")

			if xdgCurrentDesktop := os.Getenv("XDG_CURRENT_DESKTOP"); xdgCurrentDesktop != "" {
				env = append(env, "XDG_CURRENT_DESKTOP="+xdgCurrentDesktop)
			}
			if xdgSessionType := os.Getenv("XDG_SESSION_TYPE"); xdgSessionType != "" {
				env = append(env, "XDG_SESSION_TYPE="+xdgSessionType)
			}

			command := exec.Command("xdg-open", url)
			command.Env = env
			return command.Start()
		}
	}

	switch runtime.GOOS {
	case "windows":
		cmd = "cmd"
		args = []string{"/c", "start"}
	case "darwin":
		cmd = "open"
	default:
		cmd = "xdg-open"
	}
	args = append(args, url)

	return exec.Command(cmd, args...).Start()
}

//------------------------------------------------------------------------------

func main() {
	go func() {
		web()
	}()

	go func() {
		webEmbed()
	}()

	Run("LighterBase", 8080, routes)
}

//----------------------------------routing--------------------------------------

func health(c *fiber.Ctx) error {
	return c.SendStatus(200)
}

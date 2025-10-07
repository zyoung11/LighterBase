package main

import (
	"database/sql"
	"embed"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/exec"
	"os/user"
	"path"
	"path/filepath"
	"runtime"
	"strconv"
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

// JWTMiddleware 验证JWT中间件
func JWTMiddleware(c *fiber.Ctx) error {
	authHeader := c.Get("Authorization")
	if authHeader == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Missing authorization header"})
	}

	tokenString := strings.Replace(authHeader, "Bearer ", "", 1)
	userID, err := ParseJWT(tokenString)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid token"})
	}

	c.Locals("userID", userID)
	return c.Next()
}

//------------------------------------init--------------------------------------

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

// initDB 初始化数据库
func initDB(projectName string) {
	// 确保数据目录存在
	dataDir := fmt.Sprintf("./%sData", projectName)
	if _, err := os.Stat(dataDir); os.IsNotExist(err) {
		if err := os.MkdirAll(dataDir, 0o755); err != nil {
			log.Fatalf("Failed to create data directory: %v", err)
		}
	}

	// 打开数据库连接
	dbPath := filepath.Join(dataDir, "data.db")
	db, err := sql.Open("sqlite3", dbPath+"?_journal_mode=WAL")
	if err != nil {
		log.Fatalf("Failed to open database: %v", err)
	}

	// 设置WAL模式
	if _, err := db.Exec("PRAGMA journal_mode=WAL;"); err != nil {
		log.Fatalf("Failed to set WAL mode: %v", err)
	}

	// 读取schema文件
	schema, err := schemaFS.ReadFile("SQL/schema.sql")
	if err != nil {
		log.Fatalf("Failed to read schema file: %v", err)
	}

	// 执行schema
	if _, err := db.Exec(string(schema)); err != nil {
		log.Fatalf("Failed to execute schema: %v", err)
	}

	// 初始化sqlc查询
	queries = database.New(db)
}

//------------------------------------web---------------------------------------

func web(buildPath string, port int) {
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

	if envPort := os.Getenv("PORT"); envPort != "" {
		if p, err := strconv.Atoi(envPort); err == nil {
			port = p
		} else {
			log.Printf("Invalid PORT environment variable: %s, using default %d", envPort, port)
		}
	}

	go func() {
		time.Sleep(500 * time.Millisecond)
		openBrowser(fmt.Sprintf("http://localhost:%v", port))
	}()

	log.Printf("Server starting on port %d...", port)
	if err := http.ListenAndServe(":"+strconv.Itoa(port), nil); err != nil {
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

func initBackend(projectName string, frontendDir string, backendPort int, frontendPort int) {
	initDB(projectName)

	go func() {
		web(frontendDir, frontendPort)
	}()

	Run(projectName, backendPort, routes)
}

//----------------------------------routing--------------------------------------

func health(c *fiber.Ctx) error {
	return c.SendStatus(200)
}

// 注册请求结构
type RegisterRequest struct {
	UserName string `json:"user_name"`
	Password string `json:"password"`
	Email    string `json:"email"`
}

// 登录请求结构
type LoginRequest struct {
	UserName string `json:"user_name"`
	Password string `json:"password"`
}

// 用户响应结构
type UserResponse struct {
	UserID     int64  `json:"user_id"`
	UserName   string `json:"user_name"`
	Email      string `json:"email"`
	UserAvatar string `json:"user_avatar"`
	CreateAt   string `json:"create_at"`
	UpdateAt   string `json:"update_at"`
}

// 注册用户
func register(c *fiber.Ctx) error {
	var req RegisterRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	// 检查用户是否已存在
	_, err := queries.GetUserByEmail(c.Context(), req.Email)
	if err == nil {
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{"error": "User already exists"})
	}

	// 加密密码
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to hash password"})
	}

	// 创建用户
	user, err := queries.CreateUser(c.Context(), database.CreateUserParams{
		UserName:     req.UserName,
		PasswordHash: string(hashedPassword),
		Email:        req.Email,
		UserAvatar:   sql.NullString{},
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create user"})
	}

	// 生成JWT
	token, _, err := GenerateJWT(user.UserID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to generate token"})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"user":  user,
		"token": token,
	})
}

// 用户登录
func login(c *fiber.Ctx) error {
	var req LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	// 获取用户
	user, err := queries.GetUserByName(c.Context(), req.UserName)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid credentials"})
	}

	// 验证密码
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid credentials"})
	}

	// 生成JWT
	token, _, err := GenerateJWT(user.UserID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to generate token"})
	}

	return c.JSON(fiber.Map{
		"user":  user,
		"token": token,
	})
}

// 获取所有用户
func listUsers(c *fiber.Ctx) error {
	// 获取当前用户ID
	currentUserID, ok := c.Locals("userID").(int64)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}

	// 检查是否是当前用户或管理员
	if currentUserID == 1 {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Forbidden"})
	}

	users, err := queries.ListAllUsers(c.Context())
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch users"})
	}

	return c.JSON(users)
}

// 获取单个用户
func getUser(c *fiber.Ctx) error {
	id, err := c.ParamsInt("id")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid user ID"})
	}

	// 获取当前用户ID
	currentUserID, ok := c.Locals("userID").(int64)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}

	// 检查是否是当前用户或管理员
	if currentUserID != int64(id) || currentUserID == 1 {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Forbidden"})
	}

	user, err := queries.GetUserByID(c.Context(), int64(id))
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "User not found"})
	}

	return c.JSON(user)
}

// 更新用户
func updateUser(c *fiber.Ctx) error {
	id, err := c.ParamsInt("id")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid user ID"})
	}

	// 获取当前用户ID
	currentUserID, ok := c.Locals("userID").(int64)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}

	// 检查是否是当前用户或管理员
	if currentUserID != int64(id) || currentUserID == 1 {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Forbidden"})
	}

	var req struct {
		UserName   string `json:"user_name"`
		Password   string `json:"password"`
		UserAvatar string `json:"user_avatar"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	var hashedPassword string
	if req.Password != "" {
		hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to hash password"})
		}
		hashedPassword = string(hash)
	}

	avatar := sql.NullString{String: req.UserAvatar, Valid: req.UserAvatar != ""}

	user, err := queries.UpdateUser(c.Context(), database.UpdateUserParams{
		UserName:     req.UserName,
		PasswordHash: hashedPassword,
		UserAvatar:   avatar,
		UserID:       int64(id),
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to update user"})
	}

	return c.JSON(user)
}

// 删除用户
func deleteUser(c *fiber.Ctx) error {
	id, err := c.ParamsInt("id")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid user ID"})
	}

	// 获取当前用户ID
	currentUserID, ok := c.Locals("userID").(int64)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}

	// 检查是否是当前用户或管理员
	if currentUserID != int64(id) || currentUserID == 1 {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Forbidden"})
	}

	// 删除用户
	if err := queries.DeleteUser(c.Context(), int64(id)); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to delete user"})
	}

	return c.SendStatus(fiber.StatusNoContent)
}

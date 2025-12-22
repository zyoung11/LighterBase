package main

import (
	"LighterBase/database"
	"database/sql"
	"embed"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/exec"
	"os/user"
	"path/filepath"
	"runtime"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2/middleware/limiter"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/monitor"
	"github.com/gofiber/fiber/v2/middleware/recover"
	_ "github.com/mattn/go-sqlite3"
	"golang.org/x/crypto/bcrypt"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/compress"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/etag"
	"github.com/gofiber/fiber/v2/middleware/filesystem"

	"github.com/golang-jwt/jwt/v5"
	_ "github.com/mattn/go-sqlite3"
)

//go:embed config/jwt_secrets.json
//go:embed SQL/schema.sql
var schemaFS embed.FS

var (
	queries *database.Queries
	db      *sql.DB
)

type Route struct {
	Method       string
	Path         string
	Handler      fiber.Handler
	AuthRequired bool
}

//------------------------------------JWT---------------------------------------

type MyCustomClaims struct {
	UserID int64 `json:"user_id"`
	jwt.RegisteredClaims
}

type JWTSecrets struct {
	WebJWTSecret  string `json:"web_jwt_secret"`
	BaasJWTSecret string `json:"baas_jwt_secret"`
}

var jwtSecrets JWTSecrets

func init() {
	// 加载JWT密钥
	secretsBytes, err := schemaFS.ReadFile("config/jwt_secrets.json")
	if err != nil {
		log.Fatalf("Failed to load JWT secrets: %v", err)
	}

	if err := json.Unmarshal(secretsBytes, &jwtSecrets); err != nil {
		log.Fatalf("Failed to parse JWT secrets: %v", err)
	}

	// 验证密钥长度
	if len(jwtSecrets.WebJWTSecret) < 32 {
		log.Fatal("Web JWT secret is too short, must be at least 32 characters")
	}
	if len(jwtSecrets.BaasJWTSecret) < 32 {
		log.Fatal("Baas JWT secret is too short, must be at least 32 characters")
	}
}

// GenerateWebJWT 为Web管理后台生成JWT
func GenerateWebJWT(userID int64) (string, time.Time, error) {
	return generateJWT(userID, jwtSecrets.WebJWTSecret)
}

// generateJWT 内部JWT生成函数
func generateJWT(userID int64, secret string) (string, time.Time, error) {
	expirationTime := time.Now().Add(48 * time.Hour)

	claims := &MyCustomClaims{
		UserID: userID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(secret))
	if err != nil {
		return "", time.Time{}, err
	}

	return tokenString, expirationTime, nil
}

// ParseWebJWT 解析并验证Web管理后台的JWT
func ParseWebJWT(tokenString string) (int64, error) {
	return parseJWT(tokenString, jwtSecrets.WebJWTSecret)
}

// parseJWT 内部JWT解析函数
func parseJWT(tokenString string, secret string) (int64, error) {
	token, err := jwt.ParseWithClaims(tokenString, &MyCustomClaims{}, func(token *jwt.Token) (any, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(secret), nil
	})
	if err != nil {
		return 0, err
	}

	if claims, ok := token.Claims.(*MyCustomClaims); ok && token.Valid {
		return claims.UserID, nil
	}

	return 0, errors.New("invalid token")
}

// JWTMiddleware 验证Web管理后台JWT中间件
func JWTMiddleware(c *fiber.Ctx) error {
	authHeader := c.Get("Authorization")
	if authHeader == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Missing authorization header"})
	}

	tokenString := strings.Replace(authHeader, "Bearer ", "", 1)
	userID, err := ParseWebJWT(tokenString)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid token"})
	}

	c.Locals("userID", userID)
	return c.Next()
}

// ------------------------------------init--------------------------------------

//go:embed build/*
var buildFS embed.FS

//go:embed config/routes.json
var routesJSON []byte

type routeItem struct {
	Path string `json:"path"`
	File string `json:"file"`
}

type config struct {
	Port   int         `json:"port"`
	Routes []routeItem `json:"routes"`
}

func NewApp(name string, routes []Route) (*fiber.App, int) {
	var cfg config
	if err := json.Unmarshal(routesJSON, &cfg); err != nil {
		log.Fatalf("routes.json 格式错误: %v", err)
	}

	app := fiber.New(fiber.Config{AppName: name})

	app.Use(recover.New())

	app.Use(compress.New())
	app.Use(etag.New())

	app.Use(cors.New())

	app.Use(limiter.New(limiter.Config{
		Max:               100,
		Expiration:        30 * time.Second,
		LimiterMiddleware: limiter.SlidingWindow{},
	}))

	app.Get("/metrics", monitor.New(monitor.Config{
		Title:   "LighterBase",
		Refresh: 500 * time.Millisecond,
	}))

	app.Use(logger.New())

	for _, r := range routes {
		// 先收集需要用到的中间件
		var mws []fiber.Handler

		// 1. 如果路由需要 projectMiddleware
		if !strings.Contains(r.Path, "/:userId/:projectId/init") &&
			strings.Contains(r.Path, ":userId") &&
			strings.Contains(r.Path, ":projectId") {
			mws = append(mws, projectMiddleware)
		}

		// 2. 如果路由需要 JWT 鉴权
		if r.AuthRequired {
			mws = append(mws, JWTMiddleware)
		}

		// 把中间件和最终处理器一起展开
		app.Add(strings.ToUpper(r.Method), r.Path,
			append(mws, r.Handler)...)
	}

	for _, r := range cfg.Routes {
		target := filepath.Join("build", r.File)
		app.Get(r.Path, func(c *fiber.Ctx) error {
			data, err := buildFS.ReadFile(target)
			if err != nil {
				return c.Status(404).SendString("File not found")
			}

			contentType := "text/html"
			if filepath.Ext(r.File) == ".css" {
				contentType = "text/css"
			} else if filepath.Ext(r.File) == ".js" {
				contentType = "application/javascript"
			} else if filepath.Ext(r.File) == ".json" {
				contentType = "application/json"
			}

			c.Set("Content-Type", contentType)
			return c.Send(data)
		})
	}

	app.Use("/", filesystem.New(filesystem.Config{
		Root:       http.FS(buildFS),
		PathPrefix: "build",
		MaxAge:     86400,
	}))

	app.Use("*", func(c *fiber.Ctx) error {
		data, err := buildFS.ReadFile("build/index.html")
		if err != nil {
			return c.Status(404).SendString("Index file not found")
		}
		c.Set("Content-Type", "text/html")
		return c.Send(data)
	})

	return app, cfg.Port
}

func Run(name string, routes []Route) {
	app, port := NewApp(name, routes)
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
	var err error
	db, err = sql.Open("sqlite3", dbPath+"?_journal_mode=WAL")
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

func web() {
	app := fiber.New(fiber.Config{AppName: "Website"})

	app.Use(compress.New())
	app.Use(etag.New())

	app.Static("/", "./dist", fiber.Static{
		Compress:      true,
		CacheDuration: 0,
		MaxAge:        0,
		Index:         "index.html",
	})

	go func() {
		time.Sleep(300 * time.Millisecond)
		openBrowser("http://localhost:8090")
	}()

	log.Fatal(app.Listen(":8090"))
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

func initBackend(projectName string, Port int) {
	initDB(projectName)

	// 加载已有项目数据库连接
	loadExistingProjects()

	go func() {
		time.Sleep(300 * time.Millisecond)
		openBrowser(fmt.Sprintf("http://localhost:%v", Port))
	}()

	Run(projectName, routes)
}

//--------------------------------helper-func-------------------------------------

// 辅助函数：将User转换为UserResponse
func userToResponse(user database.User) UserResponse {
	var avatar string
	if user.UserAvatar.Valid {
		avatar = user.UserAvatar.String
	}

	return UserResponse{
		UserID:     user.UserID,
		UserName:   user.UserName,
		Email:      user.Email,
		UserAvatar: avatar,
		CreateAt:   user.CreateAt.String,
		UpdateAt:   user.UpdateAt.String,
	}
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

	if req.UserName == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Username is required"})
	}
	if len(req.UserName) < 2 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Username must be at least 2 characters"})
	}
	if len(req.UserName) > 50 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Username must be at most 50 characters"})
	}

	if req.Password == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Password is required"})
	}
	if len(req.Password) < 2 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Password must be at least 2 characters"})
	}
	if len(req.Password) > 128 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Password must be at most 128 characters"})
	}

	if req.Email == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Email is required"})
	}
	if len(req.Email) < 6 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Email must be at least 6 characters"})
	}
	if len(req.Email) > 255 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Email must be at most 255 characters"})
	}

	count, err := queries.CountUsers(c.Context())
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to check init status"})
	}

	if count >= 1 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Already registered"})
	}

	// 检查邮箱是否已存在
	_, err = queries.GetUserByEmail(c.Context(), req.Email)
	if err == nil {
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{"error": "Email already exists"})
	}

	// 检查用户名是否已存在
	_, err = queries.GetUserByName(c.Context(), req.UserName)
	if err == nil {
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{"error": "Username already exists"})
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

	// 生成Web管理后台JWT
	token, _, err := GenerateWebJWT(user.UserID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to generate token"})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"user":  userToResponse(user),
		"token": token,
	})
}

// 用户登录
func login(c *fiber.Ctx) error {
	var req LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	if req.UserName == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Username is required"})
	}

	if req.Password == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Password is required"})
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

	// 生成Web管理后台JWT
	token, _, err := GenerateWebJWT(user.UserID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to generate token"})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"user":  userToResponse(user),
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
	if currentUserID != 1 {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Forbidden"})
	}

	// 解析分页参数
	page := c.QueryInt("page", 1)
	perPage := c.QueryInt("perpage", 30)

	if page < 1 || perPage < 1 || perPage > 100 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid pagination parameters"})
	}

	// 获取总数
	total, err := queries.CountUsers(c.Context())
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to count users"})
	}

	// 计算分页
	totalPages := int((total + int64(perPage) - 1) / int64(perPage))
	offset := (page - 1) * perPage

	// 获取用户列表
	users, err := queries.ListAllUsers(c.Context(), database.ListAllUsersParams{
		Limit:  int64(perPage),
		Offset: int64(offset),
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch users"})
	}

	var response []UserResponse
	for _, user := range users {
		response = append(response, userToResponse(user))
	}

	return c.JSON(fiber.Map{
		"page":       page,
		"perPage":    perPage,
		"totalPages": totalPages,
		"totalItems": total,
		"users":      response,
	})
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
	if currentUserID != int64(id) && currentUserID != 1 {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Forbidden"})
	}

	user, err := queries.GetUserByID(c.Context(), int64(id))
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "User not found"})
	}

	return c.JSON(userToResponse(user))
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
	if currentUserID != int64(id) && currentUserID != 1 {
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

	return c.JSON(userToResponse(user))
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
	if currentUserID != int64(id) && currentUserID != 1 {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Forbidden"})
	}

	// 删除用户
	if err := queries.DeleteUser(c.Context(), int64(id)); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to delete user"})
	}

	return c.SendStatus(fiber.StatusNoContent)
}

func checkInit(c *fiber.Ctx) error {
	count, err := queries.CountUsers(c.Context())
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to check init status"})
	}

	return c.JSON(fiber.Map{"init": count > 0})
}

// refreshWebToken 刷新Web管理后台JWT
func refreshWebToken(c *fiber.Ctx) error {
	// 获取当前用户ID
	currentUserID, ok := c.Locals("userID").(int64)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}

	// 检查用户是否存在
	user, err := queries.GetUserByID(c.Context(), currentUserID)
	if err != nil {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "User not found"})
	}

	// 生成新的Web管理后台JWT
	token, expire, err := GenerateWebJWT(user.UserID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to generate token"})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"user":   userToResponse(user),
		"token":  token,
		"expire": expire.Format(time.RFC3339),
	})
}

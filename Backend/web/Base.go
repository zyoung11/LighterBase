package main

import (
	"LighterBaseHub/database"
	"context"
	"database/sql"
	"embed"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	_ "github.com/mattn/go-sqlite3"
	"golang.org/x/crypto/bcrypt"
)

//go:embed SQL/schema.sql
//go:embed SQL/schema_baas.sql
//go:embed config/jwt_secrets.json
var schemaFS embed.FS

var (
	queries *database.Queries
	db      *sql.DB
)

// ConnectionManager 管理项目连接状态
type ConnectionManager struct {
	mu sync.RWMutex
	// 存储连接状态，key为"userID/projectID"
	connections map[string]*ConnectionStatus
}

type ConnectionStatus struct {
	dbSet       *DBSet
	isClosed    bool
	closeReason string
	closedAt    time.Time
}

var connManager *ConnectionManager

// NewConnectionManager 创建新的连接管理器
func NewConnectionManager() *ConnectionManager {
	return &ConnectionManager{
		connections: make(map[string]*ConnectionStatus),
	}
}

// RegisterConnection 注册新的项目连接
func (cm *ConnectionManager) RegisterConnection(key string, dbSet *DBSet) {
	cm.mu.Lock()
	defer cm.mu.Unlock()

	cm.connections[key] = &ConnectionStatus{
		dbSet:       dbSet,
		isClosed:    false,
		closeReason: "",
		closedAt:    time.Time{},
	}
}

// GetConnection 获取项目连接，如果连接已关闭则返回错误
func (cm *ConnectionManager) GetConnection(key string) (*DBSet, string, error) {
	cm.mu.RLock()
	defer cm.mu.RUnlock()

	status, exists := cm.connections[key]
	if !exists {
		return nil, "", fmt.Errorf("connection not found for key: %s", key)
	}

	if status.isClosed {
		return nil, status.closeReason, fmt.Errorf("connection closed: %s", status.closeReason)
	}

	return status.dbSet, "", nil
}

// CloseConnection 关闭项目连接
func (cm *ConnectionManager) CloseConnection(key string, reason string) error {
	cm.mu.Lock()
	defer cm.mu.Unlock()

	status, exists := cm.connections[key]
	if !exists {
		return fmt.Errorf("connection not found for key: %s", key)
	}

	status.isClosed = true
	status.closeReason = reason
	status.closedAt = time.Now()

	// 关闭数据库连接
	if status.dbSet != nil {
		if status.dbSet.DataDB != nil {
			status.dbSet.DataDB.Close()
		}
	}

	// log.Printf("Closed connection for %s: %s", key, reason)
	return nil
}

// IsConnectionClosed 检查连接是否已关闭
func (cm *ConnectionManager) IsConnectionClosed(key string) bool {
	cm.mu.RLock()
	defer cm.mu.RUnlock()

	status, exists := cm.connections[key]
	if !exists {
		return true // 不存在视为已关闭
	}

	return status.isClosed
}

// RemoveConnection 移除连接（用于项目删除）
func (cm *ConnectionManager) RemoveConnection(key string) {
	cm.mu.Lock()
	defer cm.mu.Unlock()

	status, exists := cm.connections[key]
	if exists && status.dbSet != nil {
		if status.dbSet.DataDB != nil {
			status.dbSet.DataDB.Close()
		}
	}
	delete(cm.connections, key)
}

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

// GenerateBaasJWT 为BaaS应用生成JWT
func GenerateBaasJWT(userID int64) (string, time.Time, error) {
	return generateJWT(userID, jwtSecrets.BaasJWTSecret)
}

// generateJWT 内部JWT生成函数
func generateJWT(userID int64, secret string) (string, time.Time, error) {
	// expirationTime := time.Now().Add(48 * time.Hour)
	expirationTime := time.Now().Add(10 * time.Minute)

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

// ParseBaasJWT 解析并验证BaaS应用的JWT
func ParseBaasJWT(tokenString string) (int64, error) {
	return parseJWT(tokenString, jwtSecrets.BaasJWTSecret)
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

//------------------------------------init--------------------------------------

func Run(name string, port int, routes []Route) {
	app := NewApp(name, routes)
	log.Fatal(app.Listen(fmt.Sprintf(":%d", port)))
}

// loadExistingProjects 加载已有项目的数据库连接
func loadExistingProjects() {
	baseDir := "./LighterBaseHubData/Apps"

	// 检查目录是否存在
	if _, err := os.Stat(baseDir); os.IsNotExist(err) {
		return
	}

	// 遍历用户目录
	userDirs, err := os.ReadDir(baseDir)
	if err != nil {
		log.Printf("无法读取用户目录: %v", err)
		return
	}

	for _, userDir := range userDirs {
		if !userDir.IsDir() {
			continue
		}

		userID := userDir.Name()
		userPath := filepath.Join(baseDir, userID)

		// 遍历项目目录
		projectDirs, err := os.ReadDir(userPath)
		if err != nil {
			log.Printf("无法读取用户 %s 的项目目录: %v", userID, err)
			continue
		}

		for _, projectDir := range projectDirs {
			if !projectDir.IsDir() {
				continue
			}

			projectID := projectDir.Name()
			projectPath := filepath.Join(userPath, projectID)

			// 检查数据库文件是否存在
			metaDBPath := filepath.Join(projectPath, "metaDate.db")
			dataDBPath := filepath.Join(projectPath, "data.db")

			if _, err := os.Stat(metaDBPath); os.IsNotExist(err) {
				continue
			}
			if _, err := os.Stat(dataDBPath); os.IsNotExist(err) {
				continue
			}

			// 打开数据库连接
			metaDB, err := sql.Open("sqlite3", metaDBPath)
			if err != nil {
				log.Printf("无法打开元数据库 %s: %v", metaDBPath, err)
				continue
			}

			dataDB, err := sql.Open("sqlite3", dataDBPath)
			if err != nil {
				log.Printf("无法打开数据数据库 %s: %v", dataDBPath, err)
				metaDB.Close()
				continue
			}

			// 初始化查询
			queries := database.New(metaDB)

			// 生成写日志闭包
			logFn := func(logText string) {
				_ = queries.CreateLog(context.Background(), logText)
			}

			// 保存连接到全局map
			key := fmt.Sprintf("%s/%s", userID, projectID)
			dbSet := &DBSet{
				Queries: queries,
				DataDB:  dataDB,
				LogFn:   logFn,
			}
			dbMap[key] = dbSet

			// 注册到连接管理器
			if connManager != nil {
				connManager.RegisterConnection(key, dbSet)
			}

			log.Printf("已加载项目: %s", key)
		}
	}

	log.Printf("完成加载已有项目，共加载 %d 个项目", len(dbMap))
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

// calculateProjectSize 计算项目文件夹大小（单位MB）
func calculateProjectSize(projectDir string) (float64, error) {
	var totalSizeBytes int64

	err := filepath.Walk(projectDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			// log.Printf("WARN: Error accessing file %s: %v", path, err)
			return nil
		}
		if !info.IsDir() {
			totalSizeBytes += info.Size()
		}
		return nil
	})
	if err != nil {
		return 0, fmt.Errorf("failed to walk project directory %s: %w", projectDir, err)
	}

	// 将字节转换为MB (B -> KB -> MB)
	sizeMB := float64(totalSizeBytes) / 1024.0 / 1024.0
	return sizeMB, nil
}

// checkAndCloseOversizedProjects 检查并关闭超过100MB的项目，同时更新数据库中的项目大小
func checkAndCloseOversizedProjects() {
	// log.Println("开始定期检查项目大小...")

	baseDir := "./LighterBaseHubData/Apps"

	// 检查目录是否存在
	if _, err := os.Stat(baseDir); os.IsNotExist(err) {
		// log.Println("项目目录不存在，跳过大小检查")
		return
	}

	// 遍历用户目录
	userDirs, err := os.ReadDir(baseDir)
	if err != nil {
		log.Printf("无法读取用户目录: %v", err)
		return
	}

	oversizedCount := 0
	checkedCount := 0

	for _, userDir := range userDirs {
		if !userDir.IsDir() {
			continue
		}

		userID := userDir.Name()
		userPath := filepath.Join(baseDir, userID)

		// 遍历项目目录
		projectDirs, err := os.ReadDir(userPath)
		if err != nil {
			log.Printf("无法读取用户 %s 的项目目录: %v", userID, err)
			continue
		}

		for _, projectDir := range projectDirs {
			if !projectDir.IsDir() {
				continue
			}

			projectID := projectDir.Name()
			projectPath := filepath.Join(userPath, projectID)
			key := fmt.Sprintf("%s/%s", userID, projectID)

			// 计算项目大小
			sizeMB, err := calculateProjectSize(projectPath)
			if err != nil {
				log.Printf("无法计算项目 %s 的大小: %v", key, err)
				continue
			}

			checkedCount++
			// log.Printf("项目 %s 大小: %.2f MB", key, sizeMB)

			// 尝试更新数据库中的项目大小
			// 注意：这里需要将projectID转换为int64
			projectIDInt, err := strconv.ParseInt(projectID, 10, 64)
			if err != nil {
				log.Printf("无法转换项目ID %s: %v", projectID, err)
				continue
			}

			// 查找项目记录
			_, err = queries.GetProjectByID(context.Background(), projectIDInt)
			if err != nil {
				// 项目可能不存在于数据库中，跳过
				continue
			}

			// 更新数据库中的项目大小
			err = queries.UpdateProjectSize(context.Background(), database.UpdateProjectSizeParams{
				ProjectSize: sql.NullInt64{Int64: int64(sizeMB), Valid: true},
				ProjectID:   projectIDInt,
			})
			if err != nil {
				log.Printf("无法更新项目 %s 的大小到数据库: %v", key, err)
			} else {
				// log.Printf("已更新项目 %s 的数据库大小为 %.2f MB", key, sizeMB)
			}

			// 如果超过100MB，关闭连接
			if sizeMB > 100 {
				reason := fmt.Sprintf("项目大小超过限制 (%.2f MB > 100 MB)", sizeMB)
				if err := connManager.CloseConnection(key, reason); err != nil {
					log.Printf("无法关闭项目 %s 的连接: %v", key, err)
				} else {
					// log.Printf("已关闭项目 %s 的连接: %s", key, reason)
					oversizedCount++
				}
			}
		}
	}

	// log.Printf("项目大小检查完成，检查了 %d 个项目，共关闭 %d 个超过100MB的项目", checkedCount, oversizedCount)
}

// startPeriodicSizeCheck 启动定期项目大小检查
func startPeriodicSizeCheck() {
	// 立即执行一次检查
	go func() {
		checkAndCloseOversizedProjects()
	}()

	// 启动定时器，每3分钟检查一次
	ticker := time.NewTicker(3 * time.Minute)

	go func() {
		for {
			select {
			case <-ticker.C:
				checkAndCloseOversizedProjects()
			}
		}
	}()

	// log.Println("已启动定期项目大小检查，每3分钟检查一次")
}

func initBackend(projectName string, backendPort int) {
	initDB(projectName)

	// 初始化连接管理器
	connManager = NewConnectionManager()

	// 加载已有项目数据库连接
	loadExistingProjects()

	// 启动定期项目大小检查
	startPeriodicSizeCheck()

	Run(projectName, backendPort, routes)
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

	// 检查邮箱是否已存在
	_, err := queries.GetUserByEmail(c.Context(), req.Email)
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

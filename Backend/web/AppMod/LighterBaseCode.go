package main

import (
	"context"
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
	"regexp"
	"runtime"
	// "strconv"
	"strings"
	"time"

	"LighterBase/database"

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

	// --- JWT 认证 API ---
	{Method: "POST", Path: "/api/auth/login", Handler: login},
	{Method: "POST", Path: "/api/auth/refresh", Handler: refreshToken},

	// --- BaaS SQL API ---
	{Method: "POST", Path: "/api/create-table/create/", Handler: execSQL},

	// --- BaaS 通用 CRUD API ---
	{Method: "POST", Path: "/api/auto/create/:table", Handler: createRecord},
	{Method: "DELETE", Path: "/api/auto/delete/:table", Handler: deleteRecord},
	{Method: "PUT", Path: "/api/auto/update/:table", Handler: updateRecord},
	{Method: "POST", Path: "/api/auto/view/:table", Handler: viewRecords},

	// --- _sqls_ 表管理 API ---
	{Method: "GET", Path: "/api/sqls/latest", Handler: getLatestSqlRecord},
	// {Method: "POST", Path: "/api/sqls/", Handler: createSqlRecord},
	// {Method: "DELETE", Path: "/api/sqls/:id", Handler: deleteSqlRecord},
	// {Method: "PUT", Path: "/api/sqls/:id", Handler: updateSqlRecord},

	// --- _security_ 表管理 API (需要 JWT) ---
	{Method: "GET", Path: "/api/security", Handler: getAllSecurity},
	// {Method: "POST", Path: "/api/security/:table_name", Handler: createSecurityPolicy},
	// {Method: "DELETE", Path: "/api/security/:table_name", Handler: deleteSecurityPolicy},
	{Method: "PUT", Path: "/api/security/:table_name", Handler: updateSecurityPolicy},

	// --- 其他查询 API ---
	{Method: "GET", Path: "/api/query/tables", Handler: listDataTables},
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
	token, err := jwt.ParseWithClaims(tokenString, &MyCustomClaims{}, func(token *jwt.Token) (any, error) {
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

//------------------------------------------------------------------------------

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

	if _, err := db.Exec("PRAGMA journal_mode=WAL;"); err != nil {
		return fmt.Errorf("could not enable WAL mode on meta database: %w", err)
	}

	queries = database.New(db)
	return nil
}

func initDataDatabase() error {
	dbPath := "./LighterBaseDate/data.db"
	if err := os.MkdirAll(filepath.Dir(dbPath), 0o755); err != nil {
		return fmt.Errorf("could not create database directory: %w", err)
	}

	needInit := false
	if _, err := os.Stat(dbPath); os.IsNotExist(err) {
		needInit = true
	}

	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		return fmt.Errorf("could not open data database: %w", err)
	}

	if _, err := db.Exec("PRAGMA journal_mode=WAL;"); err != nil {
		return fmt.Errorf("could not enable WAL mode on data database: %w", err)
	}

	if needInit {
		log.Printf("Data database file not found. Initializing...")
		if err := createUsersTable(db); err != nil {
			return fmt.Errorf("could not create users table: %w", err)
		}
		log.Println("Users table created in data database.")

		// 为users表添加空的权限记录
		if err := queries.CreateSecurity(context.Background(), database.CreateSecurityParams{
			TableName:   "users",
			CreateWhere: sql.NullString{Valid: false},
			DeleteWhere: sql.NullString{Valid: false},
			UpdateWhere: sql.NullString{Valid: false},
			ViewWhere:   sql.NullString{Valid: false},
		}); err != nil {
			return fmt.Errorf("could not create default security policy for users table: %w", err)
		}
		log.Println("Default security policy created for users table.")
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
		avatar TEXT,
		create_at TEXT,
		update_at TEXT
	);
	`
	_, err := db.Exec(createTableSQL)
	return err
}

//------------------------------------------------------------------------------

//--------------------------------helper-func-----------------------------------

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
		var defaultValue any
		if err := rows.Scan(&cid, &name, &dataType, &notNull, &defaultValue, &pk); err != nil {
			return nil, fmt.Errorf("failed to scan column info: %w", err)
		}
		columns = append(columns, name)
	}
	return columns, nil
}

// queryTableAsMap 通用查询函数，返回 []map[string]any
func queryTableAsMap(db *sql.DB, tableName string, whereClause string, args ...any) ([]map[string]any, error) {
	columns, err := getTableColumns(db, tableName)
	if err != nil {
		return nil, err
	}
	if len(columns) == 0 {
		return []map[string]any{}, nil
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

	values := make([]any, len(columns))
	scanArgs := make([]any, len(columns))
	for i := range values {
		scanArgs[i] = &values[i]
	}

	var results []map[string]any
	for rows.Next() {
		if err := rows.Scan(scanArgs...); err != nil {
			return nil, fmt.Errorf("failed to scan row: %w", err)
		}

		rowMap := make(map[string]any)
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

func sendError(c *fiber.Ctx, status int, message string, data any) error {
	return c.Status(status).JSON(fiber.Map{
		"status":  status,
		"message": message,
		"data":    data,
	})
}

func isValidIdentifier(s string) bool {
	if s == "" {
		return false
	}
	for _, r := range s {
		if !((r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z') || (r >= '0' && r <= '9') || r == '_') {
			return false
		}
	}
	return true
}

// findUserByName 根据用户名查找用户
func findUserByName(name string) (map[string]any, error) {
	data, err := queryTableAsMap(dataDB, "users", "WHERE name = ?", name)
	if err != nil {
		return nil, err
	}
	if len(data) == 0 {
		return nil, nil
	}
	return data[0], nil
}

// findUserByID 根据 ID 查找用户
func findUserByID(id int64) (map[string]any, error) {
	data, err := queryTableAsMap(dataDB, "users", "WHERE id = ?", id)
	if err != nil {
		return nil, err
	}
	if len(data) == 0 {
		return nil, nil
	}
	return data[0], nil
}

// 从请求中解析 JWT 并返回用户 ID
func authenticateUser(c *fiber.Ctx) (int64, error) {
	authHeader := c.Get("Authorization")
	if authHeader == "" {
		return 0, errors.New("authorization header is required")
	}

	if len(authHeader) <= 7 || authHeader[:7] != "Bearer " {
		return 0, errors.New("invalid authorization header format")
	}

	tokenString := authHeader[7:]
	userID, err := ParseJWT(tokenString)
	if err != nil {
		return 0, errors.New("invalid or expired token")
	}

	return userID, nil
}

// authenticateUserForAPI 用于通用API的认证，返回用户ID和是否为访客
func authenticateUserForAPI(c *fiber.Ctx) (int64, bool, error) {
	authHeader := c.Get("Authorization")
	if authHeader == "" {
		return 0, true, nil
	}

	if len(authHeader) <= 7 || authHeader[:7] != "Bearer " {
		return 0, false, fmt.Errorf("invalid authorization header format")
	}

	tokenString := authHeader[7:]
	userID, err := ParseJWT(tokenString)
	if err != nil {
		return 0, false, fmt.Errorf("invalid or expired token")
	}

	return userID, false, nil
}

func checkPermission(operation, tableName string, userID int64, isGuest bool) (bool, error) {
	policy, err := getSecurityByTable(tableName)
	if err != nil {
		return false, fmt.Errorf("failed to retrieve security policy: %w", err)
	}

	// 如果没有策略，则默认允许
	if policy == nil {
		return true, nil
	}

	var whereClause string
	switch operation {
	case "create":
		if !policy.CreateWhere.Valid || policy.CreateWhere.String == "" {
			return true, nil
		}
		whereClause = policy.CreateWhere.String
	case "delete":
		if !policy.DeleteWhere.Valid || policy.DeleteWhere.String == "" {
			return true, nil
		}
		whereClause = policy.DeleteWhere.String
	case "update":
		if !policy.UpdateWhere.Valid || policy.UpdateWhere.String == "" {
			return true, nil
		}
		whereClause = policy.UpdateWhere.String
	case "view":
		if !policy.ViewWhere.Valid || policy.ViewWhere.String == "" {
			return true, nil
		}
		whereClause = policy.ViewWhere.String
	default:
		return false, fmt.Errorf("unknown operation: %s", operation)
	}

	// 检查是否是简单的 "@uid" 权限
	if strings.TrimSpace(whereClause) == "@uid" {
		// 如果是 "@uid" 且是访客，则拒绝
		if isGuest {
			return false, fmt.Errorf("AUTH_REQUIRED")
		}
		// 否则允许（已登录用户）
		return true, nil
	}

	// 对于复杂权限，必须是已登录用户
	if isGuest {
		return false, fmt.Errorf("AUTH_REQUIRED")
	}

	// 将 @uid 替换为实际的 userID
	finalWhereClause := strings.ReplaceAll(whereClause, "@uid", fmt.Sprintf("%d", userID))

	// 构建 SELECT EXISTS 查询
	checkQuery := fmt.Sprintf("SELECT EXISTS (SELECT 1 FROM \"%s\" WHERE %s) AS permission_granted", tableName, finalWhereClause)

	var permissionGranted bool
	err = dataDB.QueryRow(checkQuery).Scan(&permissionGranted)
	if err != nil {
		return false, fmt.Errorf("failed to execute permission check query: %w", err)
	}

	// 如果权限检查失败，检查表是否为空
	if !permissionGranted {
		var count int64
		countQuery := fmt.Sprintf("SELECT COUNT(*) FROM \"%s\"", tableName)
		err = dataDB.QueryRow(countQuery).Scan(&count)
		if err != nil {
			return false, fmt.Errorf("failed to check table count: %w", err)
		}

		if count == 0 {
			return false, fmt.Errorf("TABLE_EMPTY")
		}
	}

	return permissionGranted, nil
}

// 增加创建时间和更新时间
func autoFillTimeFields(body map[string]any) {
	now := time.Now().Format(time.RFC3339)
	body["create_at"] = now
	body["update_at"] = now
}

// 是否为系统保留列（内置用户已有的列）
func isSystemColumn(col string) bool {
	switch col {
	case "id", "name", "password_hash", "email", "avatar", "create_at", "update_at":
		return true
	}
	return false
}

// 是否尝试动 id=1 的记录
func touchingRootUser(where string, args []any) bool {
	return strings.Contains(where, "id=1") ||
		(strings.Contains(where, "id=@uid") && len(args) > 0 && args[0] == int64(1))
}

//------------------------------------------------------------------------------

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


//----------------------------------routing--------------------------------------

func health(c *fiber.Ctx) error {
	return c.SendStatus(200)
}

// execSQL 执行用户提供的 SQL（root 专属，事务级保护，users 表只读）
func execSQL(c *fiber.Ctx) error {
	// 1.  root 专属
	userID, err := authenticateUser(c)
	if err != nil || userID != 1 {
		return sendError(c, 403, "You are not allowed to perform this request.", nil)
	}

	// 2. 取 SQL
	type Body struct {
		SQL string `json:"SQL"`
	}
	var body Body
	if err := c.BodyParser(&body); err != nil {
		return sendError(c, 400, "Invalid JSON body.", nil)
	}
	if body.SQL == "" {
		return sendError(c, 400, "Failed to exec SQL.", fiber.Map{"SQL": "SQL field is required."})
	}

	// 3. 启动事务
	tx, err := dataDB.Begin()
	if err != nil {
		return sendError(c, 500, "Failed to begin transaction.", fiber.Map{"database_error": err.Error()})
	}
	// 任何错误都回滚
	defer func() {
		if err != nil {
			_ = tx.Rollback()
		}
	}()

	// 4. 安全审查（仅在事务内做，失败即回滚）
	sqlUpper := strings.ToUpper(strings.TrimSpace(body.SQL))
	words := strings.Fields(sqlUpper)

	// 4.1 如果是 ALTER TABLE users
	if len(words) >= 3 && words[0] == "ALTER" && words[1] == "TABLE" &&
		strings.Contains(sqlUpper, "USERS") {

		// 必须是 ADD COLUMN
		if !strings.Contains(sqlUpper, "ADD COLUMN") {
			err = fmt.Errorf("only ADD COLUMN is allowed on users table")
			return sendError(c, 403, err.Error(), nil)
		}

		// 提取新列名
		var newCol string
		for i, w := range words {
			if w == "COLUMN" && i+1 < len(words) {
				newCol = strings.Trim(words[i+1], `"`)
				break
			}
		}
		if newCol == "" {
			err = fmt.Errorf("can not parse new column name")
			return sendError(c, 400, err.Error(), nil)
		}

		// 不能与系统列重名
		systemCols := map[string]bool{
			"ID": true, "NAME": true, "PASSWORD_HASH": true, "EMAIL": true,
			"AVATAR": true, "CREATE_AT": true, "UPDATE_AT": true,
		}
		if systemCols[strings.ToUpper(newCol)] {
			err = fmt.Errorf("column %s already exists and is read-only", newCol)
			return sendError(c, 403, err.Error(), nil)
		}

		// 禁止其他 ALTER 子句
		forbidden := []string{"DROP COLUMN", "RENAME COLUMN", "ALTER COLUMN"}
		for _, f := range forbidden {
			if strings.Contains(sqlUpper, f) {
				err = fmt.Errorf("%s is forbidden on users table", f)
				return sendError(c, 403, err.Error(), nil)
			}
		}
	}

	// 4.2 禁止任何对 users 表的 DROP/TRUNCATE/DELETE/UPDATE
	badVerbs := []string{"DROP", "TRUNCATE", "DELETE", "UPDATE"}
	for _, v := range badVerbs {
		if strings.HasPrefix(sqlUpper, v) && strings.Contains(sqlUpper, "USERS") {
			err = fmt.Errorf("users table is read-only, %s is forbidden", v)
			return sendError(c, 403, err.Error(), nil)
		}
	}

	// 5. 执行用户 SQL（事务内）
	if _, err = tx.Exec(body.SQL); err != nil {
		return sendError(c, 400, "Failed to exec SQL.", fiber.Map{"database_error": err.Error()})
	}

	// 6. 写审计日志（用 sqlc 插到 metaDate.db）
	err = queries.CreateSql(context.Background(), body.SQL)
	if err != nil {
		return sendError(c, 500, "Failed to log SQL.", fiber.Map{"database_error": err.Error()})
	}

	// 7. 全部成功 -> 提交
	if err = tx.Commit(); err != nil {
		return sendError(c, 500, "Failed to commit transaction.", fiber.Map{"database_error": err.Error()})
	}

	go func(sqlText string) {
		re := regexp.MustCompile(`(?mi)CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?"?([a-zA-Z_][a-zA-Z0-9_]*)"?`)
		allMatches := re.FindAllStringSubmatch(sqlText, -1)

		for _, matches := range allMatches {
			if len(matches) < 2 {
				continue
			}
			tableName := matches[1]

			_ = queries.CreateSecurity(context.Background(), database.CreateSecurityParams{
				TableName:   tableName,
				CreateWhere: sql.NullString{Valid: false},
				DeleteWhere: sql.NullString{Valid: false},
				UpdateWhere: sql.NullString{Valid: false},
				ViewWhere:   sql.NullString{Valid: false},
			})
		}
	}(body.SQL)

	return c.Status(201).JSON(fiber.Map{"SQL": body.SQL})
}

// --- BaaS 通用 CRUD API ---

// createRecord 动态向指定表插入数据
func createRecord(c *fiber.Ctx) error {
	tableName := c.Params("table")

	var userID int64
	var isGuest bool
	var err error

	// users表特殊处理，总是需要登录
	if tableName == "users" {
		userID, err = authenticateUser(c)
		if err != nil {
			return sendError(c, 401, "Authentication required.", nil)
		}
		isGuest = false
	} else {
		// 其他表：认证（支持访客）
		userID, isGuest, err = authenticateUserForAPI(c)
		if err != nil {
			return sendError(c, 401, err.Error(), nil)
		}
	}

	// 权限检查
	canCreate, err := checkPermission("create", tableName, userID, isGuest)
	if err != nil {
		switch err.Error() {
		case "TABLE_EMPTY":
			return sendError(c, 400, "Table is empty", nil)
		case "AUTH_REQUIRED":
			return sendError(c, 401, "Authentication required.", nil)
		default:
			return sendError(c, 500, "An error occurred during permission check.", fiber.Map{"database_error": err.Error()})
		}
	}
	if !canCreate {
		return sendError(c, 403, "You do not have permission to create records in this table.", nil)
	}

	// 3. 解析请求体
	body := make(map[string]any)
	if err := c.BodyParser(&body); err != nil {
		return sendError(c, 400, "Invalid JSON body.", nil)
	}
	if len(body) == 0 {
		return sendError(c, 400, "Failed to create record.", fiber.Map{"body": "Request body cannot be empty."})
	}

	// 4. 处理 users 表的密码哈希
	if tableName == "users" {
		if plainPassword, ok := body["password_hash"].(string); ok && plainPassword != "" {
			hashedPassword, err := bcrypt.GenerateFromPassword([]byte(plainPassword), bcrypt.DefaultCost)
			if err != nil {
				return sendError(c, 500, "Failed to hash password.", nil)
			}
			body["password_hash"] = string(hashedPassword)
		}

		autoFillTimeFields(body)
	}

	// 5. 执行插入
	columns := make([]string, 0, len(body))
	placeholders := make([]string, 0, len(body))
	values := make([]any, 0, len(body))

	for col, val := range body {
		columns = append(columns, fmt.Sprintf(`"%s"`, col))
		placeholders = append(placeholders, "?")
		values = append(values, val)
	}

	query := fmt.Sprintf("INSERT INTO \"%s\" (%s) VALUES (%s)", tableName, strings.Join(columns, ", "), strings.Join(placeholders, ", "))

	res, err := dataDB.Exec(query, values...)
	if err != nil {
		return sendError(c, 400, "Failed to create record.", fiber.Map{"database_error": err.Error()})
	}

	id, _ := res.LastInsertId()
	return c.Status(201).JSON(fiber.Map{"id": id})
}

// deleteRecord 动态删除指定表的数据
func deleteRecord(c *fiber.Ctx) error {
	tableName := c.Params("table")
	if tableName == "" {
		return sendError(c, 400, "Table name is required.", nil)
	}

	// 1. 认证（支持访客）
	userID, isGuest, err := authenticateUserForAPI(c)
	if err != nil {
		return sendError(c, 401, err.Error(), nil)
	}

	// 2. 权限检查
	canDelete, err := checkPermission("delete", tableName, userID, isGuest)
	if err != nil {
		switch err.Error() {
		case "TABLE_EMPTY":
			return sendError(c, 400, "Table is empty", nil)
		case "AUTH_REQUIRED":
			return sendError(c, 401, "Authentication required.", nil)
		default:
			return sendError(c, 500, "An error occurred during permission check.", fiber.Map{"database_error": err.Error()})
		}
	}
	if !canDelete {
		return sendError(c, 403, "You do not have permission to delete records in this table.", nil)
	}

	// 3. 解析请求体中的 WHERE
	type Body struct {
		WHERE string `json:"WHERE"`
	}
	var body Body
	c.BodyParser(&body)

	if body.WHERE == "" {
		return sendError(c, 400, "Failed to delete record.", fiber.Map{"WHERE": "WHERE clause is required to prevent accidental full table deletion."})
	}
	// 禁止删除 users表 id=1 的记录
	if tableName == "users" && touchingRootUser(body.WHERE, nil) {
		return sendError(c, 403, "System user (id=1) cannot be deleted.", nil)
	}

	// 4. 处理 @uid 占位符
	whereClause := body.WHERE
	var args []any
	if strings.Contains(body.WHERE, "@uid") {
		uid, _ := authenticateUser(c)
		whereClause = strings.ReplaceAll(body.WHERE, "@uid", "?")
		args = append(args, uid)
	}

	// 5. 执行删除
	query := fmt.Sprintf("DELETE FROM \"%s\" WHERE %s", tableName, whereClause)
	res, err := dataDB.Exec(query, args...)
	if err != nil {
		return sendError(c, 400, "Failed to delete record.", fiber.Map{"database_error": err.Error()})
	}

	rowsAffected, _ := res.RowsAffected()
	if rowsAffected == 0 {
		return sendError(c, 404, "The requested resource wasn't found.", nil)
	}

	return c.Status(204).Send(nil)
}

// updateRecord 动态更新指定表的数据
func updateRecord(c *fiber.Ctx) error {
	tableName := c.Params("table")
	if tableName == "" {
		return sendError(c, 400, "Table name is required.", nil)
	}

	// 1. 认证（支持访客）
	userID, isGuest, err := authenticateUserForAPI(c)
	if err != nil {
		return sendError(c, 401, err.Error(), nil)
	}

	// 2. 权限检查
	canDelete, err := checkPermission("delete", tableName, userID, isGuest)
	if err != nil {
		switch err.Error() {
		case "TABLE_EMPTY":
			return sendError(c, 400, "Table is empty", nil)
		case "AUTH_REQUIRED":
			return sendError(c, 401, "Authentication required.", nil)
		default:
			return sendError(c, 500, "An error occurred during permission check.", fiber.Map{"database_error": err.Error()})
		}
	}
	if !canDelete {
		return sendError(c, 403, "You do not have permission to delete records in this table.", nil)
	}

	// 3. 解析请求体
	type Body struct {
		Set   map[string]any `json:"set"`
		WHERE string         `json:"WHERE"`
	}
	var body Body
	if err := c.BodyParser(&body); err != nil {
		return sendError(c, 400, "Invalid JSON body.", nil)
	}
	if len(body.Set) == 0 {
		return sendError(c, 400, "Failed to update record.", fiber.Map{"set": "Set field cannot be empty."})
	}
	if body.WHERE == "" {
		return sendError(c, 400, "Failed to update record.", fiber.Map{"WHERE": "WHERE clause is required."})
	}

	if tableName == "users" {
		// 禁止改 users表 id=1 的记录
		if touchingRootUser(body.WHERE, nil) {
			return sendError(c, 403, "System user (id=1) is read-only.", nil)
		}
		// 禁止改 users表 系统保留列
		for col := range body.Set {
			if isSystemColumn(col) {
				return sendError(c, 403, fmt.Sprintf("Column %s is read-only.", col), nil)
			}
		}
	}

	// 4. 执行更新
	setClauses := make([]string, 0, len(body.Set))
	values := make([]any, 0, len(body.Set))
	for col, val := range body.Set {
		setClauses = append(setClauses, fmt.Sprintf(`"%s" = ?`, col))
		values = append(values, val)
	}

	// 5. 处理 WHERE 中的 @uid
	if strings.Contains(body.WHERE, "@uid") {
		uid, _ := authenticateUser(c)
		body.WHERE = strings.ReplaceAll(body.WHERE, "@uid", "?")
		values = append(values, uid)
	}

	query := fmt.Sprintf("UPDATE \"%s\" SET %s WHERE %s", tableName, strings.Join(setClauses, ", "), body.WHERE)

	res, err := dataDB.Exec(query, values...)
	if err != nil {
		return sendError(c, 400, "Failed to update record.", fiber.Map{"database_error": err.Error()})
	}

	rowsAffected, _ := res.RowsAffected()
	if rowsAffected == 0 {
		return sendError(c, 404, "The requested resource wasn't found.", nil)
	}

	return c.SendStatus(204)
}

// viewRecords 动态查询指定表的数据
func viewRecords(c *fiber.Ctx) error {
	tableName := c.Params("table")
	if tableName == "" {
		return sendError(c, 400, "Table name is required.", nil)
	}

	// 1. 认证（支持访客）
	userID, isGuest, err := authenticateUserForAPI(c)
	if err != nil {
		return sendError(c, 401, err.Error(), nil)
	}

	// 2. 权限检查
	canDelete, err := checkPermission("delete", tableName, userID, isGuest)
	if err != nil {
		switch err.Error() {
		case "TABLE_EMPTY":
			return sendError(c, 400, "Table is empty", nil)
		case "AUTH_REQUIRED":
			return sendError(c, 401, "Authentication required.", nil)
		default:
			return sendError(c, 500, "An error occurred during permission check.", fiber.Map{"database_error": err.Error()})
		}
	}
	if !canDelete {
		return sendError(c, 403, "You do not have permission to delete records in this table.", nil)
	}

	// 3. 解析分页和查询参数
	page := c.QueryInt("page", 1)
	perPage := c.QueryInt("perpage", 30)
	if page < 1 || perPage < 1 || perPage > 100 {
		return sendError(c, 400, "Invalid pagination parameters.", nil)
	}

	type Body struct {
		SELECT []string `json:"SELECT"`
		WHERE  string   `json:"WHERE"`
	}
	var body Body
	c.BodyParser(&body)

	selectClause := "*"
	if len(body.SELECT) > 0 {
		for _, col := range body.SELECT {
			if !isValidIdentifier(col) {
				return sendError(c, 400, "Invalid filter.", fiber.Map{"SELECT": fmt.Sprintf("Invalid column name: %s", col)})
			}
		}
		selectClause = strings.Join(body.SELECT, ", ")
	}

	// 4. 构建并执行查询
	whereClause := ""
	var args []any
	if body.WHERE != "" {
		finalWhere := strings.ReplaceAll(body.WHERE, "@uid", "?")
		whereClause = "WHERE " + finalWhere
		if strings.Contains(body.WHERE, "@uid") {
			uid, _ := authenticateUser(c)
			args = append(args, uid)
		}
	}

	// 查询总记录数
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM \"%s\" %s", tableName, whereClause)
	var totalItems int64
	err = dataDB.QueryRow(countQuery, args...).Scan(&totalItems)
	if err != nil {
		return sendError(c, 500, "Failed to count items.", fiber.Map{"database_error": err.Error()})
	}

	// 计算分页
	totalPages := int((totalItems + int64(perPage) - 1) / int64(perPage))
	offset := (page - 1) * perPage

	// 查询数据
	dataQuery := fmt.Sprintf("SELECT %s FROM \"%s\" %s LIMIT ? OFFSET ?", selectClause, tableName, whereClause)
	queryArgs := append(args, perPage, offset)

	rows, err := dataDB.Query(dataQuery, queryArgs...)
	if err != nil {
		return sendError(c, 500, "Database query failed.", fiber.Map{"database_error": err.Error()})
	}
	defer rows.Close()

	columns, _ := rows.Columns()
	values := make([]any, len(columns))
	scanArgs := make([]any, len(columns))
	for i := range values {
		scanArgs[i] = &values[i]
	}

	var items []map[string]any
	for rows.Next() {
		if err := rows.Scan(scanArgs...); err != nil {
			return sendError(c, 500, "Failed to scan row.", fiber.Map{"database_error": err.Error()})
		}
		rowMap := make(map[string]any)
		for i, colName := range columns {
			val := values[i]
			if b, ok := val.([]byte); ok {
				rowMap[colName] = string(b)
			} else {
				rowMap[colName] = val
			}
		}
		items = append(items, rowMap)
	}

	return c.JSON(fiber.Map{
		"page":       page,
		"perPage":    perPage,
		"totalPages": totalPages,
		"totalItems": totalItems,
		"items":      items,
	})
}

// login 用户登录
func login(c *fiber.Ctx) error {
	type Body struct {
		Name         string `json:"name"`
		PasswordHash string `json:"password_hash"`
	}
	var body Body
	if err := c.BodyParser(&body); err != nil {
		return sendError(c, 400, "Invalid JSON body.", nil)
	}

	if body.Name == "" || body.PasswordHash == "" {
		return sendError(c, 400, "Failed to authenticate.", fiber.Map{
			"identity": fiber.Map{"code": "validation_required", "message": "Missing required value."},
		})
	}

	// 查找用户
	userRecord, err := findUserByName(body.Name)
	if err != nil {
		return sendError(c, 500, "Database error.", nil)
	}
	if userRecord == nil {
		return sendError(c, 400, "Failed to authenticate.", fiber.Map{
			"identity": fiber.Map{"code": "validation_failed", "message": "Invalid name or password."},
		})
	}

	storedHash, ok := userRecord["password_hash"].(string)
	if !ok {
		return sendError(c, 500, "Invalid password format in database.", nil)
	}

	err = bcrypt.CompareHashAndPassword([]byte(storedHash), []byte(body.PasswordHash))
	if err != nil {
		return sendError(c, 400, "Failed to authenticate.", fiber.Map{
			"identity": fiber.Map{"code": "validation_failed", "message": "Invalid name or password."},
		})
	}

	// 用户验证通过，生成 JWT
	userID := int64(userRecord["id"].(int64))
	token, expire, err := GenerateJWT(userID)
	if err != nil {
		return sendError(c, 500, "Failed to generate token.", nil)
	}

	// 准备返回的用户信息
	record := fiber.Map{
		"id":        userRecord["id"],
		"email":     userRecord["email"],
		"name":      userRecord["name"],
		"create_at": userRecord["create_at"],
		"update_at": userRecord["update_at"],
	}

	return c.JSON(fiber.Map{
		"token":  token,
		"expire": expire.Format(time.RFC3339),
		"record": record,
	})
}

func refreshToken(c *fiber.Ctx) error {
	userID, err := authenticateUser(c)
	if err != nil {
		return sendError(c, 401, "The request requires valid record authorization token to be set.", nil)
	}

	userRecord, err := findUserByID(userID)
	if err != nil {
		return sendError(c, 500, "Database error.", nil)
	}
	if userRecord == nil {
		return sendError(c, 403, "The authorized record model is not allowed to perform this action.", nil)
	}

	token, expire, err := GenerateJWT(userID)
	if err != nil {
		return sendError(c, 500, "Failed to generate token.", nil)
	}

	record := fiber.Map{
		"id":        userRecord["id"],
		"email":     userRecord["email"],
		"name":      userRecord["name"],
		"create_at": userRecord["create_at"],
		"update_at": userRecord["update_at"],
	}

	return c.JSON(fiber.Map{
		"token":  token,
		"expire": expire.Format(time.RFC3339),
		"record": record,
	})
}

// createSqlRecord 向 _sqls_ 表写入一条新记录
// func createSqlRecord(c *fiber.Ctx) error {
// 	// 认证
// 	if _, err := authenticateUser(c); err != nil {
// 		return sendError(c, 403, "You are not allowed to perform this request.", nil)
// 	}

// 	type Body struct {
// 		SQL string `json:"SQL"`
// 	}
// 	var body Body
// 	if err := c.BodyParser(&body); err != nil {
// 		return sendError(c, 400, "Invalid JSON body.", nil)
// 	}
// 	if body.SQL == "" {
// 		return sendError(c, 400, "Failed to create SQL record.", fiber.Map{"SQL": "SQL field is required."})
// 	}

// 	err := queries.CreateSql(context.Background(), body.SQL)
// 	if err != nil {
// 		return sendError(c, 500, "Failed to create SQL record.", fiber.Map{"database_error": err.Error()})
// 	}

// 	return c.Status(201).JSON(fiber.Map{"message": "SQL record created successfully.", "SQL": body.SQL})
// }

// 根据 ID 删除 _sqls_ 表中的一条记录
// func deleteSqlRecord(c *fiber.Ctx) error {
// 	if _, err := authenticateUser(c); err != nil {
// 		return sendError(c, 403, "You are not allowed to perform this request.", nil)
// 	}

// 	idStr := c.Params("id")
// 	id, err := strconv.ParseInt(idStr, 10, 64)
// 	if err != nil {
// 		return sendError(c, 400, "Invalid ID format.", nil)
// 	}

// 	err = queries.DeleteSql(context.Background(), id)
// 	if err != nil {
// 		// 检查是否是因为记录不存在导致的错误
// 		if strings.Contains(err.Error(), "no rows in result set") {
// 			return sendError(c, 404, "The requested resource wasn't found.", nil)
// 		}
// 		return sendError(c, 500, "Failed to delete SQL record.", fiber.Map{"database_error": err.Error()})
// 	}

// 	return c.Status(204).Send(nil)
// }

// 根据 ID 更新 _sqls_ 表中的一条记录
// func updateSqlRecord(c *fiber.Ctx) error {
// 	if _, err := authenticateUser(c); err != nil {
// 		return sendError(c, 403, "You are not allowed to perform this request.", nil)
// 	}

// 	idStr := c.Params("id")
// 	id, err := strconv.ParseInt(idStr, 10, 64)
// 	if err != nil {
// 		return sendError(c, 400, "Invalid ID format.", nil)
// 	}

// 	type Body struct {
// 		SQL string `json:"SQL"`
// 	}
// 	var body Body
// 	if err := c.BodyParser(&body); err != nil {
// 		return sendError(c, 400, "Invalid JSON body.", nil)
// 	}
// 	if body.SQL == "" {
// 		return sendError(c, 400, "Failed to update SQL record.", fiber.Map{"SQL": "SQL field is required."})
// 	}

// 	err = queries.UpdateSql(context.Background(), database.UpdateSqlParams{
// 		Sql: body.SQL,
// 		ID:  id,
// 	})
// 	if err != nil {
// 		// 检查是否是因为记录不存在导致的错误
// 		if strings.Contains(err.Error(), "no rows in result set") {
// 			return sendError(c, 404, "The requested resource wasn't found.", nil)
// 		}
// 		return sendError(c, 500, "Failed to update SQL record.", fiber.Map{"database_error": err.Error()})
// 	}

// 	return c.JSON(fiber.Map{"message": "SQL record updated successfully.", "id": id, "SQL": body.SQL})
// }

// 获取 _sqls_ 表中最新的一条记录
func getLatestSqlRecord(c *fiber.Ctx) error {
	userID, err := authenticateUser(c)
	if err != nil || userID != 1 {
		return sendError(c, 403, "You are not allowed to perform this request.", nil)
	}

	record, err := queries.GetLatestSql(context.Background())
	if err != nil {
		// 如果记录不存在，sqlc 会返回 sql.ErrNoRows
		if err == sql.ErrNoRows {
			return sendError(c, 404, "No SQL records found.", nil)
		}
		return sendError(c, 500, "Failed to fetch latest SQL record.", fiber.Map{"database_error": err.Error()})
	}

	return c.JSON(record)
}

type SecurityResponse struct {
	ID          int64   `json:"id"`
	TableName   string  `json:"table_name"`
	CreateWhere *string `json:"create_where"`
	DeleteWhere *string `json:"delete_where"`
	UpdateWhere *string `json:"update_where"`
	ViewWhere   *string `json:"view_where"`
}

func getAllSecurity(c *fiber.Ctx) error {
	userID, err := authenticateUser(c)
	if err != nil || userID != 1 {
		return sendError(c, 403, "You are not allowed to perform this request.", nil)
	}

	securities, err := queries.ListSecurities(context.Background())
	if err != nil {
		return c.Status(500).SendString(err.Error())
	}

	// 转换为自定义响应格式
	response := make([]SecurityResponse, len(securities))
	for i, sec := range securities {
		response[i] = SecurityResponse{
			ID:        sec.ID,
			TableName: sec.TableName,
			CreateWhere: func() *string {
				if sec.CreateWhere.Valid {
					return &sec.CreateWhere.String
				}
				return nil
			}(),
			DeleteWhere: func() *string {
				if sec.DeleteWhere.Valid {
					return &sec.DeleteWhere.String
				}
				return nil
			}(),
			UpdateWhere: func() *string {
				if sec.UpdateWhere.Valid {
					return &sec.UpdateWhere.String
				}
				return nil
			}(),
			ViewWhere: func() *string {
				if sec.ViewWhere.Valid {
					return &sec.ViewWhere.String
				}
				return nil
			}(),
		}
	}

	return c.JSON(response)
}

// 为表创建安全策略
func createSecurityPolicy(c *fiber.Ctx) error {
	userID, err := authenticateUser(c)
	if err != nil || userID != 1 {
		return sendError(c, 403, "You are not allowed to perform this request.", nil)
	}

	tableName := c.Params("table_name")
	if tableName == "" {
		return sendError(c, 400, "Table name is required.", nil)
	}

	type Body struct {
		CreateWhere string `json:"create_where"`
		DeleteWhere string `json:"delete_where"`
		UpdateWhere string `json:"update_where"`
		ViewWhere   string `json:"view_where"`
	}
	var body Body
	if err := c.BodyParser(&body); err != nil {
		return sendError(c, 400, "Invalid JSON body.", nil)
	}
	if tableName == "" {
		return sendError(c, 400, "Failed to create security policy.", fiber.Map{"table_name": "table_name is required."})
	}

	// 使用 sqlc 生成的函数
	err = queries.CreateSecurity(context.Background(), database.CreateSecurityParams{
		TableName:   tableName,
		CreateWhere: sql.NullString{String: body.CreateWhere, Valid: body.CreateWhere != ""},
		DeleteWhere: sql.NullString{String: body.DeleteWhere, Valid: body.DeleteWhere != ""},
		UpdateWhere: sql.NullString{String: body.UpdateWhere, Valid: body.UpdateWhere != ""},
		ViewWhere:   sql.NullString{String: body.ViewWhere, Valid: body.ViewWhere != ""},
	})
	if err != nil {
		// 检查唯一性约束冲突
		if strings.Contains(err.Error(), "UNIQUE constraint failed") {
			return sendError(c, 409, "A security policy for this table already exists.", nil) // 409 Conflict
		}
		return sendError(c, 500, "Failed to create security policy.", fiber.Map{"database_error": err.Error()})
	}

	return c.Status(201).JSON(fiber.Map{"message": "Security policy created successfully."})
}

// 删除表的安全策略
func deleteSecurityPolicy(c *fiber.Ctx) error {
	userID, err := authenticateUser(c)
	if err != nil || userID != 1 {
		return sendError(c, 403, "You are not allowed to perform this request.", nil)
	}

	tableName := c.Params("table_name")
	if tableName == "" {
		return sendError(c, 400, "Table name is required.", nil)
	}

	err = queries.DeleteSecurity(context.Background(), tableName)
	if err != nil {
		// sqlc 对于 DELETE 不存在的记录不会返回 sql.ErrNoRows，而是返回一个错误
		// 我们可以检查 RowsAffected
		return sendError(c, 500, "Failed to delete security policy.", fiber.Map{"database_error": err.Error()})
	}

	return c.SendStatus(204) // 204 No Content
}

// 更新表的安全策略
func updateSecurityPolicy(c *fiber.Ctx) error {
	userID, err := authenticateUser(c)
	if err != nil || userID != 1 {
		return sendError(c, 403, "You are not allowed to perform this request.", nil)
	}

	tableName := c.Params("table_name")
	if tableName == "" {
		return sendError(c, 400, "Table name is required.", nil)
	}

	type Body struct {
		CreateWhere string `json:"create_where"`
		DeleteWhere string `json:"delete_where"`
		UpdateWhere string `json:"update_where"`
		ViewWhere   string `json:"view_where"`
	}
	var body Body
	if err := c.BodyParser(&body); err != nil {
		return sendError(c, 400, "Invalid JSON body.", nil)
	}

	err = queries.UpdateSecurity(context.Background(), database.UpdateSecurityParams{
		CreateWhere: sql.NullString{String: body.CreateWhere, Valid: body.CreateWhere != ""},
		DeleteWhere: sql.NullString{String: body.DeleteWhere, Valid: body.DeleteWhere != ""},
		UpdateWhere: sql.NullString{String: body.UpdateWhere, Valid: body.UpdateWhere != ""},
		ViewWhere:   sql.NullString{String: body.ViewWhere, Valid: body.ViewWhere != ""},
		TableName:   tableName,
	})
	if err != nil {
		return sendError(c, 500, "Failed to update security policy.", fiber.Map{"database_error": err.Error()})
	}

	return c.SendStatus(204)
}

// (内部函数) 根据表名获取安全策略
func getSecurityByTable(tableName string) (*database.Security, error) {
	policy, err := queries.GetSecurityByTable(context.Background(), tableName)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil // 策略不存在，返回 nil 而不是错误
		}
		return nil, err
	}
	return &policy, nil
}

// listDataTables 返回 data.db 中所有用户表名（不含 sqlite_ 系统表）
func listDataTables(c *fiber.Ctx) error {
	// 1. 只允许 root
	userID, err := authenticateUser(c)
	if err != nil || userID != 1 {
		return sendError(c, 403, "You are not allowed to perform this request.", nil)
	}

	// 2. 查 sqlite_master
	rows, err := dataDB.Query(
		`SELECT name FROM sqlite_master 
		 WHERE type='table' 
		   AND name NOT LIKE 'sqlite_%' 
		 ORDER BY name`)
	if err != nil {
		return sendError(c, 500, "Failed to list tables.", fiber.Map{"database_error": err.Error()})
	}
	defer rows.Close()

	var tables []string
	for rows.Next() {
		var name string
		if err := rows.Scan(&name); err != nil {
			continue
		}
		tables = append(tables, name)
	}
	if err = rows.Err(); err != nil {
		return sendError(c, 500, "Failed to scan tables.", fiber.Map{"database_error": err.Error()})
	}

	// 3. 返回
	return c.JSON(fiber.Map{
		"tables": tables,
	})
}

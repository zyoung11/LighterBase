package main

import (
	"context"
	"database/sql"
	"embed"
	"errors"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
	"time"

	"LighterBase/database"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/golang-jwt/jwt/v5"
	_ "github.com/mattn/go-sqlite3"
)

//go:embed SQL/schema.sql
var schemaFS embed.FS

var queries *database.Queries

var dataDB *sql.DB

var routes = []Route{
	{Method: "GET", Path: "/health", Handler: health},
	{Method: "GET", Path: "/api/web/security", Handler: getAllSecurity},

	// --- JWT 认证 API ---
	{Method: "POST", Path: "/api/auth/login", Handler: login},
	{Method: "POST", Path: "/api/auth/refresh", Handler: refreshToken},

	// --- BaaS 建表 API ---
	{Method: "POST", Path: "/api/create-table/create/", Handler: createTable},

	// --- BaaS 通用 CRUD API ---
	{Method: "POST", Path: "/api/auto/create/:table", Handler: createRecord},
	{Method: "DELETE", Path: "/api/auto/delete/:table", Handler: deleteRecord},
	{Method: "PUT", Path: "/api/auto/update/:table", Handler: updateRecord},
	{Method: "GET", Path: "/api/auto/view/:table", Handler: viewRecords},
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
		avatar BLOB,
		create_at TEXT NOT NULL,
		update_at TEXT NOT NULL
	);`
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

func sendError(c *fiber.Ctx, status int, message string, data interface{}) error {
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
func findUserByName(name string) (map[string]interface{}, error) {
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
func findUserByID(id int64) (map[string]interface{}, error) {
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

//------------------------------------------------------------------------------

func main() {
	Run("LighterBase", 8080, routes)
}

//----------------------------------routing--------------------------------------

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

// createTable 执行用户提供的 CREATE TABLE SQL
func createTable(c *fiber.Ctx) error {
	if _, err := authenticateUser(c); err != nil {
		return sendError(c, 403, "You are not allowed to perform this request.", nil)
	}
	type Body struct {
		SQL string `json:"SQL"`
	}
	var body Body
	if err := c.BodyParser(&body); err != nil {
		return sendError(c, 400, "Invalid JSON body.", nil)
	}
	if body.SQL == "" {
		return sendError(c, 400, "Failed to create table.", fiber.Map{"SQL": "SQL field is required."})
	}

	// 安全检查：只允许 CREATE TABLE 开头的语句
	// if !strings.HasPrefix(strings.ToUpper(strings.TrimSpace(body.SQL)), "CREATE TABLE") {
	// 	return sendError(c, 403, "You are not allowed to perform this request.", fiber.Map{"SQL": "Only CREATE TABLE statements are allowed."})
	// }

	_, err := dataDB.Exec(body.SQL)
	if err != nil {
		return sendError(c, 400, "Failed to create table.", fiber.Map{"database_error": err.Error()})
	}

	return c.Status(201).JSON(fiber.Map{"SQL": body.SQL})
}

// --- BaaS 通用 CRUD API ---

// createRecord 动态向指定表插入数据
func createRecord(c *fiber.Ctx) error {
	tableName := c.Params("table")
	if tableName == "" {
		return sendError(c, 400, "Table name is required.", nil)
	}

	if tableName != "users" {
		if _, err := authenticateUser(c); err != nil {
			return sendError(c, 403, "You are not allowed to perform this request.", nil)
		}
	}

	body := make(map[string]interface{})
	if err := c.BodyParser(&body); err != nil {
		return sendError(c, 400, "Invalid JSON body.", nil)
	}

	if len(body) == 0 {
		return sendError(c, 400, "Failed to create record.", fiber.Map{"body": "Request body cannot be empty."})
	}

	// 动态构建 INSERT 语句
	columns := make([]string, 0, len(body))
	placeholders := make([]string, 0, len(body))
	values := make([]interface{}, 0, len(body))

	for col, val := range body {
		columns = append(columns, fmt.Sprintf(`"%s"`, col)) // 给列名加上引号
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

	if _, err := authenticateUser(c); err != nil {
		return sendError(c, 403, "You are not allowed to perform this request.", nil)
	}

	tableName := c.Params("table")
	if tableName == "" {
		return sendError(c, 400, "Table name is required.", nil)
	}

	type Body struct {
		WHERE string `json:"WHERE"`
	}
	var body Body
	c.BodyParser(&body) // WHERE 是可选的，所以忽略解析错误

	query := fmt.Sprintf("DELETE FROM \"%s\"", tableName)
	var args []interface{}

	if body.WHERE != "" {
		query += " WHERE " + body.WHERE
	}

	// 如果没有 WHERE 子句，为了安全，可以阻止删除全表
	if body.WHERE == "" {
		return sendError(c, 400, "Failed to delete record.", fiber.Map{"WHERE": "WHERE clause is required to prevent accidental full table deletion."})
	}

	res, err := dataDB.Exec(query, args...)
	if err != nil {
		return sendError(c, 400, "Failed to delete record.", fiber.Map{"database_error": err.Error()})
	}

	rowsAffected, _ := res.RowsAffected()
	if rowsAffected == 0 {
		return sendError(c, 404, "The requested resource wasn't found.", nil)
	}

	return c.Status(204).Send(nil) // 204 No Content
}

// updateRecord 动态更新指定表的数据
func updateRecord(c *fiber.Ctx) error {

	if _, err := authenticateUser(c); err != nil {
		return sendError(c, 403, "You are not allowed to perform this request.", nil)
	}

	tableName := c.Params("table")
	if tableName == "" {
		return sendError(c, 400, "Table name is required.", nil)
	}

	type Body struct {
		Set   map[string]interface{} `json:"set"`
		WHERE string                 `json:"WHERE"`
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

	// 动态构建 SET 子句
	setClauses := make([]string, 0, len(body.Set))
	values := make([]interface{}, 0, len(body.Set))
	for col, val := range body.Set {
		setClauses = append(setClauses, fmt.Sprintf(`"%s" = ?`, col))
		values = append(values, val)
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

// viewRecords 动态查询指定表的数据，支持分页
func viewRecords(c *fiber.Ctx) error {

	if _, err := authenticateUser(c); err != nil {
		return sendError(c, 403, "You are not allowed to perform this request.", nil)
	}

	tableName := c.Params("table")
	if tableName == "" {
		return sendError(c, 400, "Table name is required.", nil)
	}

	// --- 1. 解析分页参数 ---
	page := c.QueryInt("page", 1) // 默认为第 1 页
	if page < 1 {
		return sendError(c, 400, "Invalid 'page' parameter. It must be a positive integer.", nil)
	}

	perPage := c.QueryInt("perpage", 30) // 默认每页 30 条
	if perPage < 1 || perPage > 100 {    // 限制最大每页数量
		return sendError(c, 400, "Invalid 'perpage' parameter. It must be between 1 and 100.", nil)
	}

	// --- 2. 解析请求体中的 SELECT 和 WHERE ---
	type Body struct {
		SELECT []string `json:"SELECT"`
		WHERE  string   `json:"WHERE"`
	}
	var body Body
	c.BodyParser(&body) // 查询参数是可选的，忽略解析错误

	// 构建 SELECT 部分
	selectClause := "*"
	if len(body.SELECT) > 0 {
		// 防止 SQL 注入，检查列名是否合法
		for _, col := range body.SELECT {
			if !isValidIdentifier(col) {
				return sendError(c, 400, "Something went wrong while processing your request. Invalid filter.", fiber.Map{"SELECT": fmt.Sprintf("Invalid column name: %s", col)})
			}
		}
		selectClause = strings.Join(body.SELECT, ", ")
	}

	// 构建 WHERE 子句
	whereClause := ""
	var args []interface{}
	if body.WHERE != "" {
		whereClause = "WHERE " + body.WHERE
	}

	// --- 3. 查询总记录数 ---
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM \"%s\" %s", tableName, whereClause)
	var totalItems int64
	err := dataDB.QueryRow(countQuery, args...).Scan(&totalItems)
	if err != nil {
		if strings.Contains(err.Error(), "no such table") {
			return sendError(c, 404, "The requested resource wasn't found.", nil)
		}
		return sendError(c, 500, "Failed to count items.", fiber.Map{"database_error": err.Error()})
	}

	// --- 4. 计算分页信息 ---
	totalPages := int((totalItems + int64(perPage) - 1) / int64(perPage)) // 向上取整
	offset := (page - 1) * perPage

	// --- 5. 查询当前页的数据 ---
	dataQuery := fmt.Sprintf("SELECT %s FROM \"%s\" %s LIMIT ? OFFSET ?", selectClause, tableName, whereClause)

	//  LIMIT 和 OFFSET 的参数也加入 args 切片
	// 注意：SQLite 的参数是按顺序匹配的
	queryArgs := append(args, perPage, offset)

	rows, err := dataDB.Query(dataQuery, queryArgs...)
	if err != nil {
		return sendError(c, 500, "Database query failed.", fiber.Map{"database_error": err.Error()})
	}
	defer rows.Close()

	// --- 6. 扫描数据到 map ---
	columns, _ := rows.Columns()
	values := make([]interface{}, len(columns))
	scanArgs := make([]interface{}, len(columns))
	for i := range values {
		scanArgs[i] = &values[i]
	}

	var items []map[string]interface{}
	for rows.Next() {
		if err := rows.Scan(scanArgs...); err != nil {
			return sendError(c, 500, "Failed to scan row.", fiber.Map{"database_error": err.Error()})
		}

		rowMap := make(map[string]interface{})
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

	// 检查迭代过程中是否有错误
	if err = rows.Err(); err != nil {
		return sendError(c, 500, "Error during rows iteration.", fiber.Map{"database_error": err.Error()})
	}

	// --- 7. 返回分页结果 ---
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

	// 在真实应用中，这里应该使用 bcrypt.CompareHashAndPassword
	// 这里为了简化，我们直接比较哈希
	storedHash, ok := userRecord["password_hash"].(string)
	if !ok || storedHash != body.PasswordHash {
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
		"id":      userRecord["id"],
		"email":   userRecord["email"],
		"name":    userRecord["name"],
		"created": userRecord["create"],
		"updated": userRecord["update"],
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

	// 从数据库重新获取用户信息
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
		"id":      userRecord["id"],
		"email":   userRecord["email"],
		"name":    userRecord["name"],
		"created": userRecord["create"],
		"updated": userRecord["update"],
	}

	return c.JSON(fiber.Map{
		"token":  token,
		"expire": expire.Format(time.RFC3339),
		"record": record,
	})
}

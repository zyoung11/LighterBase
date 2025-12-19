package main

import (
	"LighterBaseHub/database"
	"context"
	"database/sql"
	"errors"
	"fmt"
	"io"
	"os"
	"reflect"
	"regexp"
	"strconv"
	"strings"
	"time"

	inspectSQL "github.com/rqlite/sql"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	_ "github.com/mattn/go-sqlite3"
	"golang.org/x/crypto/bcrypt"
)

var routes = []Route{
	{Method: "GET", Path: "/health", Handler: health, AuthRequired: false},

	// 下载
	{Method: "GET", Path: "/api/download/app/:os", Handler: downloadApp, AuthRequired: false},

	// 用户相关
	{Method: "POST", Path: "/api/users/register", Handler: register, AuthRequired: false},
	{Method: "POST", Path: "/api/users/login", Handler: login, AuthRequired: false},
	{Method: "GET", Path: "/api/users", Handler: listUsers, AuthRequired: true},
	{Method: "GET", Path: "/api/users/:id", Handler: getUser, AuthRequired: true},
	{Method: "PUT", Path: "/api/users/:id", Handler: updateUser, AuthRequired: true},
	{Method: "DELETE", Path: "/api/users/:id", Handler: deleteUser, AuthRequired: true},
	{Method: "GET", Path: "/api/users/check/init", Handler: checkInit, AuthRequired: false},

	// 项目相关
	{Method: "POST", Path: "/api/projects", Handler: createProject, AuthRequired: true},
	{Method: "GET", Path: "/api/projects", Handler: listMyProjects, AuthRequired: true},
	{Method: "GET", Path: "/api/projects/:id", Handler: getProject, AuthRequired: true},
	{Method: "PUT", Path: "/api/projects/:id", Handler: updateProject, AuthRequired: true},
	{Method: "DELETE", Path: "/api/projects/:id", Handler: deleteProject, AuthRequired: true},
	{Method: "GET", Path: "/api/projects/download/:id", Handler: downloadProject, AuthRequired: true},
	{Method: "GET", Path: "/api/projects/sql/:id", Handler: getProjectLatestSql, AuthRequired: true},

	// 通知相关
	{Method: "POST", Path: "/api/team", Handler: sendNotification, AuthRequired: true},
	{Method: "GET", Path: "/api/team/send/:status", Handler: checkMyNotifications, AuthRequired: true},
	{Method: "GET", Path: "/api/team/receive/:status", Handler: checkNotificationsSentToMe, AuthRequired: true},
	{Method: "PUT", Path: "/api/team/confirm/:notificationId/:status", Handler: confirmNotification, AuthRequired: true},

	// --- JWT 认证 API ---
	{Method: "POST", Path: "/:userId/:projectId/api/auth/login", Handler: login_app, AuthRequired: false},
	{Method: "POST", Path: "/:userId/:projectId/api/auth/refresh", Handler: refreshToken, AuthRequired: false},
	{Method: "GET", Path: "/:userId/:projectId/api/auth/init", Handler: checkInit_app, AuthRequired: false},

	// --- BaaS SQL API ---
	{Method: "POST", Path: "/:userId/:projectId/api/create-table/create/", Handler: execSQL, AuthRequired: false},

	// --- BaaS 通用 CRUD API ---
	{Method: "POST", Path: "/:userId/:projectId/api/auto/create/:table", Handler: createRecord, AuthRequired: false},
	{Method: "DELETE", Path: "/:userId/:projectId/api/auto/delete/:table", Handler: deleteRecord, AuthRequired: false},
	{Method: "PUT", Path: "/:userId/:projectId/api/auto/update/:table", Handler: updateRecord, AuthRequired: false},
	{Method: "POST", Path: "/:userId/:projectId/api/auto/view/:table", Handler: viewRecords, AuthRequired: false},

	// --- _sqls_ 表管理 API ---
	{Method: "GET", Path: "/:userId/:projectId/api/sqls/latest", Handler: getLatestSqlRecord, AuthRequired: false},
	{Method: "GET", Path: "/:userId/:projectId/api/sqls/history", Handler: getAllSqlHistory, AuthRequired: false},

	// --- _query_ 表管理 API ---
	{Method: "POST", Path: "/:userId/:projectId/api/queries", Handler: createQueries, AuthRequired: false},
	{Method: "DELETE", Path: "/:userId/:projectId/api/queries/:queryId", Handler: deleteQueries, AuthRequired: false},
	{Method: "PUT", Path: "/:userId/:projectId/api/queries/:queryId", Handler: updateQueries, AuthRequired: false},
	{Method: "GET", Path: "/:userId/:projectId/api/queries", Handler: viewQueries, AuthRequired: false},
	{Method: "POST", Path: "/:userId/:projectId/api/queries/run-queries", Handler: runQueries, AuthRequired: false},

	// --- _security_ 表管理 API (需要 JWT) ---
	{Method: "GET", Path: "/:userId/:projectId/api/security", Handler: getAllSecurity, AuthRequired: false},
	{Method: "PUT", Path: "/:userId/:projectId/api/security/:table_name", Handler: updateSecurityPolicy, AuthRequired: false},

	// --- 其他查询 API ---
	{Method: "GET", Path: "/:userId/:projectId/api/query/tables", Handler: listDataTables, AuthRequired: false},
	{Method: "GET", Path: "/:userId/:projectId/api/query/logs", Handler: listLogs, AuthRequired: false},
	{Method: "POST", Path: "/:userId/:projectId/api/search/logs", Handler: searchLogs, AuthRequired: false},
}

var dbMap = make(map[string]*DBSet)

type DBSet struct {
	Queries *database.Queries
	DataDB  *sql.DB
	LogFn   func(string)
}

//------------------------------------init--------------------------------------

func NewApp(name string, routes []Route) *fiber.App {
	app := fiber.New(fiber.Config{AppName: name})

	app.Use(cors.New())
	app.Use(logger.New())

	for _, r := range routes {
		// 先收集需要用到的中间件
		var mws []fiber.Handler

		// 1. 如果路由需要 projectMiddleware
		if !strings.Contains(r.Path, "/:userId/:projectId/init") &&
			strings.Contains(r.Path, ":userId") &&
			strings.Contains(r.Path, ":projectId") {
			mws = append(mws, projectMiddleware)

			// 为需要团队权限验证的BaaS API添加团队权限中间件
			// 这些是项目相关的API，需要检查团队权限
			baasAPIPaths := []string{
				"/:userId/:projectId/api/auth/login",
				"/:userId/:projectId/api/auth/refresh",
				"/:userId/:projectId/api/auth/init",
				"/:userId/:projectId/api/create-table/create/",
				"/:userId/:projectId/api/auto/create/:table",
				"/:userId/:projectId/api/auto/delete/:table",
				"/:userId/:projectId/api/auto/update/:table",
				"/:userId/:projectId/api/auto/view/:table",
				"/:userId/:projectId/api/sqls/latest",
				"/:userId/:projectId/api/security",
				"/:userId/:projectId/api/security/:table_name",
				"/:userId/:projectId/api/query/tables",
				"/:userId/:projectId/api/query/logs",
				"/:userId/:projectId/api/search/logs",
				"/:userId/:projectId/api/queries",
				"/:userId/:projectId/api/queries/:queryId",
				"/:userId/:projectId/api/run-queries",
			}

			for _, baasPath := range baasAPIPaths {
				if r.Path == baasPath {
					mws = append(mws, teamPermissionMiddleware)
					break
				}
			}
		}

		// 2. 如果路由需要 JWT 鉴权
		if r.AuthRequired {
			mws = append(mws, JWTMiddleware)
		}

		// 把中间件和最终处理器一起展开
		app.Add(strings.ToUpper(r.Method), r.Path,
			append(mws, r.Handler)...)
	}

	return app
}

func runSchema(db *sql.DB) error {
	return RunSchemaWithFile(db, "SQL/schema.sql")
}

func RunSchemaWithFile(db *sql.DB, schemaFile string) error {
	schemaBytes, err := schemaFS.ReadFile(schemaFile)
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
		name TEXT NOT NULL UNIQUE,
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
func findUserByName(dataDB *sql.DB, name string) (map[string]any, error) {
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
func findUserByID(dataDB *sql.DB, id int64) (map[string]any, error) {
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
	userID, err := ParseBaasJWT(tokenString)
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
	userID, err := ParseBaasJWT(tokenString)
	if err != nil {
		return 0, false, fmt.Errorf("invalid or expired token")
	}

	return userID, false, nil
}

func checkPermission(dataDB *sql.DB, queries *database.Queries, operation, tableName string, userID int64, isGuest bool) (bool, error) {
	policy, err := getSecurityByTable(queries, tableName)
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
			// 表为空时，允许创建操作，其他操作返回 false（但不是错误）
			if operation == "create" {
				return true, nil
			}
			return false, nil
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
	case "id", "email", "create_at", "update_at":
		return true
	}
	return false
}

// checkTeamPermission 检查团队权限
func checkTeamPermission(c *fiber.Ctx, requireAdmin bool) bool {
	// 获取团队权限信息
	isTeamMember, ok := c.Locals("isTeamMember").(bool)
	if !ok {
		return false
	}

	teamPermission, ok := c.Locals("teamPermission").(string)
	if !ok {
		return false
	}

	// 如果不是团队成员，没有权限
	if !isTeamMember {
		return false
	}

	// 如果是高权限成员，拥有所有权限
	if teamPermission == "admin" {
		return true
	}

	// 如果是只读成员，只有GET请求的权限
	if teamPermission == "readonly" {
		if requireAdmin {
			// 需要管理员权限但用户是只读成员
			return false
		}
		// 只读成员只能访问GET请求
		return c.Method() == "GET"
	}

	return false
}

// checkRootOrAdminPermission 检查用户是否是root或高权限成员
func checkRootOrAdminPermission(c *fiber.Ctx) bool {
	// 首先检查是否是root用户
	userID, err := authenticateUser(c)
	if err == nil && userID == 1 {
		return true
	}

	// 如果不是root，检查是否是高权限成员
	return checkTeamPermission(c, true)
}

// 是否尝试动 id=1 的记录
func touchingRootUser(where string, args []any) bool {
	return strings.Contains(where, "id=1") ||
		(strings.Contains(where, "id=@uid") && len(args) > 0 && args[0] == int64(1))
}

func InspectSQL(raw string) (forbidden error, hasSchemaMod bool) {
	clean := regexp.MustCompile(`/\*.*?\*/`).ReplaceAllString(
		regexp.MustCompile(`(?m)--.*$`).ReplaceAllString(raw, " "), " ")

	protected := map[string]bool{
		"id": true, "name": true, "password_hash": true,
		"email": true, "avatar": true, "create_at": true, "update_at": true,
	}

	parser := inspectSQL.NewParser(strings.NewReader(clean))
	for {
		stmt, err := parser.ParseStatement()
		if err == io.EOF {
			break
		}
		if err != nil {
			return nil, false
		}

		switch s := stmt.(type) {
		case *inspectSQL.AlterTableStatement:
			t := strings.ToLower(s.Name.Name)
			if t == "users" {
				if s.NewName != nil {
					return fmt.Errorf("forbidden operation: cannot rename the 'users' table"), false
				}
				if s.ColumnName != nil && protected[strings.ToLower(s.ColumnName.Name)] {
					return fmt.Errorf("forbidden operation: cannot rename protected column '%s' in 'users' table", s.ColumnName.Name), false
				}
				if s.DropColumnName != nil && protected[strings.ToLower(s.DropColumnName.Name)] {
					return fmt.Errorf("forbidden operation: cannot drop protected column '%s' from 'users' table", s.DropColumnName.Name), false
				}
			}
			hasSchemaMod = true

		case *inspectSQL.DropTableStatement:
			if strings.ToLower(s.Name.Name) == "users" {
				return fmt.Errorf("forbidden operation: cannot drop the 'users' table"), false
			}
			hasSchemaMod = true

		case *inspectSQL.DeleteStatement:
			if s.Table != nil && strings.ToLower(s.Table.TableName()) == "users" {
				return fmt.Errorf("forbidden operation: cannot DELETE from 'users' table"), false
			}

		case *inspectSQL.UpdateStatement:
			if s.Table != nil && strings.ToLower(s.Table.TableName()) == "users" {
				v := reflect.ValueOf(s).Elem()
				t := v.Type()
				for i := 0; i < t.NumField(); i++ {
					f := t.Field(i)
					if f.Type.Kind() == reflect.Slice && strings.Contains(strings.ToLower(f.Name), "update") {
						slice := v.Field(i)
						for j := 0; j < slice.Len(); j++ {
							if ref, ok := slice.Index(j).Interface().(*inspectSQL.QualifiedRef); ok &&
								protected[strings.ToLower(ref.Column.Name)] {
								return fmt.Errorf("forbidden operation: cannot UPDATE protected column '%s' in 'users' table", ref.Column.Name), false
							}
						}
						break
					}
				}
			}

		case *inspectSQL.BeginStatement, *inspectSQL.CommitStatement, *inspectSQL.RollbackStatement,
			*inspectSQL.SavepointStatement, *inspectSQL.ReleaseStatement:
			return fmt.Errorf("forbidden operation: transaction control statements are not allowed"), false

		case *inspectSQL.PragmaStatement:
			if _, ok := s.Expr.(*inspectSQL.BinaryExpr); ok {
				return fmt.Errorf("forbidden operation: setting PRAGMA values is not allowed"), false
			}

		case *inspectSQL.CreateIndexStatement, *inspectSQL.CreateTableStatement, *inspectSQL.CreateTriggerStatement,
			*inspectSQL.CreateViewStatement, *inspectSQL.CreateVirtualTableStatement,
			*inspectSQL.DropIndexStatement, *inspectSQL.DropTriggerStatement, *inspectSQL.DropViewStatement, *inspectSQL.ReindexStatement:
			hasSchemaMod = true
		}
	}
	return nil, hasSchemaMod
}

//------------------------------------------------------------------------------

func main() {
	initDB("LighterBaseHub")
	initBackend("LighterBaseHub", 8080)
}

//----------------------------------routing--------------------------------------

// teamPermissionMiddleware 检查用户是否有团队权限
func teamPermissionMiddleware(c *fiber.Ctx) error {
	// 获取路径参数
	userIdStr := c.Params("userId")
	projectIdStr := c.Params("projectId")

	// 转换为整数
	ownerID, err := strconv.ParseInt(userIdStr, 10, 64)
	if err != nil {
		return sendError(c, 400, "Invalid user ID", nil)
	}

	projectID, err := strconv.ParseInt(projectIdStr, 10, 64)
	if err != nil {
		return sendError(c, 400, "Invalid project ID", nil)
	}

	// 获取当前用户ID（从JWT）
	currentUserID, err := authenticateUser(c)
	if err != nil {
		// 如果没有认证信息，则不是团队成员
		c.Locals("isTeamMember", false)
		c.Locals("teamPermission", "none")
		return c.Next()
	}

	// 如果是项目所有者，拥有所有权限
	if currentUserID == ownerID {
		c.Locals("isTeamMember", true)
		c.Locals("teamPermission", "admin")
		return c.Next()
	}

	// 检查是否有团队权限通知
	permissionRow, err := queries.GetTeamPermission(c.Context(), database.GetTeamPermissionParams{
		SenderID:   ownerID,
		ReceiverID: currentUserID,
		ProjectID:  projectID,
	})
	if err != nil {
		if err == sql.ErrNoRows {
			// 没有团队权限
			c.Locals("isTeamMember", false)
			c.Locals("teamPermission", "none")
			return c.Next()
		}
		return sendError(c, 500, "Failed to check team permission", nil)
	}

	// 根据通知内容设置权限级别
	var permissionLevel string
	if permissionRow.NotificationContent == "邀请成为高权限成员" {
		permissionLevel = "admin"
	} else if permissionRow.NotificationContent == "邀请成为只读成员" {
		permissionLevel = "readonly"
	} else {
		permissionLevel = "none"
	}

	c.Locals("isTeamMember", true)
	c.Locals("teamPermission", permissionLevel)
	return c.Next()
}

func projectMiddleware(c *fiber.Ctx) error {
	userId := c.Params("userId")
	projectId := c.Params("projectId")

	basePath := fmt.Sprintf("./LighterBaseHubData/Apps/%s/%s", userId, projectId)
	userPath := fmt.Sprintf("./LighterBaseHubData/Apps/%s", userId)

	// 检查用户目录
	if _, err := os.Stat(userPath); os.IsNotExist(err) {
		return sendError(c, 400, "没有该用户", nil)
	}

	// 检查项目目录
	if _, err := os.Stat(basePath); os.IsNotExist(err) {
		return sendError(c, 400, "没有该项目", nil)
	}

	// 检查是否已加载数据库
	key := fmt.Sprintf("%s/%s", userId, projectId)

	// 首先检查连接管理器
	if connManager != nil {
		if connManager.IsConnectionClosed(key) {
			// 尝试获取连接以获取关闭原因
			dbSet, reason, err := connManager.GetConnection(key)
			if err != nil && reason != "" {
				return sendError(c, 403, fmt.Sprintf("项目连接已关闭: %s", reason), nil)
			} else if err != nil {
				return sendError(c, 403, "项目连接已关闭", nil)
			}
			// 如果连接存在且未关闭，使用它
			c.Locals("dbSet", dbSet)
		} else {
			// 连接未关闭，从连接管理器获取
			dbSet, _, err := connManager.GetConnection(key)
			if err != nil {
				return sendError(c, 400, "项目未初始化", nil)
			}
			c.Locals("dbSet", dbSet)
		}
	} else {
		// 回退到原来的逻辑
		if _, ok := dbMap[key]; !ok {
			return sendError(c, 400, "项目未初始化", nil)
		}
		c.Locals("dbSet", dbMap[key])
	}

	// 执行请求
	err := c.Next()

	// 请求完成后记录日志
	dbSet := dbMap[key]
	if dbSet.LogFn != nil {
		logText := fmt.Sprintf("%s %s %d %s",
			c.Method(),
			c.Path(),
			c.Response().StatusCode(),
			time.Now().Format("15:04:05"),
		)
		dbSet.LogFn(logText)
	}

	return err
}

// execSQL 执行用户提供的 SQL（root 专属，事务级保护，users 表只读）
func execSQL(c *fiber.Ctx) error {
	dbSet := c.Locals("dbSet").(*DBSet)
	queries := dbSet.Queries
	dataDB := dbSet.DataDB

	// 1. 检查是否是root或高权限成员
	if !checkRootOrAdminPermission(c) {
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

	// 4. 使用 InspectSQL 进行安全审查
	forbiddenErr, hasSchemaMod := InspectSQL(body.SQL)
	if forbiddenErr != nil {
		return sendError(c, 403, forbiddenErr.Error(), nil)
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

	// 8. 如果修改了 schema，自动为新建的表创建安全策略
	if hasSchemaMod {
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
	}

	return c.Status(201).JSON(fiber.Map{"SQL": body.SQL})
}

// --- BaaS 通用 CRUD API ---

// createRecord 动态向指定表插入数据
func createRecord(c *fiber.Ctx) error {
	dbSet := c.Locals("dbSet").(*DBSet)
	queries := dbSet.Queries
	dataDB := dbSet.DataDB

	tableName := c.Params("table")

	var userID int64
	var isGuest bool
	var err error

	if tableName != "users" {
		userID, isGuest, err = authenticateUserForAPI(c)
		if err != nil {
			return sendError(c, 401, err.Error(), nil)
		}
	}

	// 检查团队权限
	// 特殊情况：如果是users表，只读成员也可以创建（用于注册）
	if tableName == "users" {
		hasTeamPermission := checkTeamPermission(c, false)
		if !hasTeamPermission && isGuest {
			// 如果不是团队成员且是访客，需要认证
			return sendError(c, 401, "Authentication required.", nil)
		}
	} else {
		// 对于其他表，POST请求需要管理员权限
		if !checkTeamPermission(c, true) {
			// 如果不是团队成员或权限不足，使用原有权限检查
			if isGuest {
				return sendError(c, 401, "Authentication required.", nil)
			}
		}
	}

	// 权限检查
	canCreate, err := checkPermission(dataDB, queries, "create", tableName, userID, isGuest)
	if err != nil {
		switch err.Error() {
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
		// 验证用户名长度
		if userName, ok := body["user_name"].(string); ok {
			if len(userName) < 2 {
				return sendError(c, 400, "Username must be at least 2 characters", nil)
			}
			if len(userName) > 50 {
				return sendError(c, 400, "Username must be at most 50 characters", nil)
			}
		}

		// 验证邮箱长度
		if email, ok := body["email"].(string); ok {
			if len(email) < 6 {
				return sendError(c, 400, "Email must be at least 6 characters", nil)
			}
			if len(email) > 255 {
				return sendError(c, 400, "Email must be at most 255 characters", nil)
			}
		}

		// 验证密码长度
		if plainPassword, ok := body["password_hash"].(string); ok && plainPassword != "" {
			if len(plainPassword) < 2 {
				return sendError(c, 400, "Password must be at least 2 characters", nil)
			}
			if len(plainPassword) > 128 {
				return sendError(c, 400, "Password must be at most 128 characters", nil)
			}

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
		errMsg := err.Error()
		if strings.Contains(errMsg, "UNIQUE constraint failed") {
			if strings.Contains(errMsg, "user_name") {
				return sendError(c, 409, "Username already exists", nil)
			} else if strings.Contains(errMsg, "email") {
				return sendError(c, 409, "Email already exists", nil)
			}
		}
		return sendError(c, 400, "Failed to create record.", fiber.Map{"database_error": err.Error()})
	}

	id, _ := res.LastInsertId()
	return c.Status(201).JSON(fiber.Map{"id": id})
}

// deleteRecord 动态删除指定表的数据
func deleteRecord(c *fiber.Ctx) error {
	dbSet := c.Locals("dbSet").(*DBSet)
	queries := dbSet.Queries
	dataDB := dbSet.DataDB

	tableName := c.Params("table")
	if tableName == "" {
		return sendError(c, 400, "Table name is required.", nil)
	}

	// 1. 认证（支持访客）
	userID, isGuest, err := authenticateUserForAPI(c)
	if err != nil {
		return sendError(c, 401, err.Error(), nil)
	}

	// 检查团队权限（DELETE请求需要管理员权限）
	if !checkTeamPermission(c, true) {
		// 如果不是团队成员或权限不足，使用原有权限检查
		if isGuest {
			return sendError(c, 401, "Authentication required.", nil)
		}
	}

	// 2. 权限检查
	canDelete, err := checkPermission(dataDB, queries, "delete", tableName, userID, isGuest)
	if err != nil {
		switch err.Error() {
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
	dbSet := c.Locals("dbSet").(*DBSet)
	queries := dbSet.Queries
	dataDB := dbSet.DataDB

	tableName := c.Params("table")
	if tableName == "" {
		return sendError(c, 400, "Table name is required.", nil)
	}

	// 1. 认证（支持访客）
	userID, isGuest, err := authenticateUserForAPI(c)
	if err != nil {
		return sendError(c, 401, err.Error(), nil)
	}

	// 检查团队权限（PUT请求需要管理员权限）
	if !checkTeamPermission(c, true) {
		// 如果不是团队成员或权限不足，使用原有权限检查
		if isGuest {
			return sendError(c, 401, "Authentication required.", nil)
		}
	}

	// 2. 权限检查
	canDelete, err := checkPermission(dataDB, queries, "update", tableName, userID, isGuest)
	if err != nil {
		switch err.Error() {
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
		// 禁止改 users表 系统保留列
		for col := range body.Set {
			if isSystemColumn(col) {
				return sendError(c, 403, fmt.Sprintf("Column %s is read-only.", col), nil)
			}
		}

		// 验证用户名长度（如果更新用户名）
		if userName, ok := body.Set["user_name"].(string); ok {
			if len(userName) < 3 {
				return sendError(c, 400, "Username must be at least 3 characters", nil)
			}
			if len(userName) > 50 {
				return sendError(c, 400, "Username must be at most 50 characters", nil)
			}
		}

		// 验证邮箱长度（如果更新邮箱）
		if email, ok := body.Set["email"].(string); ok {
			if len(email) < 5 {
				return sendError(c, 400, "Email must be at least 5 characters", nil)
			}
			if len(email) > 255 {
				return sendError(c, 400, "Email must be at most 255 characters", nil)
			}
		}

		// 修改自己的密码时加哈希
		if !isGuest {
			whereTrimmed := strings.TrimSpace(body.WHERE)
			re := regexp.MustCompile(`id\s*=\s*['"]?1['"]?`)
			matchesId1 := re.MatchString(whereTrimmed)
			if strings.Contains(strings.ReplaceAll(whereTrimmed, " ", ""), "id=@uid") {
				matchesId1 = true
			}

			if matchesId1 {
				if plainPassword, ok := body.Set["password_hash"].(string); ok && plainPassword != "" {
					// 验证密码长度
					if len(plainPassword) < 2 {
						return sendError(c, 400, "Password must be at least 2 characters", nil)
					}
					if len(plainPassword) > 128 {
						return sendError(c, 400, "Password must be at most 128 characters", nil)
					}

					hashedPassword, err := bcrypt.GenerateFromPassword([]byte(plainPassword), bcrypt.DefaultCost)
					if err != nil {
						return sendError(c, 500, "Failed to hash password.", nil)
					}
					body.Set["password_hash"] = string(hashedPassword)
				}
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
	dbSet := c.Locals("dbSet").(*DBSet)
	queries := dbSet.Queries
	dataDB := dbSet.DataDB

	tableName := c.Params("table")
	if tableName == "" {
		return sendError(c, 400, "Table name is required.", nil)
	}

	// 1. 认证（支持访客）
	userID, isGuest, err := authenticateUserForAPI(c)
	if err != nil {
		return sendError(c, 401, err.Error(), nil)
	}

	// 检查团队权限（GET请求，只读成员也可以访问）
	if !checkTeamPermission(c, false) {
		// 如果不是团队成员或权限不足，使用原有权限检查
		if isGuest {
			return sendError(c, 401, "Authentication required.", nil)
		}
	}

	// 2. 权限检查
	canDelete, err := checkPermission(dataDB, queries, "view", tableName, userID, isGuest)
	if err != nil {
		switch err.Error() {
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
func login_app(c *fiber.Ctx) error {
	dbSet := c.Locals("dbSet").(*DBSet)
	// queries := dbSet.Queries
	dataDB := dbSet.DataDB

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
	userRecord, err := findUserByName(dataDB, body.Name)
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

	// 用户验证通过，生成 BaaS JWT
	userID := int64(userRecord["id"].(int64))
	token, expire, err := GenerateBaasJWT(userID)
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
	dbSet := c.Locals("dbSet").(*DBSet)
	// queries := dbSet.Queries
	dataDB := dbSet.DataDB

	userID, err := authenticateUser(c)
	if err != nil {
		return sendError(c, 401, "The request requires valid record authorization token to be set.", nil)
	}

	userRecord, err := findUserByID(dataDB, userID)
	if err != nil {
		return sendError(c, 500, "Database error.", nil)
	}
	if userRecord == nil {
		return sendError(c, 403, "The authorized record model is not allowed to perform this action.", nil)
	}

	token, expire, err := GenerateBaasJWT(userID)
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

// 获取 _sqls_ 表中最新的一条记录
func getLatestSqlRecord(c *fiber.Ctx) error {
	dbSet := c.Locals("dbSet").(*DBSet)
	queries := dbSet.Queries
	// dataDB := dbSet.DataDB

	// 检查是否是root或高权限成员
	if !checkRootOrAdminPermission(c) {
		return sendError(c, 403, "You are not allowed to perform this request.", nil)
	}

	record, err := queries.GetLatestSql(context.Background())
	if err != nil {
		if err == sql.ErrNoRows {
			return c.JSON(nil)
		}
		return sendError(c, 500, "Failed to fetch latest SQL record.", fiber.Map{"database_error": err.Error()})
	}

	return c.JSON(record)
}

// 获取所有 SQL 历史记录
func getAllSqlHistory(c *fiber.Ctx) error {
	dbSet := c.Locals("dbSet").(*DBSet)
	queries := dbSet.Queries

	if !checkRootOrAdminPermission(c) {
		return sendError(c, 403, "You are not allowed to perform this request.", nil)
	}

	records, err := queries.ListSqls(context.Background())
	if err != nil {
		return sendError(c, 500, "Failed to fetch SQL history.", fiber.Map{"database_error": err.Error()})
	}

	return c.JSON(records)
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
	dbSet := c.Locals("dbSet").(*DBSet)
	queries := dbSet.Queries
	// dataDB := dbSet.DataDB

	// 检查是否是root或高权限成员
	if !checkRootOrAdminPermission(c) {
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

// 更新表的安全策略
func updateSecurityPolicy(c *fiber.Ctx) error {
	dbSet := c.Locals("dbSet").(*DBSet)
	queries := dbSet.Queries
	// dataDB := dbSet.DataDB

	// 检查是否是root或高权限成员
	if !checkRootOrAdminPermission(c) {
		return sendError(c, 403, "You are not allowed to perform this request.", nil)
	}

	var err error

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
func getSecurityByTable(queries *database.Queries, tableName string) (*database.Security, error) {
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
	dbSet := c.Locals("dbSet").(*DBSet)
	// queries := dbSet.Queries
	dataDB := dbSet.DataDB

	// 1. 检查是否是root或高权限成员
	if !checkRootOrAdminPermission(c) {
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

// 添加日志列表处理函数
func listLogs(c *fiber.Ctx) error {
	dbSet := c.Locals("dbSet").(*DBSet)
	queries := dbSet.Queries
	// dataDB := dbSet.DataDB

	// 检查是否是root或高权限成员
	if !checkRootOrAdminPermission(c) {
		return sendError(c, 403, "You are not allowed to perform this request.", nil)
	}

	// 解析分页参数
	page := c.QueryInt("page", 1)
	perPage := c.QueryInt("perpage", 30)

	if page < 1 || perPage < 1 || perPage > 100 {
		return sendError(c, 400, "Invalid pagination parameters.", nil)
	}

	// 获取总数
	total, err := queries.CountLogs(context.Background())
	if err != nil {
		return sendError(c, 500, "Failed to count logs.", fiber.Map{"database_error": err.Error()})
	}

	// 计算分页
	totalPages := int((total + int64(perPage) - 1) / int64(perPage))
	offset := (page - 1) * perPage

	// 获取日志列表
	logs, err := queries.ListLogs(context.Background(), database.ListLogsParams{
		Limit:  int64(perPage),
		Offset: int64(offset),
	})
	if err != nil {
		return sendError(c, 500, "Failed to fetch logs.", fiber.Map{"database_error": err.Error()})
	}

	// 转换为期望的格式
	formattedLogs := make([]map[string]any, len(logs))
	for i, log := range logs {
		formattedLogs[i] = map[string]any{
			"id":         log.ID,
			"log_text":   log.LogText,
			"created_at": log.CreatedAt.String,
		}
	}

	return c.JSON(fiber.Map{
		"page":       page,
		"perPage":    perPage,
		"totalPages": totalPages,
		"totalItems": total,
		"logs":       formattedLogs,
	})
}

// searchLogs 模糊搜索日志并分页返回
func searchLogs(c *fiber.Ctx) error {
	dbSet := c.Locals("dbSet").(*DBSet)
	queries := dbSet.Queries
	// dataDB := dbSet.DataDB

	// 检查是否是root或高权限成员
	if !checkRootOrAdminPermission(c) {
		return sendError(c, 403, "You are not allowed to perform this request.", nil)
	}

	// 解析请求体（只包含搜索关键词）
	type Body struct {
		Query string `json:"query"`
	}
	var body Body
	if err := c.BodyParser(&body); err != nil {
		return sendError(c, 400, "Invalid JSON body.", nil)
	}
	if body.Query == "" {
		return sendError(c, 400, "Query parameter is required.", nil)
	}

	// 通过查询参数获取分页信息
	page := c.QueryInt("page", 1)
	perPage := c.QueryInt("perpage", 30)

	// 验证分页参数
	if page < 1 || perPage < 1 || perPage > 100 {
		return sendError(c, 400, "Invalid pagination parameters.", nil)
	}

	// 构建搜索模式（添加%通配符）
	searchPattern := "%" + body.Query + "%"

	// 获取总数
	total, err := queries.CountSearchLogs(context.Background(), searchPattern)
	if err != nil {
		return sendError(c, 500, "Failed to count search results.", fiber.Map{"database_error": err.Error()})
	}

	// 计算分页
	totalPages := int((total + int64(perPage) - 1) / int64(perPage))
	offset := (page - 1) * perPage

	// 获取搜索结果
	logs, err := queries.SearchLogs(context.Background(), database.SearchLogsParams{
		LogText: searchPattern,
		Limit:   int64(perPage),
		Offset:  int64(offset),
	})
	if err != nil {
		return sendError(c, 500, "Failed to search logs.", fiber.Map{"database_error": err.Error()})
	}

	// 转换为期望的格式
	formattedLogs := make([]map[string]any, len(logs))
	for i, log := range logs {
		formattedLogs[i] = map[string]any{
			"id":         log.ID,
			"log_text":   log.LogText,
			"created_at": log.CreatedAt.String,
		}
	}

	return c.JSON(fiber.Map{
		"page":       page,
		"perPage":    perPage,
		"totalPages": totalPages,
		"totalItems": total,
		"query":      body.Query,
		"logs":       formattedLogs,
	})
}

// checkInit 检查 users 表中是否有数据，用于前端判断是否需要初始化
func checkInit_app(c *fiber.Ctx) error {
	dbSet := c.Locals("dbSet").(*DBSet)
	// queries := dbSet.Queries
	dataDB := dbSet.DataDB

	var count int
	err := dataDB.QueryRow("SELECT COUNT(*) FROM users").Scan(&count)
	if err != nil {
		if strings.Contains(err.Error(), "no such table") {
			return c.JSON(fiber.Map{"init": false})
		}
		return sendError(c, 500, "Failed to check init status.", fiber.Map{"database_error": err.Error()})
	}

	return c.JSON(fiber.Map{
		"init": count > 0,
	})
}

// --- _query_ 表管理 API ---

// createQueries 创建查询记录
func createQueries(c *fiber.Ctx) error {
	dbSet := c.Locals("dbSet").(*DBSet)
	queries := dbSet.Queries

	// 检查是否是root或高权限成员
	if !checkRootOrAdminPermission(c) {
		return sendError(c, 403, "You are not allowed to perform this request.", nil)
	}

	// 解析请求体
	type Body struct {
		Queries string `json:"queries"`
	}
	var body Body
	if err := c.BodyParser(&body); err != nil {
		return sendError(c, 400, "Invalid JSON body.", nil)
	}
	if body.Queries == "" {
		return sendError(c, 400, "Failed to create query.", fiber.Map{"queries": "queries field is required."})
	}

	// 使用 InspectSQL 进行安全审查
	forbiddenErr, hasSchemaMod := InspectSQL(body.Queries)
	if forbiddenErr != nil {
		return sendError(c, 403, forbiddenErr.Error(), nil)
	}
	if hasSchemaMod {
		return sendError(c, 403, "Schema modification queries are not allowed in query storage.", nil)
	}

	// 创建查询记录
	queryRecord, err := queries.CreateQuery(context.Background(), body.Queries)
	if err != nil {
		return sendError(c, 500, "Failed to create query.", fiber.Map{"database_error": err.Error()})
	}

	return c.JSON(fiber.Map{
		"id":        queryRecord.ID,
		"query":     queryRecord.Queries,
		"create_at": queryRecord.CreateAt.String,
	})
}

// deleteQueries 删除查询记录
func deleteQueries(c *fiber.Ctx) error {
	dbSet := c.Locals("dbSet").(*DBSet)
	queries := dbSet.Queries

	// 检查是否是root或高权限成员
	if !checkRootOrAdminPermission(c) {
		return sendError(c, 403, "You are not allowed to perform this request.", nil)
	}

	// 获取查询ID
	queryIdStr := c.Params("queryId")
	queryId, err := strconv.ParseInt(queryIdStr, 10, 64)
	if err != nil {
		return sendError(c, 400, "Invalid query ID", nil)
	}

	// 删除查询记录
	err = queries.DeleteQuery(context.Background(), queryId)
	if err != nil {
		return sendError(c, 500, "Failed to delete query.", fiber.Map{"database_error": err.Error()})
	}

	return c.SendStatus(204)
}

// updateQueries 更新查询记录
func updateQueries(c *fiber.Ctx) error {
	dbSet := c.Locals("dbSet").(*DBSet)
	queries := dbSet.Queries

	// 检查是否是root或高权限成员
	if !checkRootOrAdminPermission(c) {
		return sendError(c, 403, "You are not allowed to perform this request.", nil)
	}

	// 获取查询ID
	queryIdStr := c.Params("queryId")
	queryId, err := strconv.ParseInt(queryIdStr, 10, 64)
	if err != nil {
		return sendError(c, 400, "Invalid query ID", nil)
	}

	// 解析请求体
	type Body struct {
		Queries string `json:"queries"`
	}
	var body Body
	if err := c.BodyParser(&body); err != nil {
		return sendError(c, 400, "Invalid JSON body.", nil)
	}
	if body.Queries == "" {
		return sendError(c, 400, "Failed to update query.", fiber.Map{"queries": "queries field is required."})
	}

	// 使用 InspectSQL 进行安全审查
	forbiddenErr, hasSchemaMod := InspectSQL(body.Queries)
	if forbiddenErr != nil {
		return sendError(c, 403, forbiddenErr.Error(), nil)
	}
	if hasSchemaMod {
		return sendError(c, 403, "Schema modification queries are not allowed in query storage.", nil)
	}

	// 更新查询记录
	err = queries.UpdateQuery(context.Background(), database.UpdateQueryParams{
		Queries: body.Queries,
		ID:      queryId,
	})
	if err != nil {
		return sendError(c, 500, "Failed to update query.", fiber.Map{"database_error": err.Error()})
	}

	return c.SendStatus(204)
}

// viewQueries 查看查询记录（分页）
func viewQueries(c *fiber.Ctx) error {
	dbSet := c.Locals("dbSet").(*DBSet)
	queries := dbSet.Queries

	// 检查是否是root或高权限成员
	if !checkRootOrAdminPermission(c) {
		return sendError(c, 403, "You are not allowed to perform this request.", nil)
	}

	// 解析分页参数
	page := c.QueryInt("page", 1)
	perPage := c.QueryInt("perpage", 30)

	if page < 1 || perPage < 1 || perPage > 100 {
		return sendError(c, 400, "Invalid pagination parameters.", nil)
	}

	// 获取总数
	total, err := queries.CountQueries(context.Background())
	if err != nil {
		return sendError(c, 500, "Failed to count queries.", fiber.Map{"database_error": err.Error()})
	}

	// 计算分页
	totalPages := int((total + int64(perPage) - 1) / int64(perPage))
	offset := (page - 1) * perPage

	// 获取查询列表
	queryRecords, err := queries.ListQueries(context.Background(), database.ListQueriesParams{
		Limit:  int64(perPage),
		Offset: int64(offset),
	})
	if err != nil {
		return sendError(c, 500, "Failed to fetch queries.", fiber.Map{"database_error": err.Error()})
	}

	// 转换为期望的格式
	formattedQueries := make([]map[string]any, len(queryRecords))
	for i, query := range queryRecords {
		formattedQueries[i] = map[string]any{
			"id":        query.ID,
			"queries":   query.Queries,
			"create_at": query.CreateAt.String,
			"update_at": query.UpdateAt.String,
		}
	}

	return c.JSON(fiber.Map{
		"page":       page,
		"perPage":    perPage,
		"totalPages": totalPages,
		"totalItems": total,
		"queries":    formattedQueries,
	})
}

// runQueries 执行查询并返回结果
func runQueries(c *fiber.Ctx) error {
	dbSet := c.Locals("dbSet").(*DBSet)
	dataDB := dbSet.DataDB

	// 检查是否是root或高权限成员
	if !checkRootOrAdminPermission(c) {
		return sendError(c, 403, "You are not allowed to perform this request.", nil)
	}

	// 解析请求体
	type Body struct {
		SQL string `json:"queries"`
	}
	var body Body
	if err := c.BodyParser(&body); err != nil {
		return sendError(c, 400, "Invalid JSON body.", nil)
	}
	if body.SQL == "" {
		return sendError(c, 400, "Failed to run query.", fiber.Map{"SQL": "SQL field is required."})
	}

	// 使用 InspectSQL 进行安全审查
	forbiddenErr, hasSchemaMod := InspectSQL(body.SQL)
	if forbiddenErr != nil {
		return sendError(c, 403, forbiddenErr.Error(), nil)
	}
	if hasSchemaMod {
		return sendError(c, 403, "Schema modification queries are not allowed in query execution.", nil)
	}

	// 执行查询
	rows, err := dataDB.Query(body.SQL)
	if err != nil {
		return sendError(c, 400, "Failed to execute query.", fiber.Map{"database_error": err.Error()})
	}
	defer rows.Close()

	// 获取列信息
	columns, err := rows.Columns()
	if err != nil {
		return sendError(c, 500, "Failed to get column information.", fiber.Map{"database_error": err.Error()})
	}

	// 准备扫描变量
	values := make([]any, len(columns))
	scanArgs := make([]any, len(columns))
	for i := range values {
		scanArgs[i] = &values[i]
	}

	// 扫描结果
	var results []map[string]any
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
		results = append(results, rowMap)
	}

	if err = rows.Err(); err != nil {
		return sendError(c, 500, "Error during rows iteration.", fiber.Map{"database_error": err.Error()})
	}

	// 返回结果
	return c.JSON(fiber.Map{
		"success": true,
		"data":    results,
		"columns": columns,
		"count":   len(results),
	})
}

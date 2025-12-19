package main

import (
	"LighterBaseHub/database"
	"archive/zip"
	"context"
	"database/sql"
	"fmt"
	"io"
	"log"
	"math"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/gofiber/fiber/v2"
)

// 用户数据库路径
const baseDir string = "./LighterBaseHubData/Apps"

//-------------------------------------helper-func-------------------------------------

// updateProjectSize 计算项目文件夹大小（单位MB），并更新到数据库
func updateProjectSize(ctx context.Context, project database.Project) error {
	// 1. 构建项目文件夹的绝对路径
	projectDir := filepath.Join(baseDir, strconv.FormatInt(project.UserID, 10), strconv.FormatInt(project.ProjectID, 10))

	// 2. 遍历文件夹，计算总大小
	var totalSizeBytes int64
	err := filepath.Walk(projectDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			// 如果访问某个文件出错，记录警告但继续遍历
			log.Printf("WARN: Error accessing file %s: %v", path, err)
			return nil
		}
		if !info.IsDir() {
			totalSizeBytes += info.Size()
		}
		return nil
	})
	if err != nil {
		return fmt.Errorf("failed to walk project directory %s: %w", projectDir, err)
	}

	// 3. 将字节转换为MB (B -> KB -> MB)
	// 使用 math.Round 进行四舍五入
	sizeMB := math.Round(float64(totalSizeBytes)/1024.0/1024.0*100) / 100

	// 4. 更新数据库
	err = queries.UpdateProjectSize(ctx, database.UpdateProjectSizeParams{
		ProjectSize: sql.NullInt64{Int64: int64(sizeMB), Valid: true},
		ProjectID:   project.ProjectID,
	})
	if err != nil {
		return fmt.Errorf("failed to update project size in database: %w", err)
	}

	log.Printf("Updated size for project %d (user %d) to %.2f MB", project.ProjectID, project.UserID, sizeMB)
	return nil
}

//---------------------------------------routing---------------------------------------

// 创建项目请求结构
type CreateProjectRequest struct {
	ProjectName        string `json:"project_name"`
	ProjectAvatar      string `json:"project_avatar"`
	ProjectDescription string `json:"project_description"`
	ProjectSize        int64  `json:"project_size"`
}

type ProjectResponse struct {
	ProjectID          int64  `json:"project_id"`
	UserID             int64  `json:"user_id"`
	ProjectName        string `json:"project_name"`
	ProjectAvatar      string `json:"project_avatar"`
	ProjectDescription string `json:"project_description"`
	ProjectSize        int64  `json:"project_size"`
	CreateAt           string `json:"create_at"`
	UpdateAt           string `json:"update_at"`
}

// 创建项目
func createProject(c *fiber.Ctx) error {
	userID, ok := c.Locals("userID").(int64)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}

	var req CreateProjectRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	// 创建项目记录
	project, err := queries.CreateProject(c.Context(), database.CreateProjectParams{
		UserID:             userID,
		ProjectName:        req.ProjectName,
		ProjectAvatar:      sql.NullString{String: req.ProjectAvatar, Valid: req.ProjectAvatar != ""},
		ProjectDescription: sql.NullString{String: req.ProjectDescription, Valid: req.ProjectDescription != ""},
		ProjectSize:        sql.NullInt64{Int64: 0, Valid: true},
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create project"})
	}

	// 创建项目目录
	projectDir := filepath.Join(baseDir, strconv.FormatInt(userID, 10), strconv.FormatInt(project.ProjectID, 10))
	if err := os.MkdirAll(projectDir, 0755); err != nil {
		log.Printf("ERROR: Failed to create project directory %s: %v", projectDir, err)
		// 即使目录创建失败，也不回滚数据库记录，因为项目已经创建
	}

	// // 向LighterBase发送初始化请求
	// initURL := fmt.Sprintf("http://localhost:8081/%d/%d/init", userID, project.ProjectID)
	// httpReq, err := http.NewRequest("POST", initURL, nil)
	// if err != nil {
	// 	log.Printf("ERROR: Failed to create init request for project %d: %v", project.ProjectID, err)
	// } else {
	// 	client := &http.Client{Timeout: 10 * time.Second}
	// 	resp, err := client.Do(httpReq)
	// 	if err != nil {
	// 		log.Printf("ERROR: Failed to send init request for project %d: %v", project.ProjectID, err)
	// 	} else {
	// 		defer resp.Body.Close()
	// 		if resp.StatusCode != http.StatusOK {
	// 			log.Printf("WARN: Init request for project %d returned status %d", project.ProjectID, resp.StatusCode)
	// 		} else {
	// 			log.Printf("Successfully initialized project %d", project.ProjectID)
	// 		}
	// 	}
	// }

	basePath := fmt.Sprintf("./LighterBaseHubData/Apps/%v/%v", userID, project.ProjectID)

	// 创建目录
	if err := os.MkdirAll(basePath, 0o755); err != nil {
		return sendError(c, 500, "无法创建项目目录", nil)
	}

	metaDBPath := filepath.Join(basePath, "metaDate.db")
	dataDBPath := filepath.Join(basePath, "data.db")

	// 打开/初始化元数据库
	metaDB, err := sql.Open("sqlite3", metaDBPath)
	if err != nil {
		return sendError(c, 500, "无法打开元数据库", nil)
	}
	if err := RunSchemaWithFile(metaDB, "SQL/schema_baas.sql"); err != nil {
		return sendError(c, 500, "无法初始化元数据库", nil)
	}
	queries := database.New(metaDB)

	// 打开/初始化数据数据库
	dataDB, err := sql.Open("sqlite3", dataDBPath)
	if err != nil {
		return sendError(c, 500, "无法打开数据数据库", nil)
	}
	if err := createUsersTable(dataDB); err != nil {
		return sendError(c, 500, "无法创建用户表", nil)
	}
	if err := queries.CreateSecurity(context.Background(), database.CreateSecurityParams{
		TableName:   "users",
		CreateWhere: sql.NullString{Valid: false},
		DeleteWhere: sql.NullString{Valid: false},
		UpdateWhere: sql.NullString{Valid: false},
		ViewWhere:   sql.NullString{Valid: false},
	}); err != nil {
		return sendError(c, 500, "无法创建默认权限", nil)
	}

	// 生成写日志闭包（捕获 queries）
	logFn := func(logText string) {
		// 忽略错误，纯异步日志
		_ = queries.CreateLog(context.Background(), logText)
	}

	// 保存连接
	key := fmt.Sprintf("%v/%v", userID, project.ProjectID)
	dbMap[key] = &DBSet{
		Queries: queries,
		DataDB:  dataDB,
		LogFn:   logFn, // 关键
	}

	response := ProjectResponse{
		ProjectID:          project.ProjectID,
		UserID:             project.UserID,
		ProjectName:        project.ProjectName,
		ProjectAvatar:      project.ProjectAvatar.String,
		ProjectDescription: project.ProjectDescription.String,
		ProjectSize:        project.ProjectSize.Int64,
		CreateAt:           project.CreateAt.String,
		UpdateAt:           project.UpdateAt.String,
	}

	return c.Status(fiber.StatusCreated).JSON(response)
}

// 获取当前用户的所有项目
func listMyProjects(c *fiber.Ctx) error {
	userID, ok := c.Locals("userID").(int64)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}

	// 获取用户自己的项目
	ownProjects, err := queries.ListProjectsByUserID(c.Context(), userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch own projects"})
	}

	// 获取用户已经同意的合作项目
	collabProjects, err := queries.GetCollaborativeProjects(c.Context(), userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch collaborative projects"})
	}

	// 使用map来去重，避免同一个项目被重复添加
	projectMap := make(map[int64]database.Project)

	// 添加自己的项目
	for _, project := range ownProjects {
		projectMap[project.ProjectID] = project
	}

	// 添加合作项目
	for _, project := range collabProjects {
		projectMap[project.ProjectID] = project
	}

	var response []ProjectResponse
	for _, project := range projectMap {
		if err := updateProjectSize(c.Context(), project); err != nil {
			log.Printf("ERROR: Failed to update size for project %d: %v", project.ProjectID, err)
		}

		// 转换为响应格式
		response = append(response, ProjectResponse{
			ProjectID:          project.ProjectID,
			UserID:             project.UserID,
			ProjectName:        project.ProjectName,
			ProjectAvatar:      project.ProjectAvatar.String,
			ProjectDescription: project.ProjectDescription.String,
			ProjectSize:        project.ProjectSize.Int64,
			CreateAt:           project.CreateAt.String,
			UpdateAt:           project.UpdateAt.String,
		})
	}

	return c.JSON(response)
}

// 获取单个项目
func getProject(c *fiber.Ctx) error {
	projectID, err := c.ParamsInt("id")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid project ID"})
	}

	userID, ok := c.Locals("userID").(int64)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}

	project, err := queries.GetProjectByID(c.Context(), int64(projectID))
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Project not found"})
	}

	if project.UserID != userID && userID != 1 {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Forbidden"})
	}

	if err := updateProjectSize(c.Context(), project); err != nil {
		log.Printf("ERROR: Failed to update size for project %d: %v", project.ProjectID, err)
	}

	response := ProjectResponse{
		ProjectID:          project.ProjectID,
		UserID:             project.UserID,
		ProjectName:        project.ProjectName,
		ProjectAvatar:      project.ProjectAvatar.String,
		ProjectDescription: project.ProjectDescription.String,
		ProjectSize:        project.ProjectSize.Int64,
		CreateAt:           project.CreateAt.String,
		UpdateAt:           project.UpdateAt.String,
	}

	return c.JSON(response)
}

// 更新项目
func updateProject(c *fiber.Ctx) error {
	projectID, err := c.ParamsInt("id")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid project ID"})
	}

	userID, ok := c.Locals("userID").(int64)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}

	project, err := queries.GetProjectByID(c.Context(), int64(projectID))
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Project not found"})
	}

	if project.UserID != userID && userID != 1 {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Forbidden"})
	}

	var req CreateProjectRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	updatedProject, err := queries.UpdateProject(c.Context(), database.UpdateProjectParams{
		ProjectName:        req.ProjectName,
		ProjectAvatar:      sql.NullString{String: req.ProjectAvatar, Valid: req.ProjectAvatar != ""},
		ProjectDescription: sql.NullString{String: req.ProjectDescription, Valid: req.ProjectDescription != ""},
		ProjectID:          int64(projectID),
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to update project"})
	}

	// 转换为响应格式
	response := ProjectResponse{
		ProjectID:          updatedProject.ProjectID,
		UserID:             updatedProject.UserID,
		ProjectName:        updatedProject.ProjectName,
		ProjectAvatar:      updatedProject.ProjectAvatar.String,
		ProjectDescription: updatedProject.ProjectDescription.String,
		ProjectSize:        updatedProject.ProjectSize.Int64,
		CreateAt:           updatedProject.CreateAt.String,
		UpdateAt:           updatedProject.UpdateAt.String,
	}

	return c.JSON(response)
}

// 删除项目
func deleteProject(c *fiber.Ctx) error {
	projectID, err := c.ParamsInt("id")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid project ID"})
	}

	userID, ok := c.Locals("userID").(int64)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}

	project, err := queries.GetProjectByID(c.Context(), int64(projectID))
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Project not found"})
	}

	if project.UserID != userID && userID != 1 {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Forbidden"})
	}

	// --- 1. 删除项目文件夹 ---
	projectDir := filepath.Join(baseDir, strconv.FormatInt(project.UserID, 10), strconv.FormatInt(project.ProjectID, 10))
	if err := os.RemoveAll(projectDir); err != nil {
		log.Printf("ERROR: Failed to delete project directory %s: %v", projectDir, err)
	}

	// --- 2. 删除数据库记录 ---
	if err := queries.DeleteProject(c.Context(), int64(projectID)); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to delete project record from database"})
	}

	log.Printf("Successfully deleted project %d and its resources.", projectID)
	return c.SendStatus(fiber.StatusNoContent)
}

// 下载项目
func downloadProject(c *fiber.Ctx) error {
	projectID, err := c.ParamsInt("id")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid project ID"})
	}

	userID, ok := c.Locals("userID").(int64)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}

	project, err := queries.GetProjectByID(c.Context(), int64(projectID))
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Project not found"})
	}

	if project.UserID != userID && userID != 1 {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Forbidden"})
	}

	projectDir := filepath.Join(baseDir, strconv.FormatInt(project.UserID, 10), strconv.FormatInt(project.ProjectID, 10))

	if _, err := os.Stat(projectDir); os.IsNotExist(err) {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Project directory not found"})
	}

	tempZipPath := filepath.Join(os.TempDir(), fmt.Sprintf("project_%d_%d.zip", project.UserID, project.ProjectID))
	zipFile, err := os.Create(tempZipPath)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create zip file"})
	}
	defer zipFile.Close()

	zipWriter := zip.NewWriter(zipFile)
	defer zipWriter.Close()

	err = filepath.Walk(projectDir, func(filePath string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		header, err := zip.FileInfoHeader(info)
		if err != nil {
			return err
		}

		relPath, err := filepath.Rel(projectDir, filePath)
		if err != nil {
			return err
		}
		header.Name = relPath

		if info.IsDir() {
			header.Name += "/"
		} else {
			header.Method = zip.Deflate
		}

		writer, err := zipWriter.CreateHeader(header)
		if err != nil {
			return err
		}

		if !info.IsDir() {
			file, err := os.Open(filePath)
			if err != nil {
				return err
			}
			defer file.Close()

			_, err = io.Copy(writer, file)
			if err != nil {
				return err
			}
		}

		return nil
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create zip archive"})
	}

	zipWriter.Close()

	err = c.Download(tempZipPath, fmt.Sprintf("project_%s.zip", project.ProjectName))
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to send file"})
	}

	os.Remove(tempZipPath)

	return nil
}

// 下载应用
func downloadApp(c *fiber.Ctx) error {
	osType := strings.ToLower(c.Params("os"))
	var appPath string

	switch osType {
	case "windows":
		appPath = "./Apps/LighterBase.exe"
	case "linux":
		appPath = "./Apps/LighterBase"
	default:
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid OS type. Use 'windows' or 'linux'"})
	}

	if _, err := os.Stat(appPath); os.IsNotExist(err) {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Application file not found"})
	}

	var filename string
	if osType == "windows" {
		filename = "LighterBase.exe"
	} else {
		filename = "LighterBase"
	}

	return c.Download(appPath, filename)
}

// 获取用户项目的最新SQL记录
func getProjectLatestSql(c *fiber.Ctx) error {
	projectID, err := c.ParamsInt("id")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid project ID"})
	}

	userID, ok := c.Locals("userID").(int64)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}

	project, err := queries.GetProjectByID(c.Context(), int64(projectID))
	if err != nil {
		if err == sql.ErrNoRows {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Project not found"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch project"})
	}

	if project.UserID != userID && userID != 1 {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Forbidden"})
	}

	key := fmt.Sprintf("%d/%d", project.UserID, project.ProjectID)
	dbSet, ok := dbMap[key]
	if !ok {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Project database not initialized"})
	}

	record, err := dbSet.Queries.GetLatestSql(c.Context())
	if err != nil {
		if err == sql.ErrNoRows {
			return c.JSON(nil)
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch latest SQL record"})
	}

	return c.JSON(record)
}

// sendNotification 发送通知
func sendNotification(c *fiber.Ctx) error {
	// 获取当前用户ID
	userID, ok := c.Locals("userID").(int64)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}

	// 解析请求体
	type RequestBody struct {
		ProjectID   int64  `json:"projectId"`
		Permissions string `json:"permissions"`
		Email       string `json:"email"`
	}
	var req RequestBody
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	// 检查项目是否存在且属于当前用户
	project, err := queries.GetProjectByID(c.Context(), req.ProjectID)
	if err != nil {
		if err == sql.ErrNoRows {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Project not found"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch project"})
	}

	if project.UserID != userID {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "You don't have permission to send notification for this project"})
	}

	// 检查项目数据库是否已初始化
	key := fmt.Sprintf("%d/%d", project.UserID, project.ProjectID)
	dbSet, ok := dbMap[key]
	if !ok {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Project database not initialized"})
	}

	// 检查项目内的users表是否有数据
	var userCount int
	err = dbSet.DataDB.QueryRow("SELECT COUNT(*) FROM users").Scan(&userCount)
	if err != nil {
		// 如果表不存在，也视为没有数据
		if strings.Contains(err.Error(), "no such table") {
			userCount = 0
		} else {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to check users table"})
		}
	}

	if userCount == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Cannot invite others before registering yourself in this project"})
	}

	// 检查接收者邮箱是否存在
	receiver, err := queries.GetUserByEmail(c.Context(), req.Email)
	if err != nil {
		if err == sql.ErrNoRows {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "User with this email not found"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch user"})
	}

	// 检查接收者是否是发送者本人
	if receiver.UserID == userID {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Cannot send notification to yourself"})
	}

	// 构建通知内容
	var notificationContent string
	switch req.Permissions {
	case "admin":
		notificationContent = "邀请成为高权限成员"
	case "readonly":
		notificationContent = "邀请成为只读成员"
	default:
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid permissions. Use 'admin' or 'readonly'"})
	}

	// 检查是否已经给这个用户发送过这个项目的请求且状态为待确认或同意
	duplicateCount, err := queries.CheckDuplicateNotification(c.Context(), database.CheckDuplicateNotificationParams{
		SenderID:   userID,
		ReceiverID: receiver.UserID,
		ProjectID:  req.ProjectID,
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to check duplicate notification"})
	}
	if duplicateCount > 0 {
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{"error": "You have already sent a notification to this user for this project that is pending or agreed"})
	}

	// 创建通知记录
	notification, err := queries.CreateNotification(c.Context(), database.CreateNotificationParams{
		SenderID:            userID,
		ReceiverID:          receiver.UserID,
		ProjectID:           req.ProjectID,
		NotificationContent: notificationContent,
		NotificationStatus:  "pending",
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create notification"})
	}

	// 获取发送者和接收者详细信息
	sender, err := queries.GetUserByID(c.Context(), userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch sender details"})
	}

	// 获取项目详细信息
	project, projectErr := queries.GetProjectByID(c.Context(), req.ProjectID)
	if projectErr != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch project details"})
	}

	// 返回响应
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"notification_id": notification.NotificationID,
		"sender": map[string]any{
			"user_id":   sender.UserID,
			"user_name": sender.UserName,
			"email":     sender.Email,
		},
		"receiver": map[string]any{
			"user_id":   receiver.UserID,
			"user_name": receiver.UserName,
			"email":     receiver.Email,
		},
		"project": map[string]any{
			"project_id":          project.ProjectID,
			"project_name":        project.ProjectName,
			"project_description": project.ProjectDescription.String,
			"user_id":             project.UserID,
		},
		"content":   notification.NotificationContent,
		"status":    notification.NotificationStatus,
		"create_at": notification.CreateAt.String,
		"update_at": notification.UpdateAt.String,
	})
}

// checkMyNotifications 查看我发送的通知
func checkMyNotifications(c *fiber.Ctx) error {
	// 获取当前用户ID
	userID, ok := c.Locals("userID").(int64)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}

	status := c.Params("status")
	var notifications []database.Notification
	var err error

	switch strings.ToLower(status) {
	case "all":
		notifications, err = queries.GetNotificationsBySender(c.Context(), userID)
	case "agree":
		notifications, err = queries.GetNotificationsBySenderAndStatus(c.Context(), database.GetNotificationsBySenderAndStatusParams{
			SenderID:           userID,
			NotificationStatus: "agree",
		})
	case "disagree":
		notifications, err = queries.GetNotificationsBySenderAndStatus(c.Context(), database.GetNotificationsBySenderAndStatusParams{
			SenderID:           userID,
			NotificationStatus: "disagree",
		})
	case "pending":
		notifications, err = queries.GetNotificationsBySenderAndStatus(c.Context(), database.GetNotificationsBySenderAndStatusParams{
			SenderID:           userID,
			NotificationStatus: "pending",
		})
	default:
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid status. Use 'all', 'agree', 'disagree', or 'pending'"})
	}

	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch notifications"})
	}

	// 转换为响应格式
	var response []map[string]any
	for _, notification := range notifications {
		// 获取发送者详细信息
		sender, senderErr := queries.GetUserByID(c.Context(), notification.SenderID)
		if senderErr != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch sender details"})
		}

		// 获取接收者详细信息
		receiver, receiverErr := queries.GetUserByID(c.Context(), notification.ReceiverID)
		if receiverErr != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch receiver details"})
		}

		// 获取项目详细信息
		project, projectErr := queries.GetProjectByID(c.Context(), notification.ProjectID)
		if projectErr != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch project details"})
		}

		response = append(response, map[string]any{
			"notification_id": notification.NotificationID,
			"sender": map[string]any{
				"user_id":   sender.UserID,
				"user_name": sender.UserName,
				"email":     sender.Email,
			},
			"receiver": map[string]any{
				"user_id":   receiver.UserID,
				"user_name": receiver.UserName,
				"email":     receiver.Email,
			},
			"project": map[string]any{
				"project_id":          project.ProjectID,
				"project_name":        project.ProjectName,
				"project_description": project.ProjectDescription.String,
				"user_id":             project.UserID,
			},
			"content":   notification.NotificationContent,
			"status":    notification.NotificationStatus,
			"create_at": notification.CreateAt.String,
			"update_at": notification.UpdateAt.String,
		})
	}

	return c.JSON(response)
}

// checkNotificationsSentToMe 查看发送给我的通知
func checkNotificationsSentToMe(c *fiber.Ctx) error {
	// 获取当前用户ID
	userID, ok := c.Locals("userID").(int64)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}

	status := c.Params("status")
	var notifications []database.Notification
	var err error

	switch strings.ToLower(status) {
	case "all":
		notifications, err = queries.GetNotificationsByReceiver(c.Context(), userID)
	case "agree":
		notifications, err = queries.GetNotificationsByReceiverAndStatus(c.Context(), database.GetNotificationsByReceiverAndStatusParams{
			ReceiverID:         userID,
			NotificationStatus: "agree",
		})
	case "disagree":
		notifications, err = queries.GetNotificationsByReceiverAndStatus(c.Context(), database.GetNotificationsByReceiverAndStatusParams{
			ReceiverID:         userID,
			NotificationStatus: "disagree",
		})
	case "pending":
		notifications, err = queries.GetNotificationsByReceiverAndStatus(c.Context(), database.GetNotificationsByReceiverAndStatusParams{
			ReceiverID:         userID,
			NotificationStatus: "pending",
		})
	default:
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid status. Use 'all', 'agree', 'disagree', or 'pending'"})
	}

	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch notifications"})
	}

	// 转换为响应格式
	var response []map[string]any
	for _, notification := range notifications {
		// 获取发送者详细信息
		sender, senderErr := queries.GetUserByID(c.Context(), notification.SenderID)
		if senderErr != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch sender details"})
		}

		// 获取接收者详细信息
		receiver, receiverErr := queries.GetUserByID(c.Context(), notification.ReceiverID)
		if receiverErr != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch receiver details"})
		}

		// 获取项目详细信息
		project, projectErr := queries.GetProjectByID(c.Context(), notification.ProjectID)
		if projectErr != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch project details"})
		}

		response = append(response, map[string]any{
			"notification_id": notification.NotificationID,
			"sender": map[string]any{
				"user_id":   sender.UserID,
				"user_name": sender.UserName,
				"email":     sender.Email,
			},
			"receiver": map[string]any{
				"user_id":   receiver.UserID,
				"user_name": receiver.UserName,
				"email":     receiver.Email,
			},
			"project": map[string]any{
				"project_id":          project.ProjectID,
				"project_name":        project.ProjectName,
				"project_description": project.ProjectDescription.String,
				"user_id":             project.UserID,
			},
			"content":   notification.NotificationContent,
			"status":    notification.NotificationStatus,
			"create_at": notification.CreateAt.String,
			"update_at": notification.UpdateAt.String,
		})
	}

	return c.JSON(response)
}

// confirmNotification 确认通知
func confirmNotification(c *fiber.Ctx) error {
	// 获取当前用户ID
	userID, ok := c.Locals("userID").(int64)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}

	notificationID, err := c.ParamsInt("notificationId")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid notification ID"})
	}

	status := c.Params("status")
	if status != "agree" && status != "disagree" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid status. Use 'agree' or 'disagree'"})
	}

	// 检查通知是否存在且用户是接收者且状态为pending
	permission, err := queries.CheckNotificationPermission(c.Context(), database.CheckNotificationPermissionParams{
		NotificationID: int64(notificationID),
		ReceiverID:     userID,
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to check notification permission"})
	}

	if permission == 0 {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "You don't have permission to confirm this notification or it's not pending"})
	}

	// 更新通知状态
	err = queries.UpdateNotificationStatus(c.Context(), database.UpdateNotificationStatusParams{
		NotificationStatus: status,
		NotificationID:     int64(notificationID),
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to update notification status"})
	}

	// 获取更新后的通知信息
	notification, err := queries.GetNotificationByID(c.Context(), int64(notificationID))
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch updated notification"})
	}

	// 获取发送者详细信息
	sender, senderErr := queries.GetUserByID(c.Context(), notification.SenderID)
	if senderErr != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch sender details"})
	}

	// 获取接收者详细信息
	receiver, receiverErr := queries.GetUserByID(c.Context(), notification.ReceiverID)
	if receiverErr != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch receiver details"})
	}

	// 获取项目详细信息
	project, projectErr := queries.GetProjectByID(c.Context(), notification.ProjectID)
	if projectErr != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch project details"})
	}

	return c.JSON(map[string]any{
		"notification_id": notification.NotificationID,
		"sender": map[string]any{
			"user_id":   sender.UserID,
			"user_name": sender.UserName,
			"email":     sender.Email,
		},
		"receiver": map[string]any{
			"user_id":   receiver.UserID,
			"user_name": receiver.UserName,
			"email":     receiver.Email,
		},
		"project": map[string]any{
			"project_id":          project.ProjectID,
			"project_name":        project.ProjectName,
			"project_description": project.ProjectDescription.String,
			"user_id":             project.UserID,
		},
		"content":   notification.NotificationContent,
		"status":    notification.NotificationStatus,
		"create_at": notification.CreateAt.String,
		"update_at": notification.UpdateAt.String,
	})
}

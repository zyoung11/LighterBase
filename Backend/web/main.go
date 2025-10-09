package main

import (
	"context"
	"database/sql"
	_ "embed"
	"fmt"
	"log"
	"math"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"

	"LighterBaseHub/database"

	"github.com/gofiber/fiber/v2"
)

//go:embed LighterBase
var LighterBase []byte

var routes = []Route{
	{Method: "GET", Path: "/health", Handler: health},

	// 用户相关
	{Method: "POST", Path: "/api/users/register", Handler: register},
	{Method: "POST", Path: "/api/users/login", Handler: login},
	{Method: "GET", Path: "/api/users", Handler: listUsers},
	{Method: "GET", Path: "/api/users/:id", Handler: getUser},
	{Method: "PUT", Path: "/api/users/:id", Handler: updateUser},
	{Method: "DELETE", Path: "/api/users/:id", Handler: deleteUser},

	// 项目相关
	{Method: "POST", Path: "/api/projects", Handler: createProject},
	{Method: "GET", Path: "/api/projects", Handler: listMyProjects},
	{Method: "GET", Path: "/api/projects/:id", Handler: getProject},
	{Method: "PUT", Path: "/api/projects/:id", Handler: updateProject},
	{Method: "DELETE", Path: "/api/projects/:id", Handler: deleteProject},
}

//-------------------------------------------------------------------------------------

func main() {
	initBaas()
	initBackend("LighterBaseHub", "build", 8080, 8090)
}

//-------------------------------------helper-func-------------------------------------

// startProjectInstance 根据数据库中的项目信息启动一个BaaS实例
func startProjectInstance(project database.Project) error {
	// 从数据库记录中获取用户ID和项目ID来构建路径
	projectDir := filepath.Join(baseDir, strconv.FormatInt(project.UserID, 10), strconv.FormatInt(project.ProjectID, 10))
	executablePath := filepath.Join(projectDir, "LighterBase")

	// 检查可执行文件是否存在
	if _, err := os.Stat(executablePath); os.IsNotExist(err) {
		log.Printf("WARN: Executable not found for project %d (user %d) at %s, skipping.", project.ProjectID, project.UserID, executablePath)
		return nil // 不返回错误，只是跳过
	}

	// 检查端口是否有效
	if !project.Port.Valid {
		log.Printf("WARN: Port not assigned for project %d (user %d), skipping.", project.ProjectID, project.UserID)
		return nil
	}
	assignedPort := project.Port.Int64

	log.Printf("Starting BaaS instance for project %d (user %d) on port %d...", project.ProjectID, project.UserID, assignedPort)

	cmd := exec.Command(executablePath)
	cmd.Env = append(os.Environ(), fmt.Sprintf("PORT=%d", assignedPort))
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Start(); err != nil {
		log.Printf("ERROR: Failed to start BaaS instance for project %d: %v", project.ProjectID, err)
		return err
	}

	log.Printf("Successfully started BaaS instance for project %d (user %d) on port %d with PID %d", project.ProjectID, project.UserID, assignedPort, cmd.Process.Pid)
	return nil
}

func initBaas() {
	log.Println("Restoring all project instances on startup...")
	// 从数据库获取所有已分配端口的项目
	allProjects, err := queries.ListAllProjectsForRestore(context.Background())
	if err != nil {
		log.Printf("ERROR: Could not fetch projects for restoration: %v", err)
	} else {
		for _, project := range allProjects {
			if err := startProjectInstance(project); err != nil {
				log.Printf("ERROR: Failed to restore project %d", project.ProjectID)
			}
		}
	}
	log.Println("Project restoration process finished.")
}

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

// 用户数据库路径
const baseDir string = "./LighterBaseHubData/Apps"

// 创建项目请求结构
type CreateProjectRequest struct {
	ProjectName        string `json:"project_name"`
	ProjectAvatar      string `json:"project_avatar"`
	ProjectDescription string `json:"project_description"`
	ProjectSize        int64  `json:"project_size"`
}

// 创建项目
func createProject(c *fiber.Ctx) error {
	userID, ok := c.Locals("userID").(int64)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}

	var req CreateProjectRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	// --- 1. 数据库操作：创建项目并计算端口 ---
	tx, err := db.BeginTx(c.Context(), nil)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to start transaction"})
	}
	defer tx.Rollback()

	txQueries := queries.WithTx(tx)

	project, err := txQueries.CreateProject(c.Context(), database.CreateProjectParams{
		UserID:             userID,
		ProjectName:        req.ProjectName,
		ProjectAvatar:      sql.NullString{String: req.ProjectAvatar, Valid: req.ProjectAvatar != ""},
		ProjectDescription: sql.NullString{String: req.ProjectDescription, Valid: req.ProjectDescription != ""},
		ProjectSize:        sql.NullInt64{Int64: req.ProjectSize, Valid: true},
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create project record"})
	}

	// 计算端口
	assignedPort := 9000 + project.ProjectID

	// 使用新生成的 sqlc 函数更新端口
	err = txQueries.UpdateProjectPort(c.Context(), database.UpdateProjectPortParams{
		Port:      sql.NullInt64{Int64: int64(assignedPort), Valid: true},
		ProjectID: project.ProjectID,
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to assign port"})
	}

	// --- 2. 文件系统操作：创建目录和复制可执行文件 ---
	// 创建项目专属目录: baseDir/{用户id}/{项目id}/
	projectDir := filepath.Join(baseDir, strconv.FormatInt(userID, 10), strconv.FormatInt(project.ProjectID, 10))
	if err := os.MkdirAll(projectDir, 0o755); err != nil {
		log.Printf("ERROR: Failed to create project directory %s: %v", projectDir, err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create project directory"})
	}

	// 将嵌入的可执行文件写入到项目目录
	executablePath := filepath.Join(projectDir, "LighterBase")
	if err := os.WriteFile(executablePath, LighterBase, 0o755); err != nil {
		log.Printf("ERROR: Failed to write executable file to %s: %v", executablePath, err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to deploy instance"})
	}

	// --- 3. 进程管理：启动BaaS实例 ---
	cmd := exec.Command(executablePath)

	cmd.Env = append(os.Environ(), fmt.Sprintf("PORT=%d", assignedPort))

	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	// 启动进程，但不等待它结束
	if err := cmd.Start(); err != nil {
		log.Printf("ERROR: Failed to start BaaS instance for project %d: %v", project.ProjectID, err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to start project instance"})
	}

	log.Printf("Successfully started BaaS instance for project %d (user %d) on port %d with PID %d", project.ProjectID, userID, assignedPort, cmd.Process.Pid)

	// --- 4. 提交事务并返回结果 ---
	if err := tx.Commit(); err != nil {
		if cmd.Process != nil {
			cmd.Process.Kill()
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to commit project creation"})
	}

	return c.Status(fiber.StatusCreated).JSON(project)
}

// 获取当前用户的所有项目
func listMyProjects(c *fiber.Ctx) error {
	userID, ok := c.Locals("userID").(int64)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}

	projects, err := queries.ListProjectsByUserID(c.Context(), userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch projects"})
	}

	for i := range projects {
		if err := updateProjectSize(c.Context(), projects[i]); err != nil {
			// 更新失败不应该中断整个请求，记录日志即可
			log.Printf("ERROR: Failed to update size for project %d: %v", projects[i].ProjectID, err)
		}
	}

	return c.JSON(projects)
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

	// 权限检查：只能访问自己的项目或是管理员
	if project.UserID != userID && userID != 1 {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Forbidden"})
	}

	if err := updateProjectSize(c.Context(), project); err != nil {
		// 更新失败不应该中断请求，记录日志并返回旧数据
		log.Printf("ERROR: Failed to update size for project %d: %v", project.ProjectID, err)
	}

	return c.JSON(project)
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

	return c.JSON(updatedProject)
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

	if err := queries.DeleteProject(c.Context(), int64(projectID)); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to delete project"})
	}

	return c.SendStatus(fiber.StatusNoContent)
}

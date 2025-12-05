package main

import (
	"LighterBaseHub/database"
	"context"
	"database/sql"
	// _ "embed"
	"fmt"
	"log"
	"math"
	"net/http"
	"os"
	// "os/exec"
	"path/filepath"
	"strconv"
	"sync"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/proxy"
)

// //go:embed LighterBase
// var lighterBaseBinary []byte

// 用户数据库路径
const baseDir string = "./LighterBaseHubData/Apps"

var (
	lighterBaseProcess *os.Process
	processMutex       sync.Mutex
	lighterBasePath    string
)

var routes = []Route{
	{Method: "GET", Path: "/health", Handler: health, AuthRequired: false},

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

	// BaaS API 反向代理
	{Method: "USE", Path: "/:userId/:projectId/*", Handler: baasProxyHandler, AuthRequired: false},
}

//-------------------------------------------------------------------------------------

// extractLighterBase 提取嵌入的LighterBase可执行文件到临时位置
// func extractLighterBase() (string, error) {
// 	// 创建临时文件
// 	tempFile, err := os.CreateTemp("", "LighterBase-*")
// 	if err != nil {
// 		return "", fmt.Errorf("failed to create temp file: %w", err)
// 	}
// 	defer tempFile.Close()

// 	// 写入嵌入的二进制数据
// 	if _, err := tempFile.Write(lighterBaseBinary); err != nil {
// 		os.Remove(tempFile.Name())
// 		return "", fmt.Errorf("failed to write embedded binary: %w", err)
// 	}

// 	// 设置可执行权限
// 	if err := os.Chmod(tempFile.Name(), 0755); err != nil {
// 		os.Remove(tempFile.Name())
// 		return "", fmt.Errorf("failed to set executable permission: %w", err)
// 	}

// 	return tempFile.Name(), nil
// }

// // startLighterBase 启动LighterBase程序
// func startLighterBase() error {
// 	processMutex.Lock()
// 	defer processMutex.Unlock()

// 	// 如果进程已经在运行，先停止它
// 	if lighterBaseProcess != nil {
// 		log.Println("Stopping existing LighterBase process...")
// 		if err := lighterBaseProcess.Kill(); err != nil {
// 			log.Printf("Warning: failed to kill existing process: %v", err)
// 		}
// 		lighterBaseProcess.Wait()
// 		lighterBaseProcess = nil
// 	}

// 	// 提取嵌入的二进制文件
// 	if lighterBasePath == "" {
// 		path, err := extractLighterBase()
// 		if err != nil {
// 			return fmt.Errorf("failed to extract LighterBase: %w", err)
// 		}
// 		lighterBasePath = path
// 		log.Printf("Extracted LighterBase to: %s", lighterBasePath)
// 	}

// 	// 获取当前工作目录
// 	workDir, err := os.Getwd()
// 	if err != nil {
// 		return fmt.Errorf("failed to get current working directory: %w", err)
// 	}

// 	log.Printf("Starting LighterBase with working directory: %s", workDir)

// 	// 创建命令
// 	cmd := exec.Command(lighterBasePath)
// 	cmd.Dir = workDir // 设置工作目录为当前目录
// 	cmd.Stdout = os.Stdout
// 	cmd.Stderr = os.Stderr

// 	// 启动进程
// 	if err := cmd.Start(); err != nil {
// 		return fmt.Errorf("failed to start LighterBase: %w", err)
// 	}

// 	lighterBaseProcess = cmd.Process
// 	log.Printf("LighterBase started with PID: %d", lighterBaseProcess.Pid)

// 	// 在后台监控进程
// 	go func() {
// 		if err := cmd.Wait(); err != nil {
// 			log.Printf("LighterBase process exited with error: %v", err)
// 		} else {
// 			log.Println("LighterBase process exited normally")
// 		}

// 		processMutex.Lock()
// 		if lighterBaseProcess == cmd.Process {
// 			lighterBaseProcess = nil
// 		}
// 		processMutex.Unlock()
// 	}()

// 	return nil
// }

// // monitorLighterBase 监控LighterBase进程，如果崩溃则重启
// func monitorLighterBase() {
// 	ticker := time.NewTicker(10 * time.Second)
// 	defer ticker.Stop()

// 	for range ticker.C {
// 		processMutex.Lock()
// 		running := lighterBaseProcess != nil
// 		processMutex.Unlock()

// 		if !running {
// 			log.Println("LighterBase is not running, attempting to restart...")
// 			if err := startLighterBase(); err != nil {
// 				log.Printf("Failed to restart LighterBase: %v", err)
// 			}
// 		}
// 	}
// }

func main() {
	// 启动LighterBase
	// if err := startLighterBase(); err != nil {
	// 	log.Fatalf("Failed to start LighterBase: %v", err)
	// }

	// 启动监控goroutine
	// go monitorLighterBase()

	// 确保清理资源
	defer func() {
		processMutex.Lock()
		if lighterBaseProcess != nil {
			log.Println("Stopping LighterBase process...")
			lighterBaseProcess.Kill()
		}
		processMutex.Unlock()

		// 清理临时文件
		if lighterBasePath != "" {
			os.Remove(lighterBasePath)
		}
	}()

	// 给LighterBase一点启动时间
	time.Sleep(2 * time.Second)

	initDB("LighterBaseHub")
	initBackend("LighterBaseHub", "build", 8080, 80)
}

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

	// 向LighterBase发送初始化请求
	initURL := fmt.Sprintf("http://localhost:8081/%d/%d/init", userID, project.ProjectID)
	httpReq, err := http.NewRequest("POST", initURL, nil)
	if err != nil {
		log.Printf("ERROR: Failed to create init request for project %d: %v", project.ProjectID, err)
	} else {
		client := &http.Client{Timeout: 10 * time.Second}
		resp, err := client.Do(httpReq)
		if err != nil {
			log.Printf("ERROR: Failed to send init request for project %d: %v", project.ProjectID, err)
		} else {
			defer resp.Body.Close()
			if resp.StatusCode != http.StatusOK {
				log.Printf("WARN: Init request for project %d returned status %d", project.ProjectID, resp.StatusCode)
			} else {
				log.Printf("Successfully initialized project %d", project.ProjectID)
			}
		}
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

	projects, err := queries.ListProjectsByUserID(c.Context(), userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch projects"})
	}

	var response []ProjectResponse
	for _, project := range projects {
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

// baasProxyHandler 通用的BaaS反向代理处理器
func baasProxyHandler(c *fiber.Ctx) error {
	// 1. 从URL路径中获取参数
	userIDStr := c.Params("userId")
	projectIDStr := c.Params("projectId")

	if userIDStr == "" || projectIDStr == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "User ID and Project ID are required"})
	}

	// 2. 验证用户权限
	// currentUserID, ok := c.Locals("userID").(int64)
	// if !ok {
	// 	return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	// }

	// 转换ID
	// userID, err := strconv.ParseInt(userIDStr, 10, 64)
	// if err != nil {
	// 	return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid user ID"})
	// }

	// projectID, err := strconv.ParseInt(projectIDStr, 10, 64)
	// if err != nil {
	// 	return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid project ID"})
	// }

	// 检查项目是否存在且用户有权限
	// project, err := queries.GetProjectByID(c.Context(), projectID)
	// if err != nil {
	// 	return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Project not found"})
	// }

	// if project.UserID != userID && currentUserID != 1 {
	// 	return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Forbidden"})
	// }

	// 3. 构建目标URL
	targetURL := fmt.Sprintf("http://localhost:8081/%s/%s/%s", userIDStr, projectIDStr, c.Params("*"))

	// 4. 代理请求
	if err := proxy.Do(c, targetURL); err != nil {
		log.Printf("ERROR: Proxy request failed: %v", err)
		return c.Status(fiber.StatusBadGateway).JSON(fiber.Map{"error": "Proxy request failed"})
	}

	return nil
}

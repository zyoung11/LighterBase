package main

import (
	"database/sql"

	"LighterBaseHub/database"

	"github.com/gofiber/fiber/v2"
)

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

func main() {
	initBackend("LighterBaseHub", "build", 8080, 8090)
}

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
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
	}

	project, err := queries.CreateProject(c.Context(), database.CreateProjectParams{
		UserID:             userID,
		ProjectName:        req.ProjectName,
		ProjectAvatar:      sql.NullString{String: req.ProjectAvatar, Valid: req.ProjectAvatar != ""},
		ProjectDescription: sql.NullString{String: req.ProjectDescription, Valid: req.ProjectDescription != ""},
		ProjectSize:        sql.NullInt64{Int64: req.ProjectSize, Valid: true},
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create project"})
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

	// 权限检查：只能访问自己的项目或是管理员（这里简化判断 userID == 1 为管理员）
	if project.UserID != userID && userID != 1 {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Forbidden"})
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
		ProjectSize:        sql.NullInt64{Int64: req.ProjectSize, Valid: req.ProjectSize != 0},
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

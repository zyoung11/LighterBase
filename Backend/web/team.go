package main

import (
	"LighterBaseHub/database"
	"database/sql"
	"strings"

	"github.com/gofiber/fiber/v2"
)

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

	// 返回响应
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"notification_id": notification.NotificationID,
		"sender_id":       notification.SenderID,
		"receiver_id":     notification.ReceiverID,
		"project_id":      notification.ProjectID,
		"content":         notification.NotificationContent,
		"status":          notification.NotificationStatus,
		"create_at":       notification.CreateAt.String,
		"update_at":       notification.UpdateAt.String,
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
		response = append(response, map[string]any{
			"notification_id": notification.NotificationID,
			"sender_id":       notification.SenderID,
			"receiver_id":     notification.ReceiverID,
			"project_id":      notification.ProjectID,
			"content":         notification.NotificationContent,
			"status":          notification.NotificationStatus,
			"create_at":       notification.CreateAt.String,
			"update_at":       notification.UpdateAt.String,
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
		response = append(response, map[string]any{
			"notification_id": notification.NotificationID,
			"sender_id":       notification.SenderID,
			"receiver_id":     notification.ReceiverID,
			"project_id":      notification.ProjectID,
			"content":         notification.NotificationContent,
			"status":          notification.NotificationStatus,
			"create_at":       notification.CreateAt.String,
			"update_at":       notification.UpdateAt.String,
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

	return c.JSON(map[string]any{
		"notification_id": notification.NotificationID,
		"sender_id":       notification.SenderID,
		"receiver_id":     notification.ReceiverID,
		"project_id":      notification.ProjectID,
		"content":         notification.NotificationContent,
		"status":          notification.NotificationStatus,
		"create_at":       notification.CreateAt.String,
		"update_at":       notification.UpdateAt.String,
	})
}

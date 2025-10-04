-- name: GetUserByLoginName :one
SELECT * FROM users WHERE login_name = ?;

-- name: CreateUser :one
INSERT INTO users (
    login_name, password_hash, name, gender, birth, phone, email, wechat, description, reg_date, last_modify, status
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
RETURNING *;

-- name: UpdateUser :exec
UPDATE users
SET phone = ?, email = ?, wechat = ?, description = ?, last_modify = ?
WHERE user_id = ?;

-- name: UpdatePassword :exec
UPDATE users SET password_hash = ? WHERE user_id = ?;

-- name: UpdateAvatar :exec
UPDATE users SET avatar_base64 = ? WHERE user_id = ?;

-- name: SetUserStatus :exec
UPDATE users SET status = ? WHERE user_id = ?;

-- name: GetCategoriesByUserID :many
SELECT * FROM categories WHERE user_id = ? ORDER BY type_id DESC;

-- name: CreateCategory :one
INSERT INTO categories (user_id, type_name) VALUES (?, ?)
RETURNING *;

-- name: DeleteCategory :exec
DELETE FROM categories WHERE type_id = ? AND user_id = ?;

-- name: GetCategoryArticleCount :one
SELECT article_count FROM categories WHERE type_id = ?;

-- name: CreateArticle :one
INSERT INTO articles (user_id, type_id, title, content, publish_date, last_modify, is_public, cover_base64)
VALUES (?, ?, ?, ?, ?, ?, ?, ?)
RETURNING *;

-- name: GetArticleByID :one
SELECT * FROM articles WHERE article_id = ?;

-- name: GetArticlesByUserID :many
SELECT * FROM articles WHERE user_id = ? AND is_public = 1 ORDER BY publish_date DESC LIMIT ? OFFSET ?;

-- name: GetPublicArticles :many
SELECT * FROM articles WHERE is_public = 1 ORDER BY publish_date DESC LIMIT ? OFFSET ?;

-- name: UpdateArticle :exec
UPDATE articles SET title = ?, content = ?, last_modify = ? WHERE article_id = ? AND user_id = ?;

-- name: DeleteArticle :exec
DELETE FROM articles WHERE article_id = ? AND user_id = ?;

-- name: CreateComment :one
INSERT INTO comments (article_id, user_id, parent_id, content, create_time)
VALUES (?, ?, ?, ?, ?)
RETURNING *;

-- name: GetCommentsByArticleID :many
SELECT * FROM comments WHERE article_id = ? AND disabled = 0 ORDER BY create_time ASC;

-- name: SetCommentDisabled :exec
UPDATE comments SET disabled = ? WHERE comment_id = ?;

-- name: InsertLoginLog :exec
INSERT INTO login_logs (login_name, ip, result, time) VALUES (?, ?, ?, ?);

-- name: GetLoginLogs :many
SELECT * FROM login_logs WHERE login_name LIKE ? ORDER BY time DESC LIMIT ? OFFSET ?;

-- name: InsertOperationLog :exec
INSERT INTO operation_logs (login_name, operation, target, time) VALUES (?, ?, ?, ?);

-- name: GetOperationLogs :many
SELECT * FROM operation_logs WHERE login_name LIKE ? ORDER BY time DESC LIMIT ? OFFSET ?;

-- name: GetOperationLogsByMultiple :many
SELECT * FROM operation_logs 
WHERE operation_logs.login_name LIKE ? OR operation_logs.login_name IN (SELECT login_name FROM users WHERE CAST(user_id AS TEXT) LIKE ? OR name LIKE ?)
ORDER BY time DESC LIMIT ? OFFSET ?;

-- name: GetOperationLogsCountByMultiple :one
SELECT COUNT(*) FROM operation_logs 
WHERE operation_logs.login_name LIKE ? OR operation_logs.login_name IN (SELECT login_name FROM users WHERE CAST(user_id AS TEXT) LIKE ? OR name LIKE ?);

-- name: GetCategoryByID :one
SELECT * FROM categories WHERE type_id = ?;

-- name: GetPublicArticlesCount :one
SELECT COUNT(*) FROM articles WHERE is_public = 1;

-- name: GetLoginLogsCount :one
SELECT COUNT(*) FROM login_logs WHERE login_name LIKE ?;

-- name: GetOperationLogsCount :one
SELECT COUNT(*) FROM operation_logs WHERE login_name LIKE ?;

-- name: GetUserByID :one
SELECT * FROM users WHERE user_id = ?;

-- name: GetAllArticlesByUserID :many
SELECT * FROM articles WHERE user_id = ? ORDER BY publish_date DESC LIMIT ? OFFSET ?;

-- name: GetAllCategories :many
SELECT * FROM categories ORDER BY type_id DESC;

-- name: GetPublicArticlesByType :many
SELECT * FROM articles WHERE is_public = 1 AND type_id = ? ORDER BY publish_date DESC LIMIT ? OFFSET ?;

-- name: GetPublicArticlesCountByType :one
SELECT COUNT(*) FROM articles WHERE is_public = 1 AND type_id = ?;

-- name: GetAllComments :many
SELECT * FROM comments ORDER BY create_time DESC;

-- name: GetAllUsers :many
SELECT * FROM users ORDER BY reg_date DESC;

-- name: SearchPublicArticlesByTitle :many
SELECT * FROM articles WHERE is_public = 1 AND title LIKE ? ORDER BY publish_date DESC;

-- name: SearchPublicArticlesByTypeName :many
SELECT a.* FROM articles a 
JOIN categories c ON a.type_id = c.type_id 
WHERE a.is_public = 1 AND c.type_name LIKE ? 
ORDER BY a.publish_date DESC;

-- name: GetCategoriesWithArticles :many
SELECT DISTINCT c.type_id, c.user_id, c.type_name, c.article_count 
FROM categories c 
JOIN articles a ON c.type_id = a.type_id 
WHERE a.is_public = 1 
ORDER BY c.type_id DESC;

-- name: SearchUsersByLoginName :many
SELECT * FROM users WHERE login_name LIKE ? ORDER BY reg_date DESC;

-- name: SearchUsersByMultiple :many
SELECT * FROM users WHERE login_name LIKE ? OR user_id LIKE ? OR name LIKE ? ORDER BY reg_date DESC;

-- name: GetCommentsByUserName :many
SELECT c.* FROM comments c 
JOIN users u ON c.user_id = u.user_id 
WHERE u.login_name LIKE ? 
ORDER BY c.create_time DESC;

-- name: GetCommentsByMultiple :many
SELECT c.* FROM comments c 
JOIN users u ON c.user_id = u.user_id 
WHERE u.login_name LIKE ? OR u.user_id LIKE ? OR u.name LIKE ? 
ORDER BY c.create_time DESC;
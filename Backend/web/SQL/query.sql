-- name: CreateUser :one
INSERT INTO users (
    user_name, password_hash, email, user_avatar,
    create_at, update_at
) VALUES (
    ?, ?, ?, ?,
    datetime('now'), datetime('now')
)
RETURNING *;

-- name: GetUserByEmail :one
SELECT * FROM users
WHERE email = ? LIMIT 1;

-- name: GetUserByID :one
SELECT * FROM users
WHERE user_id = ? LIMIT 1;

-- name: GetUserByName :one
SELECT * FROM users
WHERE user_name = ? LIMIT 1;

-- name: ListAllUsers :many
SELECT * FROM users;

-- name: UpdateUser :one
UPDATE users
SET
    user_name = COALESCE(?, user_name),
    password_hash = COALESCE(?, password_hash),
    user_avatar = COALESCE(?, user_avatar),
    update_at = datetime('now')
WHERE user_id = ?
RETURNING *;

-- name: DeleteUser :exec
DELETE FROM users WHERE user_id = ?;



-- name: CreateProject :one
INSERT INTO projects (
    user_id, project_name, project_avatar, project_description, project_size, create_at, update_at
) VALUES (
    ?, ?, ?, ?, ?, datetime('now'), datetime('now')
)
RETURNING *;

-- name: GetProjectByID :one
SELECT * FROM projects WHERE project_id = ? LIMIT 1;

-- name: ListProjectsByUserID :many
SELECT * FROM projects WHERE user_id = ? ORDER BY create_at DESC;

-- name: UpdateProject :one
UPDATE projects
SET
    project_name = COALESCE(?, project_name),
    project_avatar = COALESCE(?, project_avatar),
    project_description = COALESCE(?, project_description),
    update_at = datetime('now')
WHERE project_id = ?
RETURNING *;

-- name: DeleteProject :exec
DELETE FROM projects WHERE project_id = ?;

-- name: ListAllProjectsForRestore :many
SELECT * FROM projects WHERE port IS NOT NULL;

-- name: UpdateProjectSize :exec
UPDATE projects SET project_size = ?, update_at = datetime('now') WHERE project_id = ?;

-- name: CountUsers :one
SELECT count(*) FROM users;














































-- name: CreateSql :exec
INSERT INTO _sqls_ (sql) VALUES (?);

-- name: GetLatestSql :one
SELECT id, sql FROM _sqls_ ORDER BY id DESC LIMIT 1;

-- name: ListSqls :many
SELECT id, sql FROM _sqls_;

-- name: DeleteSql :exec
DELETE FROM _sqls_ WHERE id = ?;

-- name: UpdateSql :exec
UPDATE _sqls_
SET sql = ?
WHERE id = ?;


-- name: ListSecurities :many
SELECT id, table_name, create_where, delete_where, update_where, view_where FROM _security_;

-- name: CreateSecurity :exec
INSERT INTO _security_ (table_name, create_where, delete_where, update_where, view_where)
VALUES (?, ?, ?, ?, ?);

-- name: DeleteSecurity :exec
DELETE FROM _security_ WHERE table_name = ?;

-- name: UpdateSecurity :exec
UPDATE _security_
SET create_where = ?, delete_where = ?, update_where = ?, view_where = ?
WHERE table_name = ?;

-- name: GetSecurityByTable :one
SELECT id, table_name, create_where, delete_where, update_where, view_where
FROM _security_
WHERE table_name = ?;

-- name: CreateLog :exec
INSERT INTO _log_ (log_text) VALUES (?);

-- name: ListLogs :many
SELECT id, log_text, created_at FROM _log_ ORDER BY id DESC LIMIT ? OFFSET ?;

-- name: CountLogs :one
SELECT COUNT(*) FROM _log_;

-- name: SearchLogs :many
SELECT id, log_text, created_at FROM _log_ 
WHERE log_text LIKE ? 
ORDER BY id DESC 
LIMIT ? OFFSET ?;

-- name: CountSearchLogs :one
SELECT COUNT(*) FROM _log_ 
WHERE log_text LIKE ?;

-- name: CreateNotification :one
INSERT INTO notifications (
    sender_id, receiver_id, project_id, notification_content, notification_status,
    create_at, update_at
) VALUES (
    ?, ?, ?, ?, ?,
    datetime('now'), datetime('now')
)
RETURNING *;

-- name: GetNotificationByID :one
SELECT * FROM notifications WHERE notification_id = ? LIMIT 1;

-- name: GetNotificationsBySender :many
SELECT * FROM notifications WHERE sender_id = ? ORDER BY create_at DESC;

-- name: GetNotificationsByReceiver :many
SELECT * FROM notifications WHERE receiver_id = ? ORDER BY create_at DESC;

-- name: GetNotificationsBySenderAndStatus :many
SELECT * FROM notifications WHERE sender_id = ? AND notification_status = ? ORDER BY create_at DESC;

-- name: GetNotificationsByReceiverAndStatus :many
SELECT * FROM notifications WHERE receiver_id = ? AND notification_status = ? ORDER BY create_at DESC;

-- name: UpdateNotificationStatus :exec
UPDATE notifications
SET notification_status = ?, update_at = datetime('now')
WHERE notification_id = ?;

-- name: CheckNotificationPermission :one
SELECT COUNT(*) FROM notifications 
WHERE notification_id = ? AND receiver_id = ? AND notification_status = 'pending';

-- name: CheckDuplicateNotification :one
SELECT COUNT(*) FROM notifications 
WHERE sender_id = ? AND receiver_id = ? AND project_id = ? 
AND notification_status IN ('pending', 'agree');

-- name: GetTeamPermission :one
SELECT notification_content, notification_status FROM notifications 
WHERE sender_id = ? AND receiver_id = ? AND project_id = ? 
AND notification_status = 'agree'
LIMIT 1;

-- name: CreateQuery :one
INSERT INTO _query_ (queries, create_at, update_at)
VALUES (?, datetime('now'), datetime('now'))
RETURNING *;

-- name: GetQueryByID :one
SELECT * FROM _query_ WHERE id = ? LIMIT 1;

-- name: ListQueries :many
SELECT * FROM _query_ ORDER BY id DESC LIMIT ? OFFSET ?;

-- name: CountQueries :one
SELECT COUNT(*) FROM _query_;

-- name: UpdateQuery :exec
UPDATE _query_
SET queries = ?, update_at = datetime('now')
WHERE id = ?;

-- name: DeleteQuery :exec
DELETE FROM _query_ WHERE id = ?;

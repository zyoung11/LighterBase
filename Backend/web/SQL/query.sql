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
    project_size = COALESCE(?, project_size),
    update_at = datetime('now')
WHERE project_id = ?
RETURNING *;

-- name: DeleteProject :exec
DELETE FROM projects WHERE project_id = ?;

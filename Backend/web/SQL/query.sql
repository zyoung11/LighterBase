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


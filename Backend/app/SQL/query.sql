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

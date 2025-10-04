-- name: CreateSecurity :exec
INSERT INTO _security_ (table_name, create_where, delete_where, update_where, view_where)
VALUES (?, ?, ?, ?, ?);

-- name: ListSecurities :many
SELECT id, table_name, create_where, delete_where, update_where, view_where FROM _security_;

-- name: DeleteSecurity :exec
DELETE FROM _security_ WHERE id = ?;

-- name: UpdateSecurity :exec
UPDATE _security_
SET
  table_name = ?,
  create_where = ?,
  delete_where = ?,
  update_where = ?,
  view_where = ?
WHERE id = ?;

-- name: CreateSql :exec
INSERT INTO _sqls_ (sql) VALUES (?);

-- name: ListSqls :many
SELECT id, sql FROM _sqls_;

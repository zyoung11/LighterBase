CREATE TABLE IF NOT EXISTS users (
	user_id INTEGER PRIMARY KEY AUTOINCREMENT,
	user_name TEXT NOT NULL UNIQUE,
	password_hash TEXT NOT NULL,
	email TEXT NOT NULL UNIQUE,
	user_avatar TEXT,
	create_at TEXT,
	update_at TEXT
);

CREATE TABLE IF NOT EXISTS projects (
    project_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    project_name TEXT NOT NULL,
    project_avatar TEXT,
    project_description TEXT,
    project_size INTEGER DEFAULT 0,
    create_at TEXT,
    update_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);









CREATE TABLE IF NOT EXISTS _security_ (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_name TEXT NOT NULL,
    create_where TEXT,
    delete_where TEXT,
    update_where TEXT,
    view_where TEXT
);

CREATE TABLE IF NOT EXISTS _sqls_ (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sql TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS _query_ (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    queries TEXT NOT NULL,
    create_at TEXT,
    update_at TEXT
);

CREATE TABLE IF NOT EXISTS _log_ (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    log_text TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

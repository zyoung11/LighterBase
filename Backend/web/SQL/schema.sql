CREATE TABLE IF NOT EXISTS users (
	user_id INTEGER PRIMARY KEY AUTOINCREMENT,
	user_name TEXT NOT NULL,
	password_hash TEXT NOT NULL,
	email TEXT NOT NULL UNIQUE,
	user_avatar TEXT,
	create_at TEXT,
	update_at TEXT
);

CREATE TABLE IF NOT EXISTS projects (
	pid INTEGER PRIMARY KEY AUTOINCREMENT,
	user_id INTEGER NOT NULL,
	project_name TEXT NOT NULL UNIQUE,
	project_avatar TEXT,
	project_description TEXT,
	create_at TEXT,
	update_at TEXT,
	FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX idx_projects_user_id ON projects(user_id);

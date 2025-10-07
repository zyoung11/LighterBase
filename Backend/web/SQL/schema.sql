CREATE TABLE IF NOT EXISTS users (
	user_id INTEGER PRIMARY KEY AUTOINCREMENT,
	user_name TEXT NOT NULL,
	password_hash TEXT NOT NULL,
	email TEXT NOT NULL UNIQUE,
	user_avatar TEXT,
	create_at TEXT,
	update_at TEXT
);

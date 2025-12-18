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

CREATE TABLE IF NOT EXISTS notifications (
    notification_id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER NOT NULL,
    receiver_id INTEGER NOT NULL,
    project_id INTEGER NOT NULL,
    notification_content TEXT NOT NULL,
    notification_status TEXT NOT NULL DEFAULT 'pending',
    create_at TEXT DEFAULT CURRENT_TIMESTAMP,
    update_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE
);

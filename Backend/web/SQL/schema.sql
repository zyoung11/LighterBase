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
    project_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    port INTEGER,
    project_name TEXT NOT NULL,
    project_avatar TEXT,
    project_description TEXT,
    project_size INTEGER DEFAULT 0,
    create_at TEXT,
    update_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TRIGGER IF NOT EXISTS assign_port_after_project_insert
AFTER INSERT ON projects
FOR EACH ROW
WHEN NEW.port IS NULL
BEGIN
    UPDATE projects 
    SET port = 9000 + NEW.project_id 
    WHERE project_id = NEW.project_id;
END;

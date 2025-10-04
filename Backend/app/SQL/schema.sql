-- 用户表
CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    login_name TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    gender TEXT,
    birth TEXT,
    phone TEXT,
    email TEXT,
    wechat TEXT,
    description TEXT,
    reg_date TEXT NOT NULL,
    last_modify TEXT NOT NULL,
    avatar_base64 TEXT,
    status TEXT DEFAULT 'active'
);

-- 文章类型表（用户私有）
CREATE TABLE IF NOT EXISTS categories (
    type_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type_name TEXT NOT NULL,
    article_count INTEGER DEFAULT 0,
    UNIQUE(user_id, type_name),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 文章表
CREATE TABLE IF NOT EXISTS articles (
    article_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    publish_date TEXT NOT NULL,
    last_modify TEXT NOT NULL,
    is_public BOOLEAN DEFAULT 1,
    cover_base64 TEXT,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (type_id) REFERENCES categories(type_id) ON DELETE RESTRICT
);

-- 触发器（当文章插入时增加分类计数）
CREATE TRIGGER IF NOT EXISTS update_category_count_insert
    AFTER INSERT ON articles
BEGIN
    UPDATE categories 
    SET article_count = article_count + 1 
    WHERE type_id = NEW.type_id;
END;

-- 触发器（当文章删除时减少分类计数）
CREATE TRIGGER IF NOT EXISTS update_category_count_delete
    AFTER DELETE ON articles
BEGIN
    UPDATE categories 
    SET article_count = article_count - 1 
    WHERE type_id = OLD.type_id;
END;

-- 评论表
CREATE TABLE IF NOT EXISTS comments (
    comment_id INTEGER PRIMARY KEY AUTOINCREMENT,
    article_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    parent_id INTEGER DEFAULT 0,
    content TEXT NOT NULL,
    create_time TEXT NOT NULL,
    disabled BOOLEAN DEFAULT 0,
    FOREIGN KEY (article_id) REFERENCES articles(article_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 登录日志
CREATE TABLE IF NOT EXISTS login_logs (
    log_id INTEGER PRIMARY KEY AUTOINCREMENT,
    login_name TEXT NOT NULL,
    ip TEXT,
    result TEXT NOT NULL,
    time TEXT NOT NULL
);

-- 操作日志
CREATE TABLE IF NOT EXISTS operation_logs (
    log_id INTEGER PRIMARY KEY AUTOINCREMENT,
    login_name TEXT NOT NULL,
    operation TEXT NOT NULL,
    target TEXT,
    time TEXT NOT NULL
);

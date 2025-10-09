CREATE TABLE _security_ (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_name TEXT NOT NULL,
    create_where TEXT,
    delete_where TEXT,
    update_where TEXT,
    view_where TEXT
);

CREATE TABLE _sqls_ (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sql TEXT NOT NULL
);

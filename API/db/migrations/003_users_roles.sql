CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'eis',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO users (username, password_hash, role) VALUES (
  'admin',
  '$2b$10$ViPXu90zZsElJjibiUatDu4l6KnqcLahqf.ZwGZHBGwuhgEuePLdK',
  'admin'
);

INSERT OR IGNORE INTO users (username, password_hash, role) VALUES (
  'sales',
  '$2b$10$icrSo.fiJSjTMtaCLSoPquiDez/q.hZ8Ep5IdgCJa4vj9ED7FsHvy',
  'crm'
);

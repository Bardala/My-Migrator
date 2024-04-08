CREATE TABLE IF NOT EXISTS schema_history (
  version INT NOT NULL PRIMARY KEY,
  file_name VARCHAR(255) NOT NULL UNIQUE,
  check_sum VARCHAR(255) NOT NULL,
  installed_by VARCHAR(255) NOT NULL,
  installed_in DATETIME DEFAULT CURRENT_TIMESTAMP,
  success BOOLEAN NOT NULL
);
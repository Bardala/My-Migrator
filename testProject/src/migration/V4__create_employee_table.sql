CREATE TABLE IF NOT EXISTS employee (
  employee_id INT PRIMARY KEY,
  user_id INT,
  salary DECIMAL(10, 2),
  department VARCHAR(50),
  FOREIGN KEY (user_id) REFERENCES test_user(id)
);
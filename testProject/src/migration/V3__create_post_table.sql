CREATE TABLE post (
  id INT PRIMARY KEY,
  content VARCHAR(300),
  authorId INT,
  FOREIGN KEY (authorId) REFERENCES test_user(id)
)
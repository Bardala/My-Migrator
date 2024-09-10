CREATE TABLE post (
  id INT PRIMARY KEY,
  content VARCHAR(300),
  authorId INT,
  PRIMARY KEY (id),
  FOREIGN KEY (authorId) REFERENCES test_user(id)
)
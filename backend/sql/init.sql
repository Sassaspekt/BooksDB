CREATE TABLE books (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    publication_date DATE NOT NULL,
    pages INT NOT NULL,
    CHECK (pages > 0)
);
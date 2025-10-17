CREATE TABLE `books` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `publication_date` date NOT NULL,
  `pages` int(11) NOT NULL CHECK (`pages` > 0),
  `author` varchar(255) NOT NULL,
  `rate` varchar(255) NOT NULL
);
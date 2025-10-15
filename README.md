# Projekt CRUD Książki

Prosty projekt CRUD do zarządzania encją "Książka" z backendem Node.js, bazą danych MySQL/MariaDB i minimalistycznym frontendem HTML/CSS. Interfejs użytkownika jest po polsku.

Wymagania
Node.js: Wersja 22
MySQL/MariaDB: Baza danych
Serwer WWW: Apache2, Nginx lub podobny (np. XAMPP do testów)

Utworzenie projektu
Projekt został stworzony przy użyciu XAMPP (dla MySQL) i Node.js.

Instrukcje instalacji
1. Sklonuj repozytorium

2. Skonfiguruj bazę danych
Zainstaluj MySQL/MariaDB (np. przez XAMPP).
Utwórz bazę danych book_db.
Zaimportuj plik SQL

3. Zaktualizuj dane połączenia w pliku backend/index.js:
const pool = mysql.createPool({
    connectionLimit: 10,
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'password',
    database: 'book_db'
});

4. Zainstaluj zależności backendu
cd backend
npm install

5. Uruchom backend:
node index.js

Backend działa na http://localhost:3000

6. Uruchom frontend:
Skonfiguruj serwer WWW (np. Apache2/Nginx lub XAMPP).
Skopiuj folder frontend do katalogu serwera (np. htdocs w XAMPP).

![preview](https://github.com/Sassaspekt/BooksDB/blob/main/preview.png?raw=true)

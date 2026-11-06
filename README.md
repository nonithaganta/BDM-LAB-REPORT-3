# Lab 3: REST API, query parameters, validation, debugging

**Name:** G. NONITHA  
**Registration number:** 252U1R6073  
**Class / Section:** 207-AIML-2B  
**Subject:** Backend Development Fundamentals · Year II Term II

**Live link:** Not deployed yet. Run locally using the instructions below. Deploy the Node.js service to Render, Railway, or the institution's cloud IDE and paste the public URL here before submission.

## Objective

Build a RESTful Books API with search, sorting, pagination, price-range filtering, request validation, correct HTTP status codes, and consistent JSON error messages.

## Technology

- Node.js 18 or later
- Express.js
- SQLite (`sqlite` + `sqlite3`)
- Parameterised SQL queries

## Project structure

```text
lab-03/
├── src/
│   ├── middleware/
│   │   ├── error-handler.js
│   │   └── not-found.js
│   ├── routes/
│   │   └── books.js
│   ├── app.js
│   ├── config.js
│   ├── db.js
│   └── server.js
├── tests/
│   └── postman-collection.json
├── screenshots/
├── data/                  # created automatically; database is ignored by Git
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## How to install and run

1. Install Node.js 18+.
2. Open a terminal in this `lab-03` folder.
3. Install dependencies:

   ```bash
   npm install
   ```

4. Create your local environment file by copying `.env.example` to `.env`. Update values if required. **Do not commit `.env`.**

   ```env
   PORT=3000
   DB_FILE=./data/books.db
   ```

5. Start the server:

   ```bash
   npm start
   ```

6. Open `http://localhost:3000`. The SQLite database and `books` table are created automatically on first run.

For development with automatic restart, run `npm run dev` after installing dependencies.

## Endpoints

Base URL: `http://localhost:3000`

| Method | Path | Description |
|---|---|---|
| GET | `/` | Check whether the API is running |
| GET | `/books` | List books with search, sort, price filter and pagination |
| GET | `/books/:id` | Get one book by ID |
| POST | `/books` | Create a book after validating the request body |
| PUT | `/books/:id` | Replace a book's title, author and price |
| DELETE | `/books/:id` | Delete a book by ID |

### GET /books query parameters

| Parameter | Default | Description |
|---|---:|---|
| `search_q` | empty | Partial, case-insensitive title search |
| `order_by` | `id` | Sort column: `id`, `title`, `author`, `price`, `created_at` |
| `order` | `ASC` | Sort direction: `ASC` or `DESC` |
| `limit` | `10` | Number of rows (maximum 100) |
| `offset` | `0` | Number of rows to skip |
| `min_price` | none | Minimum price, inclusive |
| `max_price` | none | Maximum price, inclusive |

Example:

```text
GET /books?search_q=harry&order_by=price&order=DESC&min_price=100&max_price=800&limit=5&offset=0
```

## Request examples

### Create a book

`POST /books` with header `Content-Type: application/json`:

```json
{
  "title": "The Alchemist",
  "author": "Paulo Coelho",
  "price": 299
}
```

### Update a book

`PUT /books/1`:

```json
{
  "title": "The Alchemist - Updated",
  "author": "Paulo Coelho",
  "price": 349
}
```

### Example error response

```json
{
  "message": "title is required and must be a non-empty string."
}
```

## Status codes

- `200 OK`: successful read, update, or delete
- `201 Created`: book created
- `400 Bad Request`: invalid input, query parameter, or ID format
- `404 Not Found`: requested book or route does not exist
- `500 Internal Server Error`: unexpected server-side failure

## Postman testing

Import `tests/postman-collection.json` into Postman. Set the collection variable `baseUrl` to `http://localhost:3000`. Run the requests in order where noted. The collection includes successful and failure scenarios for create, read, update, delete, search, sorting, filtering, and validation.

## Debugging notes

- **EADDRINUSE (port conflict):** another process is already using the configured port. Stop that process or set a different `PORT` in `.env`.
- **Wrong import path:** verify relative paths and filename casing. For example, `../db` from `src/routes/books.js` points to `src/db.js`.
- **No such table:** ensure the application calls and awaits `connectDatabase()` before accepting requests; the function creates the `books` table.
- **Missing `await`:** database operations are asynchronous. Await calls such as `db.get`, `db.all`, `db.run`, and `connectDatabase()` before using their results.

## Screenshots

The `screenshots/` folder is intentionally included for submission evidence. After running the API and importing the collection into Postman, save screenshots showing:
1. Successful `POST /books` response (`201`).
2. `GET /books` with search, sort and price filters (`200`).
3. Invalid POST body (`400`).
4. Missing book ID (`404`).
5. Successful update and delete (`200`).
6. SQLite `books` table containing the created records.

Add them to `screenshots/` and embed them here, for example:

```markdown
![Successful book creation](screenshots/post-create.png)
```

Screenshots and a public deployment URL are not fabricated or included because they must come from your own running environment.

## Viva preparation

**1. Query parameter vs path parameter:** A query parameter is used to filter or customise a collection request, for example `/books?search_q=alchemist`. A path parameter identifies a specific resource, for example `/books/5`.

**2. What does stateless mean?** Each HTTP request contains the information needed to process it. The server does not depend on stored client session state from a previous request.

**3. Status code for bad input vs missing record:** Use `400 Bad Request` for invalid client input and `404 Not Found` when the requested resource does not exist.

## Safety and code quality

- SQL values are passed through placeholders (`?`) instead of concatenating user input.
- Sort columns and sort direction are allow-listed before being added to SQL.
- `.env`, database files, and `node_modules` are excluded by `.gitignore`.
- Errors use a consistent JSON `{ "message": "..." }` shape.
- No credentials or real environment values are committed.

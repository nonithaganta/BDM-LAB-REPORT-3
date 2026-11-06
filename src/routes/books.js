const express = require("express");
const { connectDatabase } = require("../db");

const router = express.Router();

const SORTABLE_COLUMNS = new Set(["id", "title", "author", "price", "created_at"]);
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

function parseNonNegativeNumber(value) {
  if (value === undefined) return undefined;
  if (value.trim() === "") return NaN;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : NaN;
}

function parsePositiveInteger(value, fallback, maximum = Number.MAX_SAFE_INTEGER) {
  if (value === undefined) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > maximum) return NaN;
  return parsed;
}

// GET /books?search_q=&order_by=&order=&limit=&offset=&min_price=&max_price=
router.get("/", async (req, res, next) => {
  try {
    const searchQ = typeof req.query.search_q === "string" ? req.query.search_q.trim() : "";
    const orderBy = req.query.order_by || "id";
    const order = String(req.query.order || "ASC").toUpperCase();
    const limit = parsePositiveInteger(req.query.limit, DEFAULT_LIMIT, MAX_LIMIT);
    const offset = req.query.offset === undefined ? 0 : Number(req.query.offset);
    const minPrice = parseNonNegativeNumber(req.query.min_price);
    const maxPrice = parseNonNegativeNumber(req.query.max_price);

    if (!SORTABLE_COLUMNS.has(orderBy)) {
      return res.status(400).json({ message: "Invalid order_by. Allowed: id, title, author, price, created_at." });
    }
    if (!["ASC", "DESC"].includes(order)) {
      return res.status(400).json({ message: "Invalid order. Use ASC or DESC." });
    }
    if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
      return res.status(400).json({ message: `limit must be an integer between 1 and ${MAX_LIMIT}.` });
    }
    if (!Number.isInteger(offset) || offset < 0) {
      return res.status(400).json({ message: "offset must be a non-negative integer." });
    }
    if (Number.isNaN(minPrice) || Number.isNaN(maxPrice)) {
      return res.status(400).json({ message: "min_price and max_price must be non-negative numbers." });
    }
    if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
      return res.status(400).json({ message: "min_price cannot be greater than max_price." });
    }

    const conditions = [];
    const params = [];

    if (searchQ) {
      conditions.push("title LIKE ?");
      params.push(`%${searchQ}%`);
    }
    if (minPrice !== undefined) {
      conditions.push("price >= ?");
      params.push(minPrice);
    }
    if (maxPrice !== undefined) {
      conditions.push("price <= ?");
      params.push(maxPrice);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const db = await connectDatabase();

    // orderBy and order are allow-listed before interpolation; all user values stay parameterised.
    const books = await db.all(
      `SELECT id, title, author, price, created_at, updated_at
       FROM books ${whereClause}
       ORDER BY ${orderBy} ${order}
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    const countRow = await db.get(
      `SELECT COUNT(*) AS total FROM books ${whereClause}`,
      params
    );

    return res.status(200).json({
      data: books,
      pagination: { total: countRow.total, limit, offset }
    });
  } catch (error) {
    return next(error);
  }
});

// GET /books/:id
router.get("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ message: "Book id must be a positive integer." });
    }

    const db = await connectDatabase();
    const book = await db.get(
      "SELECT id, title, author, price, created_at, updated_at FROM books WHERE id = ?",
      [id]
    );

    if (!book) return res.status(404).json({ message: "Book not found." });
    return res.status(200).json({ data: book });
  } catch (error) {
    return next(error);
  }
});

// POST /books
router.post("/", async (req, res, next) => {
  try {
    const { title, author, price } = req.body || {};

    if (typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ message: "title is required and must be a non-empty string." });
    }
    if (typeof author !== "string" || !author.trim()) {
      return res.status(400).json({ message: "author is required and must be a non-empty string." });
    }
    if (price === undefined || price === null || price === "" || !Number.isFinite(Number(price))) {
      return res.status(400).json({ message: "price is required and must be a number." });
    }
    const numericPrice = Number(price);
    if (numericPrice < 0) {
      return res.status(400).json({ message: "price must be greater than or equal to 0." });
    }

    const db = await connectDatabase();
    const result = await db.run(
      "INSERT INTO books (title, author, price) VALUES (?, ?, ?)",
      [title.trim(), author.trim(), numericPrice]
    );
    const createdBook = await db.get("SELECT * FROM books WHERE id = ?", [result.lastID]);

    return res.status(201).json({
      message: "Book created successfully.",
      data: createdBook
    });
  } catch (error) {
    return next(error);
  }
});

// PUT /books/:id
router.put("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ message: "Book id must be a positive integer." });
    }

    const { title, author, price } = req.body || {};
    if (typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ message: "title is required and must be a non-empty string." });
    }
    if (typeof author !== "string" || !author.trim()) {
      return res.status(400).json({ message: "author is required and must be a non-empty string." });
    }
    if (price === undefined || price === null || price === "" || !Number.isFinite(Number(price))) {
      return res.status(400).json({ message: "price is required and must be a number." });
    }
    const numericPrice = Number(price);
    if (numericPrice < 0) {
      return res.status(400).json({ message: "price must be greater than or equal to 0." });
    }

    const db = await connectDatabase();
    const result = await db.run(
      `UPDATE books
       SET title = ?, author = ?, price = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [title.trim(), author.trim(), numericPrice, id]
    );

    if (result.changes === 0) return res.status(404).json({ message: "Book not found." });

    const updatedBook = await db.get("SELECT * FROM books WHERE id = ?", [id]);
    return res.status(200).json({
      message: "Book updated successfully.",
      data: updatedBook
    });
  } catch (error) {
    return next(error);
  }
});

// DELETE /books/:id
router.delete("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ message: "Book id must be a positive integer." });
    }

    const db = await connectDatabase();
    const result = await db.run("DELETE FROM books WHERE id = ?", [id]);

    if (result.changes === 0) return res.status(404).json({ message: "Book not found." });
    return res.status(200).json({ message: "Book deleted successfully." });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
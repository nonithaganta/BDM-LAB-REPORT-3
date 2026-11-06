const express = require("express");
const booksRouter = require("./routes/books");
const notFound = require("./middleware/not-found");
const errorHandler = require("./middleware/error-handler");

const app = express();

app.use(express.json());
app.get("/", (req, res) => {
  res.status(200).json({
    message: "BDF Lab 03 Books API is running.",
    endpoints: { books: "/books" }
  });
});
app.use("/books", booksRouter);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
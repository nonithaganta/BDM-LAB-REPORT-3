require("dotenv").config();

module.exports = {
  port: Number(process.env.PORT) || 3000,
  databaseFile: process.env.DB_FILE || "./data/books.db"
};
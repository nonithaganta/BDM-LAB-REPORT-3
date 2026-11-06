const app = require("./app");
const { connectDatabase } = require("./db");
const { port } = require("./config");

async function startServer() {
  try {
    await connectDatabase();
    app.listen(port, () => {
      console.log(`Books API listening on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
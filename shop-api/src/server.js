require("dotenv").config();
const express = require("express");
const pool = require("./db");
const authRoutes = require("./routes/auth.routes");
const productRoutes = require("./routes/product.routes");

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Shop API работает" });
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);

// Обработка 404
app.use((req, res) => {
  res.status(404).json({ message: "Маршрут не найден" });
});

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET отсутствует в env");
    }
    await pool.query("SELECT 1");
    console.log("PostgreSQL подключён");

    app.listen(PORT, () => {
      console.log(`Сервер: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Ошибка запуска:", error.message);
    process.exit(1);
  }
}

startServer();
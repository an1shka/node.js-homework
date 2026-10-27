const express = require("express");
const pool = require("../db");
const { authMiddleware, requireRole } = require("../middleware/auth.middleware");

const router = express.Router();

function parseId(idValue) {
  const id = Number(idValue);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function validateProduct(body) {
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const price = Number(body.price);
  const stock = Number(body.stock);

  if (!title) {
    return { error: "Название товара обязательно" };
  }
  if (!Number.isFinite(price) || price < 0) {
    return { error: "Цена должна быть неотрицательным числом" };
  }
  if (!Number.isInteger(stock) || stock < 0) {
    return { error: "Количество должно быть целым неотрицательным числом" };
  }

  return { value: { title, description, price, stock } };
}

// GET /api/products — Получить все товары
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.id, p.title, p.description, p.price, p.stock, p.created_at, p.updated_at,
             u.name AS created_by_name
      FROM products AS p
      LEFT JOIN users AS u ON u.id = p.created_by
      ORDER BY p.id DESC
    `);

    return res.status(200).json({
      count: result.rows.length,
      products: result.rows,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Внутренняя ошибка сервера" });
  }
});

// GET /api/products/:id — Получить один товар
router.get("/:id", async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "Некорректный ID товара" });
    }

    const result = await pool.query(`
      SELECT p.id, p.title, p.description, p.price, p.stock, p.created_at, p.updated_at,
             u.name AS created_by_name
      FROM products AS p
      LEFT JOIN users AS u ON u.id = p.created_by
      WHERE p.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Товар не найден" });
    }

    return res.status(200).json({ product: result.rows[0] });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Внутренняя ошибка сервера" });
  }
});

// POST /api/products — Создать товар (только admin)
router.post("/", authMiddleware, requireRole("admin"), async (req, res) => {
  try {
    const validation = validateProduct(req.body);
    if (validation.error) {
      return res.status(400).json({ message: validation.error });
    }

    const { title, description, price, stock } = validation.value;
    const result = await pool.query(`
      INSERT INTO products (title, description, price, stock, created_by)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [title, description, price, stock, req.user.userId]);

    return res.status(201).json({
      message: "Товар успешно создан",
      product: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Внутренняя ошибка сервера" });
  }
});

// PUT /api/products/:id — Обновить товар (только admin)
router.put("/:id", authMiddleware, requireRole("admin"), async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "Некорректный ID товара" });
    }

    const validation = validateProduct(req.body);
    if (validation.error) {
      return res.status(400).json({ message: validation.error });
    }

    const { title, description, price, stock } = validation.value;
    const result = await pool.query(`
      UPDATE products
      SET title = $1, description = $2, price = $3, stock = $4, updated_at = NOW()
      WHERE id = $5
      RETURNING *
    `, [title, description, price, stock, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Товар не найден" });
    }

    return res.status(200).json({
      message: "Товар успешно обновлён",
      product: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Внутренняя ошибка сервера" });
  }
});

// DELETE /api/products/:id — Удалить товар (только admin)
router.delete("/:id", authMiddleware, requireRole("admin"), async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "Некорректный ID товара" });
    }

    const result = await pool.query(`
      DELETE FROM products WHERE id = $1 RETURNING id, title
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Товар не найден" });
    }

    return res.status(200).json({
      message: "Товар успешно удалён",
      product: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Внутренняя ошибка сервера" });
  }
});

module.exports = router;
import http from "node:http";
import path from "node:path";
import fs from "node:fs/promises";
import { readData, writeData } from "./storage.js";

const PORT = 3000;
const tasksFilePath = path.join(import.meta.dirname, "data", "tasks.json");
const logsFilePath = path.join(import.meta.dirname, "data", "logs.txt");

// Функция отправки JSON-ответов[cite: 29]
function sendJson(res, statusCode, data) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(data));
}

// Функция чтения тела POST-запроса[cite: 30]
function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

// Функция логирования запросов в файл logs.txt[cite: 37]
async function writeLog(method, url) {
  const time = new Date().toLocaleString();
  const line = `[${time}] ${method} ${url}\n`;
  await fs.mkdir(path.join(import.meta.dirname, "data"), { recursive: true });
  await fs.appendFile(logsFilePath, line, "utf-8");
}

const server = http.createServer(async (req, res) => {
  try {
    // Логируем каждый запрос[cite: 37]
    console.log(`${req.method} ${req.url}`);
    await writeLog(req.method, req.url);

    // GET / — Информация об API[cite: 36]
    if (req.method === "GET" && req.url === "/") {
      return sendJson(res, 200, {
        success: true,
        message: "Добро пожаловать в Tasks File API",
      });
    }

    // GET /tasks — Все задачи[cite: 36]
    if (req.method === "GET" && req.url === "/tasks") {
      const tasks = await readData(tasksFilePath);
      return sendJson(res, 200, {
        success: true,
        count: tasks.length,
        data: tasks,
      });
    }

    // Бонус: GET /tasks/completed — Выполненные задачи[cite: 37]
    if (req.method === "GET" && req.url === "/tasks/completed") {
      const tasks = await readData(tasksFilePath);
      const completedTasks = tasks.filter((t) => t.completed);
      return sendJson(res, 200, {
        success: true,
        count: completedTasks.length,
        data: completedTasks,
      });
    }

    // Бонус: GET /tasks/pending — Невыполненные задачи[cite: 37]
    if (req.method === "GET" && req.url === "/tasks/pending") {
      const tasks = await readData(tasksFilePath);
      const pendingTasks = tasks.filter((t) => !t.completed);
      return sendJson(res, 200, {
        success: true,
        count: pendingTasks.length,
        data: pendingTasks,
      });
    }

    // Бонус: GET /stats — Статистика[cite: 37]
    if (req.method === "GET" && req.url === "/stats") {
      const tasks = await readData(tasksFilePath);
      const completedCount = tasks.filter((t) => t.completed).length;
      const pendingCount = tasks.length - completedCount;
      return sendJson(res, 200, {
        success: true,
        data: {
          total: tasks.length,
          completed: completedCount,
          pending: pendingCount,
        },
      });
    }

    // GET /tasks/:id — Одна задача по ID[cite: 30, 36]
    if (req.method === "GET" && req.url.startsWith("/tasks/")) {
      const id = Number(req.url.split("/")[2]);
      if (Number.isNaN(id)) {
        return sendJson(res, 400, { success: false, message: "Некорректный ID задачи" });
      }

      const tasks = await readData(tasksFilePath);
      const task = tasks.find((t) => t.id === id);

      if (!task) {
        return sendJson(res, 404, { success: false, message: "Задача не найдена" });
      }

      return sendJson(res, 200, { success: true, data: task });
    }

    // POST /tasks — Создание задачи[cite: 31, 37]
    if (req.method === "POST" && req.url === "/tasks") {
      const body = await readRequestBody(req);
      let data;

      try {
        data = JSON.parse(body);
      } catch {
        return sendJson(res, 400, { success: false, message: "Некорректный JSON" });
      }

      // Валидация поля title[cite: 37]
      if (typeof data.title !== "string" || data.title.trim() === "") {
        return sendJson(res, 400, {
          success: false,
          message: "Поле title обязательно и должно быть непустой строкой",
        });
      }

      const tasks = await readData(tasksFilePath);
      
      // Автоматическое определение ID (максимальный ID + 1)[cite: 32, 36]
      const newId = tasks.length === 0 ? 1 : Math.max(...tasks.map((t) => t.id)) + 1;

      const newTask = {
        id: newId,
        title: data.title.trim(),
        completed: false, // Установка completed в false по умолчанию[cite: 37]
      };

      tasks.push(newTask);
      await writeData(tasksFilePath, tasks);

      return sendJson(res, 201, {
        success: true,
        message: "Задача успешно создана",
        data: newTask,
      });
    }

    // Обработка неизвестных маршрутов (404)[cite: 34]
    return sendJson(res, 404, {
      success: false,
      message: "Маршрут не найден",
    });

  } catch (error) {
    console.error("Ошибка сервера:", error);
    return sendJson(res, 500, {
      success: false,
      message: "Внутренняя ошибка сервера",
    });
  }
});

server.listen(PORT, () => {
  console.log(`Сервер запущен: http://localhost:${PORT}`);
});
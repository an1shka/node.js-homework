import http from "node:http";

const movies = [
  { id: 1, title: "Интерстеллар", genre: "Фантастика", year: 2014, rating: 8.7 },
  { id: 2, title: "Начало", genre: "Фантастика", year: 2010, rating: 8.8 },
  { id: 3, title: "Тёмный рыцарь", genre: "Боевик", year: 2008, rating: 9.0 },
  { id: 4, title: "Матрица", genre: "Фантастика", year: 1999, rating: 8.7 },
  { id: 5, title: "Паразиты", genre: "Драма", year: 2019, rating: 8.5 },
];

const halls = [
  { id: 1, name: "Зал 1", seats: 120 },
  { id: 2, name: "Зал 2", seats: 80 },
  { id: 3, name: "VIP Зал", seats: 40 },
];

const schedule = [
  { id: 1, movieId: 1, hallId: 1, time: "14:00" },
  { id: 2, movieId: 2, hallId: 2, time: "17:30" },
  { id: 3, movieId: 3, hallId: 3, time: "21:00" },
];

function sendJson(res, statusCode, data) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(data));
}

const server = http.createServer((req, res) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);

  if (req.method === "GET" && req.url === "/") {
    return sendJson(res, 200, {
      success: true,
      message: "Добро пожаловать в API кинотеатра",
    });
  }

  if (req.method === "GET" && req.url === "/movies") {
    return sendJson(res, 200, {
      success: true,
      count: movies.length,
      data: movies,
    });
  }

  if (req.method === "GET" && req.url === "/halls") {
    return sendJson(res, 200, {
      success: true,
      count: halls.length,
      data: halls,
    });
  }

  if (req.method === "GET" && req.url === "/schedule") {
    return sendJson(res, 200, {
      success: true,
      count: schedule.length,
      data: schedule,
    });
  }

  if (req.method === "GET" && req.url === "/about") {
    return sendJson(res, 200, {
      success: true,
      message: "Учебный бэкенд-сервер кинотеатра на чистом Node.js",
    });
  }

  if (req.method === "GET" && req.url === "/stats") {
    const totalRating = movies.reduce((sum, movie) => sum + movie.rating, 0);
    const averageRating = Number((totalRating / movies.length).toFixed(1));

    return sendJson(res, 200, {
      success: true,
      data: {
        moviesCount: movies.length,
        hallsCount: halls.length,
        averageRating: averageRating,
      },
    });
  }

  return sendJson(res, 404, {
    success: false,
    message: "Маршрут не найден",
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Сервер запущен: http://localhost:${PORT}`);
});
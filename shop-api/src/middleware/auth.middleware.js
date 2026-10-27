const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "Токен не передан" });
  }

  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ message: "Неверный формат токена" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });
    req.user = payload;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Срок действия токена истёк" });
    }
    return res.status(401).json({ message: "Недействительный токен" });
  }
}

function requireRole(...allowedRoles) {
  return function roleMiddleware(req, res, next) {
    if (!req.user) {
      return res.status(401).json({ message: "Пользователь не авторизован" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Недостаточно прав" });
    }

    next();
  };
}

module.exports = {
  authMiddleware,
  requireRole,
};
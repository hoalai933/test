const jwt = require("jsonwebtoken");
const pool = require("../db");

module.exports = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const userId = decoded.id;

    const result = await pool.query(
      "SELECT * FROM access_tokens WHERE user_id = $1 AND token = $2",
      [userId, token]
    );

    const createdAt = new Date(result.rows[0].created_at);
    const now = new Date();
    const diffMs = now - createdAt;
    const diffMinutes = diffMs / 1000 / 60;

    if (diffMinutes > 1) {
      return res.status(403).json({ error: "Token đã hết hạn." });
    }

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: "Token không hợp lệ." });
  }
};

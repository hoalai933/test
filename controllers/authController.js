const bcrypt = require("bcrypt");
const pool = require("../db");
const TokenGenerator = require("../utils/TokenGenerator");

require("dotenv").config();

let refreshTokens = [];

const accessTokenGenerator = new TokenGenerator(
  process.env.ACCESS_TOKEN_SECRET,
  process.env.ACCESS_TOKEN_SECRET,
  { expiresIn: "1m" }
);

const refreshTokenGenerator = new TokenGenerator(
  process.env.REFRESH_TOKEN_SECRET,
  process.env.REFRESH_TOKEN_SECRET,
  { expiresIn: "7d" }
);

exports.register = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Username and password are required" });
  }

  try {
    const userExists = await pool.query(
      "SELECT * FROM users WHERE username = $1",
      [username]
    );
    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: "Username already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await pool.query(
      "INSERT INTO users (username, password_hash) VALUES ($1, $2)",
      [username, passwordHash]
    );

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Username and password are required" });
  }

  try {
    const result = await pool.query("SELECT * FROM users WHERE username = $1", [
      username,
    ]);

    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const payload = { id: user.id, username: user.username };
    const accessToken = accessTokenGenerator.sign(payload);
    const refreshToken = refreshTokenGenerator.sign(payload);

    await pool.query("DELETE FROM refresh_tokens WHERE user_id = $1", [
      user.id,
    ]);

    await pool.query(
      "INSERT INTO refresh_tokens (user_id, token) VALUES ($1, $2)",
      [user.id, refreshToken]
    );

    await pool.query("DELETE FROM access_tokens WHERE user_id = $1", [user.id]);

    await pool.query(
      "INSERT INTO access_tokens (user_id, token) VALUES ($1, $2)",
      [user.id, accessToken]
    );

    refreshTokens.push(refreshToken);

    res.json({ accessToken, refreshToken });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.token = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(401).json({ error: "Refresh token is required" });
  }

  try {
    const result = await pool.query(
      "SELECT * FROM refresh_tokens WHERE token = $1",
      [refreshToken]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Invalid refresh token" });
    }

    const decoded = refreshTokenGenerator.verify(refreshToken);

    const payload = { id: decoded.id, username: decoded.username };
    const newAccessToken = accessTokenGenerator.sign(payload);

    await pool.query("DELETE FROM access_tokens WHERE user_id = $1", [
      decoded.id,
    ]);

    await pool.query(
      "INSERT INTO access_tokens (user_id, token) VALUES ($1, $2)",
      [decoded.id, newAccessToken]
    );

    res.json({ accessToken: newAccessToken });
  } catch (err) {
    console.error(err);
    return res.status(403).json({ error: "Invalid refresh token" });
  }
};

exports.logout = async (req, res) => {
  //const { userId } = req.body;
  try {
    await pool.query("DELETE FROM refresh_tokens ");
    await pool.query("DELETE FROM access_tokens");
    res.json({ message: "Đăng xuất thành công!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

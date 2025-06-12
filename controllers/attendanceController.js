// attendanceController.js
const pool = require("../db");

exports.checkin = async (req, res) => {
  const userId = req.user.id;
  const ip = req.ip;
  const device = req.headers["user-agent"];

  try {
    await pool.query(
      `INSERT INTO attendance (user_id, ip_address, device_info)
      VALUES ($1, $2, $3)`,
      [userId, ip, device]
    );

    res.json({ message: "Điểm danh thành công!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi khi điểm danh." });
  }
};

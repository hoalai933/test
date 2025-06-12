const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const attendanceController = require("../controllers/attendanceController");
const authenticateToken = require("../middleware/authenticateToken");
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/token", authController.token);
router.post("/logout", authController.logout);

router.post("/checkin", authenticateToken, attendanceController.checkin);
module.exports = router;

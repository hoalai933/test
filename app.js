const express = require("express");
const morgan = require("morgan");
const app = express();
const port = 3000;
require("dotenv").config();

app.use(morgan("combined"));
app.use(express.json());
app.get("/home", (req, res) => {
  return res.send("Hello World!");
});
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

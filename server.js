const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));
app.use("/videos", express.static(path.join(__dirname, "videos")));

app.get("/ping", (req, res) => {
  res.json({ ok: true, pong: true });
});

app.get("/config", (req, res) => {
  res.json({
    ok: true,
    public_url: process.env.PUBLIC_URL || `http://localhost:${PORT}`,
    whatsapp_numero: process.env.WHATSAPP_NUMERO || ""
  });
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
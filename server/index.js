import express from "express";
import cors from "cors";

const app = express();
const port = 3000;

app.use(cors());

const data = new Array(1000).fill(1).map((_, i) => ({
  id: i + 1,
  name: `Item ${i + 1}`,
}));

app.get("/", (req, res) => {
  return res.json({ data });
});

app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
});

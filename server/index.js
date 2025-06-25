import express from "express";
import cors from "cors";

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const data = new Array(1000).fill(1).map((_, i) => ({
  id: i + 1,
  name: `Item ${i + 1}`,
}));

let selectedIds = new Set();
let sortedIds = []; 


app.post("/sort", (req, res) => {
  const newOrder = req.body.sorted;

  if (!Array.isArray(newOrder) || newOrder.some((id) => typeof id !== "number")) {
    return res.status(400).json({ error: "Invalid sort payload" });
  }

  sortedIds = newOrder;

  return res.json({ success: true, sorted: sortedIds });
});

app.post("/select", (req, res) => {
  const selected = req.body.selected;

  if (!Array.isArray(selected) || !selected.every((id) => typeof id === "number")) {
    return res.status(400).json({ error: "Invalid selection payload" });
  }

  selectedIds = new Set(selected);
  res.json({ success: true });
});

app.get("/items", (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const search = (req.query.search || "").toLowerCase();

  let filtered = data;

  if (search) {
    filtered = data.filter((item) =>
      item.name.toLowerCase().includes(search)
    );
  }

  if (sortedIds.length > 0 && !search) {
    const map = new Map(data.map((item) => [item.id, item]));
    const sortedData = sortedIds.map((id) => map.get(id)).filter(Boolean);
    const rest = data.filter((item) => !sortedIds.includes(item.id));
    filtered = [...sortedData, ...rest];
  }

  const start = (page - 1) * limit;
  const end = start + limit;
  const pageItems = filtered.slice(start, end);

  res.json({
    data: pageItems,
    page,
    hasMore: end < filtered.length,
    selected: Array.from(selectedIds),
  });
});

app.listen(port, () => {
  console.log(`Сервер работает: http://localhost:${port}`);
});

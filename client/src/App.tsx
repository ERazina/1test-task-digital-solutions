import { useState, useEffect, useCallback } from "react";
import { FixedSizeList as List, type ListOnScrollProps } from "react-window";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { api } from "./api";
import SortableItem from "./components/Sortable/Sortable";
import "./App.css";

export type Item = {
  id: number;
  name: string;
};

const ITEM_SIZE = 45;
const PAGE_LIMIT = 20;

function App() {
  const [data, setData] = useState<Item[]>([]);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");
  const [viewportHeight, setViewportHeight] = useState<number>(window.innerHeight);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const sensors = useSensors(
    useSensor(PointerSensor)
  );

  const toggleSelect = async (id: number) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      sendSelectedToServer(newSet);
      return newSet;
    });
  };

  const sendSelectedToServer = async (ids: Set<number>) => {
    try {
      await api.post("/select", { selected: Array.from(ids) });
    } catch (err) {
      console.error("Ошибка при отправке выбранных ID:", err);
    }
  };

  const sendSortToServer = async (ids: number[]) => {
    try {
      await api.post("/sort", { sorted: ids });
    } catch (err) {
      console.error("Ошибка при отправке сортировки:", err);
    }
  };

  const fetchData = useCallback(
    async (pageToLoad: number, searchQuery: string = "") => {
      if (loading || !hasMore) return;
      setLoading(true);
      try {
        const response = await api.get<{ data: Item[]; hasMore: boolean }>(
          `/items?page=${pageToLoad}&limit=${PAGE_LIMIT}&search=${encodeURIComponent(searchQuery)}`
        );
        const newItems = response.data.data;

        setData((prev) => {
          if (pageToLoad === 1) return newItems;
          const existingIds = new Set(prev.map((item) => item.id));
          const uniqueItems = newItems.filter((item) => !existingIds.has(item.id));
          return [...prev, ...uniqueItems];
        });

        setHasMore(response.data.hasMore);
        setPage(pageToLoad + 1);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    },
    [hasMore, loading]
  );

  useEffect(() => {
    const handleResize = () => setViewportHeight(window.innerHeight);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    fetchData(1, search);
  }, [fetchData, search]);

  useEffect(() => {
    const visibleItemCount = Math.ceil(viewportHeight / ITEM_SIZE);
    if (!initialLoadDone && data.length < visibleItemCount && hasMore && !loading) {
      fetchData(page, search);
    } else {
      setInitialLoadDone(true);
    }
  }, [viewportHeight, data.length, hasMore, loading, initialLoadDone, page, search, fetchData]);

  const handleScroll = ({ scrollOffset }: ListOnScrollProps) => {
    const buffer = 100;
    const totalHeight = data.length * ITEM_SIZE;
    if (
      scrollOffset + viewportHeight + buffer >= totalHeight &&
      hasMore &&
      !loading
    ) {
      fetchData(page, search);
    }
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = data.findIndex((item) => item.id === active.id);
      const newIndex = data.findIndex((item) => item.id === over.id);
      const newData = arrayMove(data, oldIndex, newIndex);
      setData(newData);
      sendSortToServer(newData.map((item) => item.id));
    }
  };

  return (
    <div className="list" style={{ height: viewportHeight }}>
      <input
        type="text"
        placeholder="Поиск..."
        value={search}
        onChange={(e) => {
          setPage(1);
          setData([]);
          setHasMore(true);
          setInitialLoadDone(false);
          setSearch(e.target.value);
        }}
        style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
      />
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={data.map((item) => item.id)} strategy={verticalListSortingStrategy}>
          <List
            height={viewportHeight}
            itemCount={data.length}
            itemSize={ITEM_SIZE}
            width={"100%"}
            itemKey={(index) => data[index].id}
            onScroll={handleScroll}
          >
            {({ index, style }) => {
              const item = data[index];
              const isSelected = selectedIds.has(item.id);
              return (
                <div style={{ ...style, display: "flex", alignItems: "center", padding: "0 8px" }}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(item.id)}
                    style={{ marginRight: "8px" }}
                  />
                  <SortableItem id={item.id}>
                    <span>{item.id} — {item.name}</span>
                  </SortableItem>
                </div>
              );
            }}
          </List>
        </SortableContext>
      </DndContext>
    </div>
  );
}

export default App;

import { useState, useEffect } from "react";
import { api } from "./api";
import "./App.css";

export type Item = {
  id: number;
  name: string;
};

type DataResponse = {
  data: Item[];
};

function App() {
  const [data, setData] = useState<DataResponse>();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get("/", {
          headers: { "Cache-Control": "no-cache" },
        });
        setData(response.data);
        console.log(response.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="list">
      {data?.data?.length
        && data?.data.map((item) => (
            <div key={item.id}>
              {item.id}
            </div>
          ))
        }
    </div>
  );
}

export default App;

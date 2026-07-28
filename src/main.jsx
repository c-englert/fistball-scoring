import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter, Routes, Route } from "react-router-dom";
import MatchList from "./pages/MatchList.jsx";
import Sumula from "./pages/Sumula.jsx";
import { initStore } from "./store.js";
import "./styles.css";

initStore();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<MatchList />} />
        <Route path="/game/:id" element={<Sumula />} />
      </Routes>
    </HashRouter>
  </StrictMode>
);

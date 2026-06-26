import { useState } from "react";
import Estoque from "./Estoque.jsx";
import Producao from "./Producao.jsx";
import "./global.css";
import "./app.css";

export default function App() {
  const [page, setPage] = useState("estoque");
  return (
    <div>
      <nav className="nav">
        <div className="nav-inner">
          <div className="nav-logo">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--accent)" }}>
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
            </svg>
            CDC Fit
          </div>
          <div className="nav-links">
            <button className={`nav-btn ${page === "estoque"  ? "active" : ""}`} onClick={() => setPage("estoque")}>Estoque</button>
            <button className={`nav-btn ${page === "producao" ? "active" : ""}`} onClick={() => setPage("producao")}>Produção</button>
          </div>
        </div>
      </nav>
      {page === "estoque" ? <Estoque /> : <Producao />}
    </div>
  );
}

import { useState, useCallback, useMemo } from "react";
import { today, nowStr } from "./data.js";

const SK = "cdcfit:estoque:mp:v1";
const LK = "cdcfit:log:mp:v1";
const WA = "5511991185018";

const load = (key) => { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; } catch { return null; } };
const save = (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} };

const ITENS = [
  { id: "arroz",          nome: "Arroz parbolizado" },
  { id: "feijao",         nome: "Feijão carioca" },
  { id: "carne_moida",    nome: "Carne moída patinho" },
  { id: "pure_batata",    nome: "Purê de batata" },
  { id: "pure_cabotia",   nome: "Purê de cabotiá" },
  { id: "frango_base",    nome: "Frango base" },
  { id: "legumes_mix",    nome: "Mix de legumes refogados" },
  { id: "pernil",         nome: "Pernil cozido" },
  { id: "molho_tomate",   nome: "Molho de tomate assado" },
  { id: "molho_ap",       nome: "Molho branco de alho poró" },
  { id: "feijoada",       nome: "Feijoada magra" },
  { id: "couve",          nome: "Couve refogada" },
  { id: "farofa",         nome: "Farofa" },
  { id: "hamburguer",     nome: "Hambúrguer patinho" },
  { id: "file_frango",    nome: "Filé de frango empanado" },
  { id: "kibe",           nome: "Kibe assado" },
  { id: "estrog_carne",   nome: "Estrogonofe de carne" },
  { id: "batata_rustica", nome: "Batata rústica assada" },
  { id: "picadinho",      nome: "Picadinho c/ batata e cenoura" },
  { id: "frango_desf",    nome: "Frango desfiado refogado" },
  { id: "brocolis",       nome: "Brócolis refogado" },
  { id: "creme_milho",    nome: "Creme de milho" },
  { id: "sobrecoxa",      nome: "Sobrecoxa assada" },
  { id: "panqueca_d",     nome: "Massa de panqueca" },
  { id: "couve_flor",     nome: "Couve-flor gratinada" },
  { id: "penne_broc",     nome: "Penne c/ brócolis" },
  { id: "salmao",         nome: "Salmão desfiado assado" },
  { id: "batata_grat",    nome: "Batata rústica gratinada" },
  { id: "arroz_broc",     nome: "Arroz com brócolis" },
  { id: "lasanha",        nome: "Lasanha" },
  { id: "caldo_verde",    nome: "Caldo verde" },
  { id: "caldo_vit",      nome: "Caldo Vitality cabotiá c/ frango" },
  { id: "caldo_mand",     nome: "Caldo de mandioquinha c/ carne seca" },
  { id: "torta",          nome: "Torta de frango de aveia" },
  { id: "mussarela",      nome: "Mussarela ralada" },
  { id: "tomate_fresco",  nome: "Tomate picado fresco" },
];

export default function Estoque() {
  const [stock,  setStock]  = useState(() => load(SK) || {});
  const [log,    setLog]    = useState(() => load(LK) || []);
  const [qtys,   setQtys]   = useState({});
  const [compra, setCompra] = useState({});
  const [tab,    setTab]    = useState("estoque");
  const [flash,  setFlash]  = useState({});
  const [busca,  setBusca]  = useState("");

  // ── Movimentação ──────────────────────────────────────────────────────────
  const move = useCallback((id, tipo) => {
    const qty = parseInt(qtys[id]) || 1;
    if (qty <= 0) return;
    setStock(prev => {
      const cur = prev[id] || 0;
      if (tipo === "saida" && cur < qty) return prev;
      const next = { ...prev, [id]: tipo === "entrada" ? cur + qty : cur - qty };
      save(SK, next);
      return next;
    });
    const item = ITENS.find(x => x.id === id);
    const entry = { id: Date.now(), itemId: id, nome: item.nome, tipo, qty, hora: nowStr(), data: today() };
    setLog(prev => { const next = [entry, ...prev].slice(0, 300); save(LK, next); return next; });
    setFlash(f => ({ ...f, [id]: tipo }));
    setTimeout(() => setFlash(f => { const n = { ...f }; delete n[id]; return n; }), 700);
    setQtys(q => ({ ...q, [id]: 1 }));
  }, [qtys]);

  // ── Métricas ──────────────────────────────────────────────────────────────
  const total      = Object.values(stock).reduce((a, b) => a + b, 0);
  const semEstoque = ITENS.filter(i => (stock[i.id] || 0) === 0).length;
  const hoje       = log.filter(l => l.data === today());
  const entHj      = hoje.filter(l => l.tipo === "entrada").reduce((a, l) => a + l.qty, 0);
  const saiHj      = hoje.filter(l => l.tipo === "saida").reduce((a, l) => a + l.qty, 0);

  // ── Lista de compras ───────────────────────────────────────────────────────
  const zerados = useMemo(() => ITENS.filter(i => (stock[i.id] || 0) === 0), [stock]);
  const baixos  = useMemo(() => ITENS.filter(i => { const s = stock[i.id] || 0; return s > 0 && s <= 3; }), [stock]);
  const alertas = zerados.length + baixos.length;

  const getQC = (id, def) => compra[id] !== undefined ? compra[id] : def;
  const setQC = (id, val) => setCompra(c => ({ ...c, [id]: Math.max(0, parseInt(val) || 0) }));

  const enviarWA = () => {
    const lZ = zerados.filter(i => getQC(i.id, 10) > 0)
      .map(i => `• ${i.nome} → *${getQC(i.id, 10)} un.*`);
    const lB = baixos.filter(i => getQC(i.id, 5) > 0)
      .map(i => `• ${i.nome} (estoque: ${stock[i.id]}) → *${getQC(i.id, 5)} un.*`);
    if (!lZ.length && !lB.length) return;
    let msg = `🛒 *Lista de Compras — CDC Fit*\n📅 ${today()}\n\n`;
    if (lZ.length) msg += `🔴 *SEM ESTOQUE*\n${lZ.join("\n")}\n\n`;
    if (lB.length) msg += `🟡 *ESTOQUE BAIXO (≤ 3)*\n${lB.join("\n")}`;
    window.open(`https://wa.me/${WA}?text=${encodeURIComponent(msg.trim())}`, "_blank");
  };

  const visivel = busca.trim()
    ? ITENS.filter(i => i.nome.toLowerCase().includes(busca.toLowerCase()))
    : ITENS;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="page">
      <div className="header">
        <div>
          <div className="brand">CDC FIT</div>
          <h1>Estoque de Matéria Prima</h1>
        </div>
      </div>

      <div className="metrics">
        {[
          { label: "Total em estoque", val: total },
          { label: "Entradas hoje",    val: entHj,  color: "var(--green)" },
          { label: "Saídas hoje",      val: saiHj,  color: "var(--red)" },
          { label: "Sem estoque",      val: semEstoque, color: semEstoque > 0 ? "var(--amber)" : undefined },
        ].map(m => (
          <div key={m.label} className="metric-card">
            <span className="metric-label">{m.label}</span>
            <span className="metric-val" style={{ color: m.color }}>{m.val}</span>
          </div>
        ))}
      </div>

      <div className="tabs">
        {[
          { key: "estoque",   label: "Estoque" },
          { key: "historico", label: `Histórico${log.length > 0 ? ` (${log.length})` : ""}` },
          { key: "compras",   label: "Lista de Compras", badge: alertas },
        ].map(t => (
          <button key={t.key} className={`tab ${tab === t.key ? "active" : ""}`} onClick={() => setTab(t.key)}>
            {t.label}
            {t.badge > 0 && <span className="tab-badge">{t.badge}</span>}
          </button>
        ))}
      </div>

      {/* ── ABA: ESTOQUE ── */}
      {tab === "estoque" && (
        <>
          <input
            type="text"
            placeholder="Buscar ingrediente..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", fontFamily: "inherit", fontSize: 13, marginBottom: 12, outline: "none" }}
          />
          <div className="item-list">
            {visivel.map(item => {
              const qty = qtys[item.id] ?? 1;
              const cur = stock[item.id] || 0;
              const fl  = flash[item.id];
              return (
                <div key={item.id} className={`item-row ${fl === "entrada" ? "entrada" : fl === "saida" ? "saida" : ""}`}>
                  <div className="item-info">
                    <div className="item-nome">{item.nome}</div>
                  </div>
                  <div className="item-stock" style={{ color: cur === 0 ? "var(--red)" : cur <= 3 ? "var(--amber)" : "var(--text)" }}>
                    {cur}
                  </div>
                  <div className="qty-controls">
                    <button className="qty-btn" onClick={() => setQtys(q => ({ ...q, [item.id]: Math.max(1, (parseInt(q[item.id]) || 1) - 1) }))}>−</button>
                    <input type="number" min="1" value={qty} onChange={e => setQtys(q => ({ ...q, [item.id]: Math.max(1, parseInt(e.target.value) || 1) }))} className="qty-input" />
                    <button className="qty-btn" onClick={() => setQtys(q => ({ ...q, [item.id]: (parseInt(q[item.id]) || 1) + 1 }))}>+</button>
                  </div>
                  <button className="btn-entrada" onClick={() => move(item.id, "entrada")}>↓ Entrada</button>
                  <button className="btn-saida"   onClick={() => move(item.id, "saida")} disabled={cur <= 0}>↑ Saída</button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── ABA: HISTÓRICO ── */}
      {tab === "historico" && (
        <div>
          <div className="log-header">
            <span>Movimentações registradas</span>
            {log.length > 0 && (
              <button className="btn-danger-ghost" onClick={() => { setLog([]); localStorage.removeItem(LK); }}>
                Limpar histórico
              </button>
            )}
          </div>
          {log.length === 0
            ? <p className="empty">Nenhuma movimentação registrada.</p>
            : log.map(l => (
                <div key={l.id} className="log-row">
                  <span className={`log-badge ${l.tipo}`}>{l.tipo === "entrada" ? "↓ entrada" : "↑ saída"}</span>
                  <span className="log-nome">{l.nome}</span>
                  <span className="log-qty">×{l.qty}</span>
                  <span className="log-hora">{l.data !== today() ? l.data : l.hora}</span>
                </div>
              ))
          }
        </div>
      )}

      {/* ── ABA: LISTA DE COMPRAS ── */}
      {tab === "compras" && (
        <div>
          {zerados.length === 0 && baixos.length === 0 ? (
            <div className="empty-state">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.3, marginBottom: 12 }}>
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Estoque OK — nenhum item zerado ou abaixo de 3
            </div>
          ) : (
            <>
              {zerados.length > 0 && (
                <div className="compra-section">
                  <div className="compra-section-title compra-red">
                    🔴 Sem estoque — {zerados.length} {zerados.length === 1 ? "item" : "itens"}
                  </div>
                  {zerados.map(item => {
                    const qtd = getQC(item.id, 10);
                    return (
                      <div key={item.id} className="compra-row">
                        <div className="item-info"><div className="item-nome">{item.nome}</div></div>
                        <div className="compra-stock compra-red-text">0</div>
                        <div className="qty-controls">
                          <button className="qty-btn" onClick={() => setQC(item.id, qtd - 1)}>−</button>
                          <input type="number" min="0" value={qtd} onChange={e => setQC(item.id, e.target.value)} className="qty-input" />
                          <button className="qty-btn" onClick={() => setQC(item.id, qtd + 1)}>+</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {baixos.length > 0 && (
                <div className="compra-section">
                  <div className="compra-section-title compra-amber">
                    🟡 Estoque baixo (≤ 3) — {baixos.length} {baixos.length === 1 ? "item" : "itens"}
                  </div>
                  {baixos.map(item => {
                    const cur = stock[item.id] || 0;
                    const qtd = getQC(item.id, 5);
                    return (
                      <div key={item.id} className="compra-row">
                        <div className="item-info"><div className="item-nome">{item.nome}</div></div>
                        <div className="compra-stock compra-amber-text">{cur}</div>
                        <div className="qty-controls">
                          <button className="qty-btn" onClick={() => setQC(item.id, qtd - 1)}>−</button>
                          <input type="number" min="0" value={qtd} onChange={e => setQC(item.id, e.target.value)} className="qty-input" />
                          <button className="qty-btn" onClick={() => setQC(item.id, qtd + 1)}>+</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <button className="btn-whatsapp" onClick={enviarWA}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Enviar lista para WhatsApp
              </button>
            </>
          )}
        </div>
      )}

      <p className="footer">Dados salvos localmente · CDC Fit Estoque MP v1.0</p>
    </div>
  );
}

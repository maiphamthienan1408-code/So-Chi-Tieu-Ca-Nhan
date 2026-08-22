import React, { useState, useEffect, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid,
} from "recharts";
import { Plus, TrendingUp, TrendingDown, Coins, Wallet, Trash2, X } from "lucide-react";

const COLORS = {
  bg: "#11161d",
  panel: "#171e27",
  panel2: "#1c242f",
  line: "#2a3441",
  ink: "#ECE7DA",
  inkDim: "#94A0AC",
  gold: "#C9A24B",
  goldDim: "#8A7638",
  expense: "#C1553D",
  income: "#4FA88B",
  invest: "#C9A24B",
  silver: "#9BA6B0",
};

const EXPENSE_CATS = ["Ăn uống", "Di chuyển", "Nhà ở", "Hóa đơn", "Mua sắm", "Giải trí", "Sức khỏe", "Giáo dục", "Khác"];
const INCOME_CATS = ["Lương", "Thưởng", "Freelance", "Kinh doanh", "Khác"];
const INVEST_CATS = ["Vàng", "Bạc", "Chứng chỉ quỹ", "Bất động sản", "Khác"];

const TYPE_META = {
  expense: { label: "Chi tiêu", color: COLORS.expense, cats: EXPENSE_CATS, sign: -1 },
  income: { label: "Thu nhập", color: COLORS.income, cats: INCOME_CATS, sign: 1 },
  invest: { label: "Đầu tư", color: COLORS.invest, cats: INVEST_CATS, sign: -1 },
};

function fmt(n) {
  return Math.round(n).toLocaleString("vi-VN") + " đ";
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function monthKey(d) {
  return d.slice(0, 7);
}

export default function App() {
  const [transactions, setTransactions] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [filter, setFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ type: "expense", category: EXPENSE_CATS[0], amount: "", note: "", date: todayStr() });
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("so-quy-transactions");
      if (raw) setTransactions(JSON.parse(raw));
    } catch (e) {
      // no data yet
    }
    setLoaded(true);
  }, []);

  const persist = (list) => {
    try {
      localStorage.setItem("so-quy-transactions", JSON.stringify(list));
    } catch (e) {
      setError("Không lưu được dữ liệu, thử lại sau.");
    }
  };

  const addTransaction = () => {
    const amt = parseFloat(form.amount);
    if (!amt || amt <= 0) {
      setError("Nhập số tiền hợp lệ.");
      return;
    }
    const t = { id: Date.now() + "-" + Math.random().toString(36).slice(2, 7), ...form, amount: amt };
    const next = [t, ...transactions];
    setTransactions(next);
    persist(next);
    setForm({ type: form.type, category: TYPE_META[form.type].cats[0], amount: "", note: "", date: todayStr() });
    setError("");
    setFormOpen(false);
  };

  const removeTransaction = (id) => {
    const next = transactions.filter((t) => t.id !== id);
    setTransactions(next);
    persist(next);
  };

  const totals = useMemo(() => {
    let income = 0, expense = 0, invest = 0;
    transactions.forEach((t) => {
      if (t.type === "income") income += t.amount;
      else if (t.type === "expense") expense += t.amount;
      else if (t.type === "invest") invest += t.amount;
    });
    return { income, expense, invest, balance: income - expense - invest };
  }, [transactions]);

  const filtered = useMemo(() => {
    if (filter === "all") return transactions;
    return transactions.filter((t) => t.type === filter);
  }, [transactions, filter]);

  const monthlyChart = useMemo(() => {
    const map = {};
    transactions.forEach((t) => {
      const k = monthKey(t.date || todayStr());
      if (!map[k]) map[k] = { month: k, income: 0, expense: 0, invest: 0 };
      map[k][t.type] += t.amount;
    });
    return Object.values(map).sort((a, b) => a.month.localeCompare(b.month)).slice(-6);
  }, [transactions]);

  const expenseByCat = useMemo(() => {
    const map = {};
    transactions.filter((t) => t.type === "expense").forEach((t) => {
      map[t.category] = (map[t.category] || 0) + t.amount;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [transactions]);

  const pieColors = ["#C1553D", "#C9A24B", "#4FA88B", "#7C8CB0", "#9BA6B0", "#8A7638", "#6B7280", "#B4794E", "#5D6B7A"];

  if (!loaded) {
    return (
      <div style={{ background: COLORS.bg, color: COLORS.inkDim, minHeight: "100vh" }} className="flex items-center justify-center font-mono text-sm">
        đang mở sổ quỹ…
      </div>
    );
  }

  return (
    <div style={{ background: COLORS.bg, color: COLORS.ink, minHeight: "100vh", fontFamily: "'IBM Plex Sans', 'Inter', sans-serif" }} className="pb-24">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
        .serif { font-family: 'Fraunces', serif; }
        .mono { font-family: 'IBM Plex Mono', monospace; }
        .leader { border-bottom: 1px dotted ${COLORS.line}; flex: 1; margin: 0 8px; height: 1px; align-self: center; }
        .row-enter { animation: fadeIn .25s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px);} to { opacity:1; transform: translateY(0);} }
        input, select { outline: none; }
        input::placeholder { color: ${COLORS.inkDim}; }
      `}</style>

      {/* Header */}
      <div className="px-5 pt-8 pb-5" style={{ borderBottom: `1px solid ${COLORS.line}` }}>
        <div className="flex items-baseline justify-between">
          <div>
            <div className="serif" style={{ fontSize: 28, fontWeight: 600, letterSpacing: "0.01em" }}>Sổ Quỹ</div>
            <div className="mono" style={{ fontSize: 12, color: COLORS.inkDim, marginTop: 2 }}>quản lý chi tiêu · thu nhập · đầu tư</div>
          </div>
          <Wallet size={22} color={COLORS.goldDim} />
        </div>
      </div>

      {/* Summary */}
      <div className="px-5 pt-5">
        <div className="rounded-xl p-5" style={{ background: COLORS.panel, border: `1px solid ${COLORS.line}` }}>
          <div className="mono" style={{ fontSize: 11, color: COLORS.inkDim, letterSpacing: "0.08em" }}>SỐ DƯ TIỀN MẶT</div>
          <div className="serif" style={{ fontSize: 34, fontWeight: 600, marginTop: 4, color: totals.balance < 0 ? COLORS.expense : COLORS.ink }}>
            {fmt(totals.balance)}
          </div>
          <div className="flex gap-4 mt-4 pt-4" style={{ borderTop: `1px dashed ${COLORS.line}` }}>
            <div className="flex-1">
              <div className="flex items-center gap-1" style={{ color: COLORS.income }}>
                <TrendingUp size={13} />
                <span className="mono" style={{ fontSize: 11 }}>THU</span>
              </div>
              <div className="mono" style={{ fontSize: 15, marginTop: 2 }}>{fmt(totals.income)}</div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1" style={{ color: COLORS.expense }}>
                <TrendingDown size={13} />
                <span className="mono" style={{ fontSize: 11 }}>CHI</span>
              </div>
              <div className="mono" style={{ fontSize: 15, marginTop: 2 }}>{fmt(totals.expense)}</div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1" style={{ color: COLORS.gold }}>
                <Coins size={13} />
                <span className="mono" style={{ fontSize: 11 }}>TÍCH LŨY</span>
              </div>
              <div className="mono" style={{ fontSize: 15, marginTop: 2 }}>{fmt(totals.invest)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      {transactions.length > 0 && (
        <div className="px-5 pt-4 grid grid-cols-1 gap-4">
          <div className="rounded-xl p-4" style={{ background: COLORS.panel, border: `1px solid ${COLORS.line}` }}>
            <div className="mono" style={{ fontSize: 11, color: COLORS.inkDim, letterSpacing: "0.08em", marginBottom: 8 }}>DÒNG TIỀN 6 THÁNG GẦN NHẤT</div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={monthlyChart}>
                <CartesianGrid stroke={COLORS.line} vertical={false} />
                <XAxis dataKey="month" tick={{ fill: COLORS.inkDim, fontSize: 10 }} axisLine={{ stroke: COLORS.line }} tickLine={false} />
                <YAxis tick={{ fill: COLORS.inkDim, fontSize: 10 }} axisLine={false} tickLine={false} width={36} tickFormatter={(v) => (v / 1000000).toFixed(0) + "tr"} />
                <Tooltip
                  contentStyle={{ background: COLORS.panel2, border: `1px solid ${COLORS.line}`, borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: COLORS.ink }}
                  formatter={(v) => fmt(v)}
                />
                <Bar dataKey="income" fill={COLORS.income} radius={[3, 3, 0, 0]} />
                <Bar dataKey="expense" fill={COLORS.expense} radius={[3, 3, 0, 0]} />
                <Bar dataKey="invest" fill={COLORS.gold} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {expenseByCat.length > 0 && (
            <div className="rounded-xl p-4" style={{ background: COLORS.panel, border: `1px solid ${COLORS.line}` }}>
              <div className="mono" style={{ fontSize: 11, color: COLORS.inkDim, letterSpacing: "0.08em", marginBottom: 8 }}>CHI TIÊU THEO DANH MỤC</div>
              <div className="flex items-center">
                <ResponsiveContainer width="45%" height={140}>
                  <PieChart>
                    <Pie data={expenseByCat} dataKey="value" innerRadius={35} outerRadius={60} paddingAngle={2}>
                      {expenseByCat.map((e, i) => <Cell key={e.name} fill={pieColors[i % pieColors.length]} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 flex flex-col gap-1.5">
                  {expenseByCat.slice(0, 6).map((e, i) => (
                    <div key={e.name} className="flex items-center gap-2">
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: pieColors[i % pieColors.length] }} />
                      <div className="mono" style={{ fontSize: 11, color: COLORS.inkDim, flex: 1 }}>{e.name}</div>
                      <div className="mono" style={{ fontSize: 11 }}>{fmt(e.value)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filter tabs */}
      <div className="px-5 pt-5 flex gap-2">
        {[["all", "Tất cả", COLORS.inkDim], ["expense", "Chi tiêu", COLORS.expense], ["income", "Thu nhập", COLORS.income], ["invest", "Đầu tư", COLORS.gold]].map(([key, label, color]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className="mono px-3 py-1.5 rounded-full"
            style={{
              fontSize: 12,
              border: `1px solid ${filter === key ? color : COLORS.line}`,
              background: filter === key ? color + "22" : "transparent",
              color: filter === key ? color : COLORS.inkDim,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Ledger list */}
      <div className="px-5 pt-3">
        {filtered.length === 0 ? (
          <div className="rounded-xl p-8 text-center mt-3" style={{ background: COLORS.panel, border: `1px dashed ${COLORS.line}`, color: COLORS.inkDim }}>
            <div className="mono" style={{ fontSize: 12 }}>Chưa có khoản nào. Bấm dấu + để ghi sổ.</div>
          </div>
        ) : (
          <div className="rounded-xl overflow-hidden mt-1" style={{ border: `1px solid ${COLORS.line}` }}>
            {filtered.map((t, idx) => {
              const meta = TYPE_META[t.type];
              return (
                <div
                  key={t.id}
                  className="row-enter flex items-center px-4 py-3 group"
                  style={{
                    background: idx % 2 === 0 ? COLORS.panel : COLORS.panel2,
                    borderBottom: idx === filtered.length - 1 ? "none" : `1px solid ${COLORS.line}`,
                  }}
                >
                  <div style={{ width: 3, height: 28, background: meta.color, borderRadius: 2, marginRight: 12 }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 500 }}>{t.category}</div>
                    <div className="mono" style={{ fontSize: 10.5, color: COLORS.inkDim, marginTop: 1 }}>
                      {t.date}{t.note ? " · " + t.note : ""}
                    </div>
                  </div>
                  <div className="leader" />
                  <div className="mono" style={{ fontSize: 14, color: meta.color, whiteSpace: "nowrap" }}>
                    {meta.sign > 0 ? "+" : "−"}{fmt(t.amount)}
                  </div>
                  <button onClick={() => removeTransaction(t.id)} className="ml-2 opacity-0 group-hover:opacity-100" style={{ color: COLORS.inkDim }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setFormOpen(true)}
        className="fixed rounded-full flex items-center justify-center shadow-lg"
        style={{ right: 20, bottom: 20, width: 52, height: 52, background: COLORS.gold, color: "#11161d" }}
      >
        <Plus size={24} />
      </button>

      {/* Add form modal */}
      {formOpen && (
        <div className="fixed inset-0 flex items-end justify-center z-50" style={{ background: "#00000099" }} onClick={() => setFormOpen(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full rounded-t-2xl p-5"
            style={{ maxWidth: 480, background: COLORS.panel, border: `1px solid ${COLORS.line}`, borderBottom: "none" }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="serif" style={{ fontSize: 18, fontWeight: 600 }}>Ghi khoản mới</div>
              <button onClick={() => setFormOpen(false)} style={{ color: COLORS.inkDim }}><X size={18} /></button>
            </div>

            <div className="flex gap-2 mb-4">
              {Object.entries(TYPE_META).map(([key, meta]) => (
                <button
                  key={key}
                  onClick={() => setForm((f) => ({ ...f, type: key, category: meta.cats[0] }))}
                  className="flex-1 py-2 rounded-lg mono"
                  style={{
                    fontSize: 12,
                    border: `1px solid ${form.type === key ? meta.color : COLORS.line}`,
                    background: form.type === key ? meta.color + "22" : "transparent",
                    color: form.type === key ? meta.color : COLORS.inkDim,
                  }}
                >
                  {meta.label}
                </button>
              ))}
            </div>

            <div className="mb-3">
              <div className="mono" style={{ fontSize: 10.5, color: COLORS.inkDim, marginBottom: 4 }}>SỐ TIỀN (VNĐ)</div>
              <input
                type="number"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                placeholder="0"
                className="w-full mono px-3 py-2.5 rounded-lg"
                style={{ background: COLORS.panel2, border: `1px solid ${COLORS.line}`, color: COLORS.ink, fontSize: 18 }}
              />
            </div>

            <div className="mb-3">
              <div className="mono" style={{ fontSize: 10.5, color: COLORS.inkDim, marginBottom: 4 }}>DANH MỤC</div>
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg"
                style={{ background: COLORS.panel2, border: `1px solid ${COLORS.line}`, color: COLORS.ink, fontSize: 13.5 }}
              >
                {TYPE_META[form.type].cats.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="flex gap-3 mb-3">
              <div className="flex-1">
                <div className="mono" style={{ fontSize: 10.5, color: COLORS.inkDim, marginBottom: 4 }}>NGÀY</div>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  className="w-full mono px-3 py-2.5 rounded-lg"
                  style={{ background: COLORS.panel2, border: `1px solid ${COLORS.line}`, color: COLORS.ink, fontSize: 13 }}
                />
              </div>
            </div>

            <div className="mb-4">
              <div className="mono" style={{ fontSize: 10.5, color: COLORS.inkDim, marginBottom: 4 }}>GHI CHÚ (không bắt buộc)</div>
              <input
                type="text"
                value={form.note}
                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                placeholder="ví dụ: mua vàng nhẫn trơn"
                className="w-full px-3 py-2.5 rounded-lg"
                style={{ background: COLORS.panel2, border: `1px solid ${COLORS.line}`, color: COLORS.ink, fontSize: 13.5 }}
              />
            </div>

            {error && <div className="mono mb-3" style={{ fontSize: 12, color: COLORS.expense }}>{error}</div>}

            <button
              onClick={addTransaction}
              className="w-full py-3 rounded-lg mono"
              style={{ background: COLORS.gold, color: "#11161d", fontSize: 14, fontWeight: 600 }}
            >
              Lưu vào sổ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

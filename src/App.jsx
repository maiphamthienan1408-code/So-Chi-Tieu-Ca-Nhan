import React, { useState, useEffect, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid,
} from "recharts";
import { Plus, TrendingUp, TrendingDown, Coins, Wallet, Trash2, X, CreditCard, LogOut, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";
import { auth, db } from "./firebase";
import {
  onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut,
} from "firebase/auth";
import {
  collection, doc, setDoc, deleteDoc, onSnapshot, query, orderBy,
} from "firebase/firestore";

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
  debt: "#B4794E",
  silver: "#9BA6B0",
};

const EXPENSE_CATS = ["Ăn uống", "Di chuyển", "Nhà ở", "Hóa đơn", "Mua sắm", "Giải trí", "Sức khỏe", "Giáo dục", "Mua mẫu (sản phẩm review)", "Chi phí sản xuất nội dung", "Trả lương", "Khác"];
const INCOME_CATS = ["Hoa hồng affiliate", "Phí UGC/Booking"];
const INVEST_CATS = ["Vàng", "Bạc", "Chứng chỉ quỹ", "Khác"];
const DEBT_CATS = ["Trả nợ thẻ tín dụng", "Trả góp nội thất", "Trả góp khác"];
const PAYMENT_METHODS = ["Tiền mặt", "Chuyển khoản", "Thẻ tín dụng"];
const CHANNELS = ["Bộ trưởng", "Bé ong", "Mèo mun", "Chocopie"];

const TYPE_META = {
  expense: { label: "Chi tiêu", color: COLORS.expense, cats: EXPENSE_CATS, sign: -1 },
  income: { label: "Thu nhập", color: COLORS.income, cats: INCOME_CATS, sign: 1 },
  invest: { label: "Đầu tư", color: COLORS.invest, cats: INVEST_CATS, sign: -1 },
  debt: { label: "Trả nợ/Góp", color: COLORS.debt, cats: DEBT_CATS, sign: -1 },
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

function LoginScreen() {
  const [mode, setMode] = useState("login"); // login | signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError("");
    if (!email || !password) {
      setError("Nhập đủ email và mật khẩu.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (e) {
      const map = {
        "auth/invalid-email": "Email không hợp lệ.",
        "auth/user-not-found": "Tài khoản không tồn tại, thử Đăng ký.",
        "auth/wrong-password": "Sai mật khẩu.",
        "auth/invalid-credential": "Sai email hoặc mật khẩu.",
        "auth/email-already-in-use": "Email này đã có tài khoản, thử Đăng nhập.",
        "auth/weak-password": "Mật khẩu cần ít nhất 6 ký tự.",
      };
      setError(map[e.code] || "Có lỗi xảy ra, thử lại.");
    }
    setBusy(false);
  };

  return (
    <div style={{ background: COLORS.bg, color: COLORS.ink, minHeight: "100vh", fontFamily: "'IBM Plex Sans', sans-serif" }} className="flex items-center justify-center px-5">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
        .serif { font-family: 'Fraunces', serif; }
        .mono { font-family: 'IBM Plex Mono', monospace; }
        input { outline: none; }
      `}</style>
      <div className="w-full rounded-xl p-6" style={{ maxWidth: 380, background: COLORS.panel, border: `1px solid ${COLORS.line}` }}>
        <div className="serif text-center" style={{ fontSize: 26, fontWeight: 600, marginBottom: 4 }}>Sổ Quỹ</div>
        <div className="mono text-center" style={{ fontSize: 11, color: COLORS.inkDim, marginBottom: 20 }}>
          {mode === "login" ? "Đăng nhập để đồng bộ dữ liệu" : "Tạo tài khoản mới"}
        </div>

        <div className="mb-3">
          <div className="mono" style={{ fontSize: 10.5, color: COLORS.inkDim, marginBottom: 4 }}>EMAIL</div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ban@vidu.com"
            className="w-full px-3 py-2.5 rounded-lg"
            style={{ background: COLORS.panel2, border: `1px solid ${COLORS.line}`, color: COLORS.ink, fontSize: 14 }}
          />
        </div>

        <div className="mb-4">
          <div className="mono" style={{ fontSize: 10.5, color: COLORS.inkDim, marginBottom: 4 }}>MẬT KHẨU</div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="ít nhất 6 ký tự"
            className="w-full px-3 py-2.5 rounded-lg"
            style={{ background: COLORS.panel2, border: `1px solid ${COLORS.line}`, color: COLORS.ink, fontSize: 14 }}
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
        </div>

        {error && <div className="mono mb-3" style={{ fontSize: 12, color: COLORS.expense }}>{error}</div>}

        <button
          onClick={submit}
          disabled={busy}
          className="w-full py-3 rounded-lg mono"
          style={{ background: COLORS.gold, color: "#11161d", fontSize: 14, fontWeight: 600, opacity: busy ? 0.6 : 1 }}
        >
          {busy ? "Đang xử lý..." : mode === "login" ? "Đăng nhập" : "Đăng ký"}
        </button>

        <div className="text-center mt-4 mono" style={{ fontSize: 12, color: COLORS.inkDim }}>
          {mode === "login" ? "Chưa có tài khoản? " : "Đã có tài khoản? "}
          <span
            onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}
            style={{ color: COLORS.gold, cursor: "pointer" }}
          >
            {mode === "login" ? "Đăng ký" : "Đăng nhập"}
          </span>
        </div>
      </div>
    </div>
  );
}

function MainApp({ user }) {
  const [transactions, setTransactions] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [filter, setFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [chartOpen, setChartOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(todayStr().slice(0, 7));
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [form, setForm] = useState({
    type: "expense",
    category: EXPENSE_CATS[0],
    amount: "",
    note: "",
    date: todayStr(),
    payment: PAYMENT_METHODS[0],
    channel: CHANNELS[0],
  });
  const [error, setError] = useState("");

  useEffect(() => {
    const q = query(collection(db, "users", user.uid, "transactions"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setTransactions(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoaded(true);
    }, () => setLoaded(true));
    return () => unsub();
  }, [user.uid]);

  const addTransaction = async () => {
    const amt = parseFloat(form.amount);
    if (!amt || amt <= 0) {
      setError("Nhập số tiền hợp lệ.");
      return;
    }
    const id = Date.now() + "-" + Math.random().toString(36).slice(2, 7);
    try {
      await setDoc(doc(db, "users", user.uid, "transactions", id), { ...form, amount: amt, createdAt: Date.now() });
    } catch (e) {
      setError("Không lưu được, kiểm tra kết nối mạng.");
      return;
    }
    setForm((f) => ({
      type: f.type,
      category: TYPE_META[f.type].cats[0],
      amount: "",
      note: "",
      date: todayStr(),
      payment: PAYMENT_METHODS[0],
      channel: CHANNELS[0],
    }));
    setError("");
    setFormOpen(false);
  };

  const removeTransaction = async (id) => {
    try {
      await deleteDoc(doc(db, "users", user.uid, "transactions", id));
    } catch (e) {
      setError("Không xóa được, thử lại.");
    }
  };

  const shiftMonth = (delta) => {
    const [y, m] = selectedMonth.split("-").map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setSelectedMonth(d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"));
  };

  const monthLabel = useMemo(() => {
    const [y, m] = selectedMonth.split("-");
    return `Tháng ${m}/${y}`;
  }, [selectedMonth]);

  const monthTransactions = useMemo(
    () => transactions.filter((t) => monthKey(t.date || todayStr()) === selectedMonth),
    [transactions, selectedMonth]
  );

  const totals = useMemo(() => {
    let income = 0, expenseCash = 0, expenseCard = 0, invest = 0, debtPayments = 0, cardRepaid = 0;
    monthTransactions.forEach((t) => {
      if (t.type === "income") income += t.amount;
      else if (t.type === "expense") {
        if (t.payment === "Thẻ tín dụng") expenseCard += t.amount;
        else expenseCash += t.amount;
      } else if (t.type === "invest") invest += t.amount;
      else if (t.type === "debt") {
        debtPayments += t.amount;
        if (t.category === "Trả nợ thẻ tín dụng") cardRepaid += t.amount;
      }
    });
    const expense = expenseCash + expenseCard;
    const balance = income - expenseCash - invest - debtPayments;
    const cardOutstanding = expenseCard - cardRepaid;
    return { income, expense, expenseCash, expenseCard, invest, debtPayments, balance, cardOutstanding };
  }, [monthTransactions]);

  const filtered = useMemo(() => {
    if (filter === "all") return monthTransactions;
    return monthTransactions.filter((t) => t.type === filter);
  }, [monthTransactions, filter]);

  const monthlyChart = useMemo(() => {
    const map = {};
    transactions.forEach((t) => {
      const k = monthKey(t.date || todayStr());
      if (!map[k]) map[k] = { month: k, income: 0, expense: 0, invest: 0, debt: 0 };
      map[k][t.type] += t.amount;
    });
    return Object.values(map).sort((a, b) => a.month.localeCompare(b.month)).slice(-6);
  }, [transactions]);

  const expenseByCat = useMemo(() => {
    const map = {};
    monthTransactions.filter((t) => t.type === "expense").forEach((t) => {
      map[t.category] = (map[t.category] || 0) + t.amount;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [monthTransactions]);

  const incomeByChannel = useMemo(() => {
    const map = {};
    monthTransactions.filter((t) => t.type === "income").forEach((t) => {
      const k = t.channel || "Khác";
      map[k] = (map[k] || 0) + t.amount;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [monthTransactions]);

  const pieColors = ["#C1553D", "#C9A24B", "#4FA88B", "#7C8CB0", "#9BA6B0", "#8A7638", "#6B7280", "#B4794E", "#5D6B7A"];

  const dayTotals = useMemo(() => {
    const map = {};
    monthTransactions.forEach((t) => {
      const k = t.date || todayStr();
      if (!map[k]) map[k] = { income: 0, expense: 0, invest: 0, debt: 0 };
      map[k][t.type] += t.amount;
    });
    return map;
  }, [monthTransactions]);

  const calendarWeeks = useMemo(() => {
    const [y, m] = selectedMonth.split("-").map(Number);
    const firstDay = new Date(y, m - 1, 1);
    const daysInMonth = new Date(y, m, 0).getDate();
    const startOffset = (firstDay.getDay() + 6) % 7; // Monday = 0
    const cells = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(`${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
    while (cells.length % 7 !== 0) cells.push(null);
    const weeks = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
    return weeks;
  }, [selectedMonth]);

  const selectedDayTransactions = useMemo(
    () => (selectedDay ? monthTransactions.filter((t) => t.date === selectedDay) : []),
    [monthTransactions, selectedDay]
  );

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
      <div className="px-5 pt-8 pb-5 flex items-baseline justify-between" style={{ borderBottom: `1px solid ${COLORS.line}` }}>
        <div>
          <div className="serif" style={{ fontSize: 28, fontWeight: 600, letterSpacing: "0.01em" }}>Sổ Quỹ</div>
          <div className="mono" style={{ fontSize: 11, color: COLORS.inkDim, marginTop: 2 }}>{user.email}</div>
        </div>
        <div className="flex items-center gap-3">
          <Wallet size={20} color={COLORS.goldDim} />
          <button onClick={() => signOut(auth)} style={{ color: COLORS.inkDim }} title="Đăng xuất">
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Month switcher */}
      <div className="px-5 pt-5">
        <div className="rounded-xl flex items-center justify-between px-3 py-3" style={{ background: COLORS.panel, border: `1px solid ${COLORS.line}` }}>
          <button onClick={() => shiftMonth(-1)} className="rounded-lg p-2" style={{ background: COLORS.panel2, border: `1px solid ${COLORS.line}`, color: COLORS.inkDim }}>
            <ChevronLeft size={18} />
          </button>
          <div className="serif" style={{ fontSize: 17, fontWeight: 600 }}>{monthLabel}</div>
          <button onClick={() => shiftMonth(1)} className="rounded-lg p-2" style={{ background: COLORS.panel2, border: `1px solid ${COLORS.line}`, color: COLORS.inkDim }}>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="px-5 pt-4">
        <div className="rounded-xl p-5" style={{ background: COLORS.panel, border: `1px solid ${COLORS.line}` }}>
          <div className="mono" style={{ fontSize: 11, color: COLORS.inkDim, letterSpacing: "0.08em" }}>SỐ DƯ TIỀN MẶT (THÁNG NÀY)</div>
          <div className="serif" style={{ fontSize: 34, fontWeight: 600, marginTop: 4, color: totals.balance < 0 ? COLORS.expense : COLORS.ink }}>
            {fmt(totals.balance)}
          </div>
          <div className="flex gap-4 mt-4 pt-4 flex-wrap" style={{ borderTop: `1px dashed ${COLORS.line}` }}>
            <div style={{ minWidth: 70 }}>
              <div className="flex items-center gap-1" style={{ color: COLORS.income }}>
                <TrendingUp size={13} />
                <span className="mono" style={{ fontSize: 11 }}>THU</span>
              </div>
              <div className="mono" style={{ fontSize: 15, marginTop: 2 }}>{fmt(totals.income)}</div>
            </div>
            <div style={{ minWidth: 70 }}>
              <div className="flex items-center gap-1" style={{ color: COLORS.expense }}>
                <TrendingDown size={13} />
                <span className="mono" style={{ fontSize: 11 }}>CHI</span>
              </div>
              <div className="mono" style={{ fontSize: 15, marginTop: 2 }}>{fmt(totals.expense)}</div>
            </div>
            <div style={{ minWidth: 70 }}>
              <div className="flex items-center gap-1" style={{ color: COLORS.gold }}>
                <Coins size={13} />
                <span className="mono" style={{ fontSize: 11 }}>TÍCH LŨY</span>
              </div>
              <div className="mono" style={{ fontSize: 15, marginTop: 2 }}>{fmt(totals.invest)}</div>
            </div>
            <div style={{ minWidth: 70 }}>
              <div className="flex items-center gap-1" style={{ color: COLORS.debt }}>
                <CreditCard size={13} />
                <span className="mono" style={{ fontSize: 11 }}>DƯ NỢ THẺ</span>
              </div>
              <div className="mono" style={{ fontSize: 15, marginTop: 2 }}>{fmt(totals.cardOutstanding)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Category / channel charts (scoped to selected month) */}
      <div className="px-5 pt-4 grid grid-cols-1 gap-4">
        {expenseByCat.length > 0 && (
          <div
            className="rounded-xl p-4"
            onClick={() => { setCalendarOpen(true); setSelectedDay(null); }}
            style={{ background: COLORS.panel, border: `1px solid ${COLORS.line}`, cursor: "pointer" }}
          >
            <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
              <div className="mono" style={{ fontSize: 11, color: COLORS.inkDim, letterSpacing: "0.08em" }}>CHI TIÊU THEO DANH MỤC</div>
              <div className="mono flex items-center gap-1" style={{ fontSize: 10, color: COLORS.goldDim }}>
                Xem lịch <ChevronRight size={12} />
              </div>
            </div>
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

        {incomeByChannel.length > 0 && (
          <div className="rounded-xl p-4" style={{ background: COLORS.panel, border: `1px solid ${COLORS.line}` }}>
            <div className="mono" style={{ fontSize: 11, color: COLORS.inkDim, letterSpacing: "0.08em", marginBottom: 8 }}>THU NHẬP THEO KÊNH</div>
            <div className="flex flex-col gap-1.5">
              {incomeByChannel.map((e, i) => (
                <div key={e.name} className="flex items-center gap-2">
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: pieColors[i % pieColors.length] }} />
                  <div className="mono" style={{ fontSize: 11.5, color: COLORS.inkDim, flex: 1 }}>{e.name}</div>
                  <div className="mono" style={{ fontSize: 12.5, color: COLORS.income }}>{fmt(e.value)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Collapsible 6-month trend chart */}
        {transactions.length > 0 && (
          <div className="rounded-xl overflow-hidden" style={{ background: COLORS.panel, border: `1px solid ${COLORS.line}` }}>
            <button
              onClick={() => setChartOpen((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3"
              style={{ color: COLORS.inkDim }}
            >
              <span className="mono" style={{ fontSize: 11, letterSpacing: "0.08em" }}>DÒNG TIỀN 6 THÁNG GẦN NHẤT</span>
              {chartOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {chartOpen && (
              <div className="px-4 pb-4">
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
                    <Bar dataKey="debt" fill={COLORS.debt} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div className="px-5 pt-5 flex gap-2 flex-wrap">
        {[["all", "Tất cả", COLORS.inkDim], ["expense", "Chi tiêu", COLORS.expense], ["income", "Thu nhập", COLORS.income], ["invest", "Đầu tư", COLORS.gold], ["debt", "Trả nợ/Góp", COLORS.debt]].map(([key, label, color]) => (
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

      {/* Ledger list (scoped to selected month) */}
      <div className="px-5 pt-3">
        {filtered.length === 0 ? (
          <div className="rounded-xl p-8 text-center mt-3" style={{ background: COLORS.panel, border: `1px dashed ${COLORS.line}`, color: COLORS.inkDim }}>
            <div className="mono" style={{ fontSize: 12 }}>Chưa có khoản nào trong {monthLabel.toLowerCase()}. Bấm dấu + để ghi sổ.</div>
          </div>
        ) : (
          <div className="rounded-xl overflow-hidden mt-1" style={{ border: `1px solid ${COLORS.line}` }}>
            {filtered.map((t, idx) => {
              const meta = TYPE_META[t.type];
              const subLine = [
                t.date,
                t.type === "expense" && t.payment ? t.payment : null,
                t.type === "income" && t.channel ? t.channel : null,
                t.note || null,
              ].filter(Boolean).join(" · ");
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
                      {subLine}
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
            style={{ maxWidth: 480, background: COLORS.panel, border: `1px solid ${COLORS.line}`, borderBottom: "none", maxHeight: "88vh", overflowY: "auto" }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="serif" style={{ fontSize: 18, fontWeight: 600 }}>Ghi khoản mới</div>
              <button onClick={() => setFormOpen(false)} style={{ color: COLORS.inkDim }}><X size={18} /></button>
            </div>

            <div className="flex gap-2 mb-4 flex-wrap">
              {Object.entries(TYPE_META).map(([key, meta]) => (
                <button
                  key={key}
                  onClick={() => setForm((f) => ({ ...f, type: key, category: meta.cats[0] }))}
                  className="py-2 px-2 rounded-lg mono"
                  style={{
                    fontSize: 12,
                    flex: "1 1 auto",
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

            {form.type === "expense" && (
              <div className="mb-3">
                <div className="mono" style={{ fontSize: 10.5, color: COLORS.inkDim, marginBottom: 4 }}>PHƯƠNG THỨC THANH TOÁN</div>
                <select
                  value={form.payment}
                  onChange={(e) => setForm((f) => ({ ...f, payment: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg"
                  style={{ background: COLORS.panel2, border: `1px solid ${COLORS.line}`, color: COLORS.ink, fontSize: 13.5 }}
                >
                  {PAYMENT_METHODS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                {form.payment === "Thẻ tín dụng" && (
                  <div className="mono" style={{ fontSize: 10.5, color: COLORS.debt, marginTop: 4 }}>
                    Khoản này sẽ cộng vào "Dư nợ thẻ", chưa trừ số dư tiền mặt. Khi trả nợ, ghi ở mục "Trả nợ/Góp".
                  </div>
                )}
              </div>
            )}

            {form.type === "income" && (
              <div className="mb-3">
                <div className="mono" style={{ fontSize: 10.5, color: COLORS.inkDim, marginBottom: 4 }}>KÊNH</div>
                <select
                  value={form.channel}
                  onChange={(e) => setForm((f) => ({ ...f, channel: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg"
                  style={{ background: COLORS.panel2, border: `1px solid ${COLORS.line}`, color: COLORS.ink, fontSize: 13.5 }}
                >
                  {CHANNELS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            )}

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

      {/* Calendar view modal */}
      {calendarOpen && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ background: COLORS.bg }}>
          <div className="flex items-center justify-between px-5 pt-6 pb-4" style={{ borderBottom: `1px solid ${COLORS.line}` }}>
            <div className="serif" style={{ fontSize: 18, fontWeight: 600 }}>Lịch chi tiêu — {monthLabel}</div>
            <button onClick={() => { setCalendarOpen(false); setSelectedDay(null); }} style={{ color: COLORS.inkDim }}><X size={20} /></button>
          </div>

          <div className="px-3 pt-3 overflow-y-auto" style={{ flex: 1 }}>
            <div className="grid grid-cols-7 gap-1 mb-1">
              {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((w) => (
                <div key={w} className="mono text-center" style={{ fontSize: 10, color: COLORS.inkDim, paddingBottom: 4 }}>{w}</div>
              ))}
            </div>
            {calendarWeeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 gap-1 mb-1">
                {week.map((dateStr, di) => {
                  if (!dateStr) return <div key={di} />;
                  const dayNum = parseInt(dateStr.slice(-2), 10);
                  const dt = dayTotals[dateStr];
                  const isSelected = selectedDay === dateStr;
                  return (
                    <button
                      key={dateStr}
                      onClick={() => setSelectedDay(isSelected ? null : dateStr)}
                      className="rounded-lg p-1 flex flex-col items-start"
                      style={{
                        background: isSelected ? COLORS.panel2 : COLORS.panel,
                        border: `1px solid ${isSelected ? COLORS.gold : COLORS.line}`,
                        minHeight: 58,
                        textAlign: "left",
                      }}
                    >
                      <div className="mono" style={{ fontSize: 10.5, color: COLORS.inkDim }}>{dayNum}</div>
                      {dt && (
                        <div className="flex flex-col" style={{ gap: 1, marginTop: 2 }}>
                          {dt.income > 0 && <div className="mono" style={{ fontSize: 8.5, color: COLORS.income }}>+{(dt.income / 1000).toFixed(0)}k</div>}
                          {dt.expense > 0 && <div className="mono" style={{ fontSize: 8.5, color: COLORS.expense }}>-{(dt.expense / 1000).toFixed(0)}k</div>}
                          {dt.invest > 0 && <div className="mono" style={{ fontSize: 8.5, color: COLORS.gold }}>•{(dt.invest / 1000).toFixed(0)}k</div>}
                          {dt.debt > 0 && <div className="mono" style={{ fontSize: 8.5, color: COLORS.debt }}>▪{(dt.debt / 1000).toFixed(0)}k</div>}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}

            {selectedDay && (
              <div className="mt-4 rounded-xl overflow-hidden" style={{ border: `1px solid ${COLORS.line}` }}>
                <div className="px-4 py-3" style={{ background: COLORS.panel2, borderBottom: `1px solid ${COLORS.line}` }}>
                  <div className="serif" style={{ fontSize: 15, fontWeight: 600 }}>Ngày {selectedDay.split("-").reverse().join("/")}</div>
                </div>
                {selectedDayTransactions.length === 0 ? (
                  <div className="p-6 text-center mono" style={{ color: COLORS.inkDim, fontSize: 12, background: COLORS.panel }}>
                    Không có khoản nào ngày này.
                  </div>
                ) : (
                  selectedDayTransactions.map((t, idx) => {
                    const meta = TYPE_META[t.type];
                    const subLine = [
                      t.type === "expense" && t.payment ? t.payment : null,
                      t.type === "income" && t.channel ? t.channel : null,
                      t.note || null,
                    ].filter(Boolean).join(" · ");
                    return (
                      <div
                        key={t.id}
                        className="flex items-center px-4 py-3"
                        style={{
                          background: idx % 2 === 0 ? COLORS.panel : COLORS.panel2,
                          borderBottom: idx === selectedDayTransactions.length - 1 ? "none" : `1px solid ${COLORS.line}`,
                        }}
                      >
                        <div style={{ width: 3, height: 28, background: meta.color, borderRadius: 2, marginRight: 12 }} />
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: 13.5, fontWeight: 500 }}>{t.category}</div>
                          {subLine && <div className="mono" style={{ fontSize: 10.5, color: COLORS.inkDim, marginTop: 1 }}>{subLine}</div>}
                        </div>
                        <div className="mono" style={{ fontSize: 14, color: meta.color, whiteSpace: "nowrap" }}>
                          {meta.sign > 0 ? "+" : "−"}{fmt(t.amount)}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


export default function App() {
  const [user, setUser] = useState(undefined); // undefined = checking, null = logged out

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  if (user === undefined) {
    return (
      <div style={{ background: COLORS.bg, color: "#94A0AC", minHeight: "100vh" }} className="flex items-center justify-center font-mono text-sm">
        đang kiểm tra đăng nhập…
      </div>
    );
  }

  if (!user) return <LoginScreen />;

  return <MainApp user={user} />;
}

import React, { useState, useEffect, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid,
} from "recharts";
import { Plus, TrendingUp, TrendingDown, Coins, Wallet, Trash2, X, CreditCard, LogOut } from "lucide-react";
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

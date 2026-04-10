import { useState, useMemo, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  AreaChart, Area
} from "recharts";

// ── March 2026 — Sanitized Data ─────────────────────────────────────────────
// Removed: internal transfers, test transactions (Pagar.me), duplicate card
// bill payments, Buser/Arca refunds. Adjusted: Adriano house share applied to
// Casa, Ana Júlia splits applied, Wellhub split with Ana.
const MARCH_DATA = [
  { date: "2026-03-01", description: "Uber", category: "Transporte", amount: 12.95, type: "expense" },
  { date: "2026-03-01", description: "Uber", category: "Transporte", amount: 12.98, type: "expense" },
  { date: "2026-03-01", description: "Uber", category: "Transporte", amount: 18.97, type: "expense" },
  { date: "2026-03-01", description: "Uber", category: "Transporte", amount: 11.98, type: "expense" },
  { date: "2026-03-01", description: "Uber", category: "Transporte", amount: 12.99, type: "expense" },
  { date: "2026-03-01", description: "Container Barber", category: "Cuidados pessoais", amount: 177.90, type: "expense" },
  { date: "2026-03-01", description: "Uber", category: "Transporte", amount: 11.95, type: "expense" },
  { date: "2026-03-01", description: "Uber", category: "Transporte", amount: 11.98, type: "expense" },
  { date: "2026-03-02", description: "Fatura Itaú (fev)", category: "Impostos e Taxas", amount: 460.23, type: "expense" },
  { date: "2026-03-02", description: "iFood", category: "Alimentação", amount: 30.00, type: "expense" },
  { date: "2026-03-02", description: "Tuna Pagamentos", category: "Transporte", amount: 228.14, type: "expense" },
  { date: "2026-03-02", description: "Mercado Livre", category: "Compras", amount: 51.91, type: "expense" },
  { date: "2026-03-02", description: "Uber", category: "Transporte", amount: 11.07, type: "expense" },
  { date: "2026-03-02", description: "Uber", category: "Transporte", amount: 15.99, type: "expense" },
  { date: "2026-03-02", description: "Uber", category: "Transporte", amount: 13.98, type: "expense" },
  { date: "2026-03-02", description: "Uber", category: "Transporte", amount: 9.94, type: "expense" },
  { date: "2026-03-02", description: "Uber", category: "Transporte", amount: 19.98, type: "expense" },
  { date: "2026-03-03", description: "PIX Elizangela", category: "Presentes e doações", amount: 300.00, type: "expense" },
  { date: "2026-03-03", description: "Rendimento", category: "Outras receitas", amount: 0.04, type: "income" },
  { date: "2026-03-03", description: "Líder Farmácia", category: "Saúde", amount: 23.47, type: "expense" },
  { date: "2026-03-03", description: "Mercado Livre", category: "Mercado", amount: 293.66, type: "expense" },
  { date: "2026-03-03", description: "Nescafé Dolce Gusto", category: "Mercado", amount: 43.96, type: "expense" },
  { date: "2026-03-03", description: "Mapfre Seguro", category: "Transporte", amount: 275.65, type: "expense" },
  { date: "2026-03-04", description: "Rendimento", category: "Outras receitas", amount: 0.02, type: "income" },
  { date: "2026-03-04", description: "iFood", category: "Alimentação", amount: 27.77, type: "expense" },
  { date: "2026-03-04", description: "Vivo Easy", category: "Assinaturas e serviços", amount: 55.00, type: "expense" },
  { date: "2026-03-05", description: "Abalen Restaurante", category: "Bares e restaurantes", amount: 31.66, type: "expense" },
  { date: "2026-03-05", description: "Hélio Zancanelli", category: "Presentes e doações", amount: 22.65, type: "expense" },
  { date: "2026-03-06", description: "Rendimento", category: "Outras receitas", amount: 0.01, type: "income" },
  { date: "2026-03-06", description: "PIX Alonso", category: "Outros", amount: 586.00, type: "expense" },
  { date: "2026-03-06", description: "Hélio Zancanelli", category: "Presentes e doações", amount: 22.65, type: "expense" },
  { date: "2026-03-06", description: "Flex Bar", category: "Mercado", amount: 7.50, type: "expense" },
  { date: "2026-03-06", description: "Adega da Villa", category: "Bares e restaurantes", amount: 6.00, type: "expense" },
  { date: "2026-03-06", description: "Container Barber", category: "Cuidados pessoais", amount: 3.00, type: "expense" },
  { date: "2026-03-06", description: "Flex Bar", category: "Mercado", amount: 10.00, type: "expense" },
  { date: "2026-03-06", description: "Uber", category: "Transporte", amount: 13.97, type: "expense" },
  { date: "2026-03-06", description: "Uber", category: "Transporte", amount: 10.98, type: "expense" },
  { date: "2026-03-06", description: "Uber", category: "Transporte", amount: 12.98, type: "expense" },
  { date: "2026-03-07", description: "Uber", category: "Transporte", amount: 22.94, type: "expense" },
  { date: "2026-03-07", description: "NuPay", category: "Dívidas e empréstimos", amount: 77.85, type: "expense" },
  { date: "2026-03-09", description: "Ana Júlia", category: "Outras receitas", amount: 443.00, type: "income" },
  { date: "2026-03-09", description: "Tuna Pagamentos", category: "Outras receitas", amount: 92.64, type: "income" },
  { date: "2026-03-09", description: "Shark", category: "Lazer e hobbies", amount: 10.00, type: "expense" },
  { date: "2026-03-09", description: "Maravilhas do Lar", category: "Casa (sua parte)", amount: 30.70, type: "expense" },
  { date: "2026-03-09", description: "Daiso", category: "Casa (sua parte)", amount: 17.96, type: "expense" },
  { date: "2026-03-09", description: "Shark", category: "Lazer e hobbies", amount: 10.00, type: "expense" },
  { date: "2026-03-10", description: "AWS", category: "Assinaturas e serviços", amount: 1.46, type: "expense" },
  { date: "2026-03-10", description: "AWS", category: "Assinaturas e serviços", amount: 1.52, type: "expense" },
  { date: "2026-03-10", description: "AWS", category: "Assinaturas e serviços", amount: 1.47, type: "expense" },
  { date: "2026-03-10", description: "Condomínio", category: "Casa (sua parte)", amount: 52.20, type: "expense" },
  { date: "2026-03-10", description: "AWS", category: "Assinaturas e serviços", amount: 1.54, type: "expense" },
  { date: "2026-03-10", description: "AWS", category: "Assinaturas e serviços", amount: 0.88, type: "expense" },
  { date: "2026-03-10", description: "Claro Internet", category: "Casa (sua parte)", amount: 33.40, type: "expense" },
  { date: "2026-03-10", description: "AWS", category: "Assinaturas e serviços", amount: 1.40, type: "expense" },
  { date: "2026-03-10", description: "AWS", category: "Assinaturas e serviços", amount: 1.51, type: "expense" },
  { date: "2026-03-10", description: "AWS", category: "Assinaturas e serviços", amount: 1.52, type: "expense" },
  { date: "2026-03-10", description: "AWS", category: "Assinaturas e serviços", amount: 1.54, type: "expense" },
  { date: "2026-03-10", description: "AWS", category: "Assinaturas e serviços", amount: 1.51, type: "expense" },
  { date: "2026-03-10", description: "AWS", category: "Assinaturas e serviços", amount: 1.18, type: "expense" },
  { date: "2026-03-10", description: "Aluguel", category: "Casa (sua parte)", amount: 458.88, type: "expense" },
  { date: "2026-03-11", description: "Rendimento", category: "Outras receitas", amount: 0.05, type: "income" },
  { date: "2026-03-11", description: "Udemy", category: "Educação", amount: 40.90, type: "expense" },
  { date: "2026-03-11", description: "Wellhub", category: "Saúde", amount: 2.50, type: "expense" },
  { date: "2026-03-13", description: "IOF", category: "Outros", amount: 3.64, type: "expense" },
  { date: "2026-03-13", description: "ChatGPT", category: "Assinaturas e serviços", amount: 104.10, type: "expense" },
  { date: "2026-03-14", description: "Jim Restaurante", category: "Bares e restaurantes", amount: 5.00, type: "expense" },
  { date: "2026-03-14", description: "Uber", category: "Transporte", amount: 14.97, type: "expense" },
  { date: "2026-03-15", description: "Bom Apetite", category: "Bares e restaurantes", amount: 53.30, type: "expense" },
  { date: "2026-03-16", description: "iFood", category: "Alimentação", amount: 42.97, type: "expense" },
  { date: "2026-03-16", description: "iFood", category: "Alimentação", amount: 42.97, type: "expense" },
  { date: "2026-03-16", description: "KR Conveniência", category: "Mercado", amount: 34.99, type: "expense" },
  { date: "2026-03-16", description: "MN Supermercados", category: "Mercado", amount: 41.92, type: "expense" },
  { date: "2026-03-16", description: "Uber", category: "Transporte", amount: 13.93, type: "expense" },
  { date: "2026-03-17", description: "Villani Primavera", category: "Mercado", amount: 68.38, type: "expense" },
  { date: "2026-03-17", description: "Dalben", category: "Mercado", amount: 117.42, type: "expense" },
  { date: "2026-03-17", description: "Rede Araujo", category: "Bares e restaurantes", amount: 31.00, type: "expense" },
  { date: "2026-03-18", description: "Tiozão Eventos", category: "Bares e restaurantes", amount: 15.00, type: "expense" },
  { date: "2026-03-18", description: "Márcia's Gourmet", category: "Bares e restaurantes", amount: 38.00, type: "expense" },
  { date: "2026-03-18", description: "Organizze", category: "Assinaturas e serviços", amount: 45.00, type: "expense" },
  { date: "2026-03-18", description: "Lee Pastelaria", category: "Alimentação", amount: 12.00, type: "expense" },
  { date: "2026-03-18", description: "Márcia's Gourmet", category: "Bares e restaurantes", amount: 38.00, type: "expense" },
  { date: "2026-03-18", description: "Tiozão Eventos", category: "Bares e restaurantes", amount: 15.00, type: "expense" },
  { date: "2026-03-18", description: "Adriano (juros)", category: "Outras receitas", amount: 100.00, type: "income" },
  { date: "2026-03-19", description: "Uber", category: "Transporte", amount: 11.97, type: "expense" },
  { date: "2026-03-20", description: "Don Manoel", category: "Bares e restaurantes", amount: 372.34, type: "expense" },
  { date: "2026-03-22", description: "Smart Damha", category: "Mercado", amount: 28.95, type: "expense" },
  { date: "2026-03-22", description: "Smart Damha", category: "Mercado", amount: 27.14, type: "expense" },
  { date: "2026-03-22", description: "Sorfrio", category: "Bares e restaurantes", amount: 27.31, type: "expense" },
  { date: "2026-03-22", description: "Tecpet", category: "Outros", amount: 135.00, type: "expense" },
  { date: "2026-03-22", description: "99Food", category: "Alimentação", amount: 33.39, type: "expense" },
  { date: "2026-03-23", description: "Shopee", category: "Outros", amount: 29.99, type: "expense" },
  { date: "2026-03-23", description: "Ghiovana", category: "Transporte", amount: 40.00, type: "expense" },
  { date: "2026-03-23", description: "Paróquia", category: "Presentes e doações", amount: 15.00, type: "expense" },
  { date: "2026-03-23", description: "99Food", category: "Transporte", amount: 24.15, type: "expense" },
  { date: "2026-03-23", description: "José Ricardo", category: "Bares e restaurantes", amount: 282.00, type: "expense" },
  { date: "2026-03-23", description: "Paróquia", category: "Presentes e doações", amount: 15.00, type: "expense" },
  { date: "2026-03-24", description: "Ana Júlia", category: "Mercado", amount: 40.00, type: "expense" },
  { date: "2026-03-24", description: "iFood Club", category: "Alimentação", amount: 5.95, type: "expense" },
  { date: "2026-03-24", description: "99Food", category: "Alimentação", amount: 31.44, type: "expense" },
  { date: "2026-03-25", description: "Rendimento", category: "Outras receitas", amount: 0.01, type: "income" },
  { date: "2026-03-25", description: "Times Idiomas", category: "Educação", amount: 258.00, type: "expense" },
  { date: "2026-03-26", description: "Rendimento", category: "Outras receitas", amount: 0.04, type: "income" },
  { date: "2026-03-26", description: "CEMIG", category: "Casa (sua parte)", amount: 43.31, type: "expense" },
  { date: "2026-03-26", description: "Smart Damha", category: "Mercado", amount: 26.38, type: "expense" },
  { date: "2026-03-27", description: "Rendimento", category: "Outras receitas", amount: 0.04, type: "income" },
  { date: "2026-03-27", description: "Auto Shopp Paulista", category: "Transporte", amount: 269.56, type: "expense" },
  { date: "2026-03-27", description: "Páscoa Isabelly", category: "Presentes e doações", amount: 100.00, type: "expense" },
  { date: "2026-03-27", description: "Dalben", category: "Mercado", amount: 25.47, type: "expense" },
  { date: "2026-03-28", description: "DSG Restaurante", category: "Bares e restaurantes", amount: 18.23, type: "expense" },
  { date: "2026-03-28", description: "Farmácia", category: "Saúde", amount: 10.89, type: "expense" },
  { date: "2026-03-28", description: "Rendimento", category: "Outras receitas", amount: 0.04, type: "income" },
  { date: "2026-03-29", description: "Hud's Escarpas", category: "Bares e restaurantes", amount: 560.00, type: "expense" },
  { date: "2026-03-29", description: "Canel", category: "Outros", amount: 30.00, type: "expense" },
  { date: "2026-03-29", description: "Páscoa Ana Júlia", category: "Presentes e doações", amount: 120.00, type: "expense" },
  { date: "2026-03-29", description: "Paulo H", category: "Alimentação", amount: 120.00, type: "expense" },
  { date: "2026-03-29", description: "Container Barber", category: "Cuidados pessoais", amount: 177.90, type: "expense" },
  { date: "2026-03-31", description: "Flash VA", category: "Alimentação", amount: 1420.00, type: "expense" },
  { date: "2026-03-31", description: "Flash VA", category: "Outras receitas", amount: 1420.00, type: "income" },
  { date: "2026-03-31", description: "Rendimento", category: "Outras receitas", amount: 0.70, type: "income" },
  { date: "2026-03-31", description: "Salário Zup", category: "Salário", amount: 8342.38, type: "income" },
  { date: "2026-03-31", description: "Farmácia", category: "Saúde", amount: 7.59, type: "expense" },
  { date: "2026-03-31", description: "Airbnb", category: "Viagem", amount: 290.79, type: "expense" },
  { date: "2026-03-31", description: "Nescafé Dolce Gusto", category: "Bares e restaurantes", amount: 43.89, type: "expense" },
  { date: "2026-03-31", description: "Center Shopping", category: "Transporte", amount: 143.00, type: "expense" }
];

// ── Color Palette ────────────────────────────────────────────────────────────
const COLORS = {
  "Alimentação": "#14b8a6",
  "Bares e restaurantes": "#f59e0b",
  "Transporte": "#10b981",
  "Outros": "#94a3b8",
  "Mercado": "#3b82f6",
  "Casa (sua parte)": "#6366f1",
  "Presentes e doações": "#ec4899",
  "Impostos e Taxas": "#f97316",
  "Cuidados pessoais": "#8b5cf6",
  "Educação": "#06b6d4",
  "Viagem": "#0ea5e9",
  "Assinaturas e serviços": "#a855f7",
  "Dívidas e empréstimos": "#ef4444",
  "Compras": "#eab308",
  "Saúde": "#22c55e",
  "Lazer e hobbies": "#e879f9",
};

const fmt = (n) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

const fmtFull = (n) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });

// ── Components ───────────────────────────────────────────────────────────────
function KpiCard({ label, value, subtitle, positive }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 14, padding: "24px 28px",
      flex: 1, minWidth: 220, boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      border: "1px solid #f0f0f0", transition: "box-shadow 0.2s",
    }}>
      <div style={{
        fontSize: 12, color: "#94a3b8", fontWeight: 600,
        letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 10
      }}>{label}</div>
      <div style={{
        fontSize: 30, fontWeight: 700, letterSpacing: -0.5,
        color: positive === true ? "#10b981" : positive === false ? "#ef4444" : "#0f172a"
      }}>{fmt(value)}</div>
      {subtitle && (
        <div style={{ marginTop: 8, fontSize: 13, color: "#94a3b8" }}>{subtitle}</div>
      )}
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10,
      padding: "12px 16px", boxShadow: "0 4px 16px rgba(0,0,0,0.08)", fontSize: 13
    }}>
      <div style={{ fontWeight: 600, color: "#0f172a", marginBottom: 6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || "#64748b", marginTop: 2 }}>
          {p.name}: {fmtFull(p.value)}
        </div>
      ))}
    </div>
  );
}

function DonutLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) {
  if (percent < 0.04) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>
      {(percent * 100).toFixed(0)}%
    </text>
  );
}

// ── Transactions Table ───────────────────────────────────────────────────────
function TransactionsTable({ data, filter }) {
  const rows = data
    .filter(r => r.type === "expense" && (filter === "all" || r.category === filter))
    .sort((a, b) => b.date.localeCompare(a.date) || b.amount - a.amount);

  return (
    <div style={{ maxHeight: 360, overflowY: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #f1f5f9", position: "sticky", top: 0, background: "#fff" }}>
            <th style={{ textAlign: "left", padding: "8px 12px", color: "#94a3b8", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>Data</th>
            <th style={{ textAlign: "left", padding: "8px 12px", color: "#94a3b8", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>Descrição</th>
            <th style={{ textAlign: "left", padding: "8px 12px", color: "#94a3b8", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>Categoria</th>
            <th style={{ textAlign: "right", padding: "8px 12px", color: "#94a3b8", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>Valor</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ borderBottom: "1px solid #f8fafc" }}>
              <td style={{ padding: "10px 12px", color: "#64748b", whiteSpace: "nowrap" }}>
                {new Date(r.date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
              </td>
              <td style={{ padding: "10px 12px", color: "#0f172a", fontWeight: 500 }}>{r.description}</td>
              <td style={{ padding: "10px 12px" }}>
                <span style={{
                  display: "inline-block", padding: "3px 10px", borderRadius: 20,
                  fontSize: 11, fontWeight: 600,
                  background: (COLORS[r.category] || "#94a3b8") + "18",
                  color: COLORS[r.category] || "#64748b"
                }}>{r.category}</span>
              </td>
              <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600, color: "#ef4444", fontVariantNumeric: "tabular-nums" }}>
                -{fmtFull(r.amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Main Dashboard ───────────────────────────────────────────────────────────
export default function FinancialDashboard() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const data = MARCH_DATA;

  const totalIncome = useMemo(() => data.filter(r => r.type === "income").reduce((s, r) => s + r.amount, 0), [data]);
  const totalExpenses = useMemo(() => data.filter(r => r.type === "expense").reduce((s, r) => s + r.amount, 0), [data]);
  const net = totalIncome - totalExpenses;

  // Category breakdown (expenses only)
  const categoryData = useMemo(() => {
    const map = {};
    data.filter(r => r.type === "expense").forEach(r => {
      map[r.category] = (map[r.category] || 0) + r.amount;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));
  }, [data]);

  // Weekly spending trend
  const weeklyData = useMemo(() => {
    const weeks = [
      { label: "Sem 1\n01–07", start: "2026-03-01", end: "2026-03-07" },
      { label: "Sem 2\n08–14", start: "2026-03-08", end: "2026-03-14" },
      { label: "Sem 3\n15–21", start: "2026-03-15", end: "2026-03-21" },
      { label: "Sem 4\n22–31", start: "2026-03-22", end: "2026-03-31" },
    ];
    return weeks.map(w => {
      const expenses = data
        .filter(r => r.type === "expense" && r.date >= w.start && r.date <= w.end)
        .reduce((s, r) => s + r.amount, 0);
      const income = data
        .filter(r => r.type === "income" && r.date >= w.start && r.date <= w.end)
        .reduce((s, r) => s + r.amount, 0);
      return { label: w.label.split("\n")[0], sub: w.label.split("\n")[1], expenses, income };
    });
  }, [data]);

  // Top 5 expenses
  const topExpenses = useMemo(() =>
    [...data].filter(r => r.type === "expense").sort((a, b) => b.amount - a.amount).slice(0, 5),
    [data]
  );

  return (
    <div style={{
      minHeight: "100vh", background: "#f8fafc",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif",
      padding: "36px 44px", maxWidth: 1200, margin: "0 auto"
    }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: "#0f172a", margin: 0, letterSpacing: -0.5 }}>
          Finanças — Março 2026
        </h1>
        <p style={{ fontSize: 13, color: "#94a3b8", margin: "6px 0 0 0" }}>
          124 transações · Dados sanitizados
        </p>
      </div>

      {/* KPI Row */}
      <div style={{ display: "flex", gap: 16, marginBottom: 28, flexWrap: "wrap" }}>
        <KpiCard label="Receitas" value={totalIncome} subtitle="Salário + freelance + outros" />
        <KpiCard label="Despesas" value={totalExpenses} subtitle={`${categoryData.length} categorias`} />
        <KpiCard
          label="Saldo"
          value={Math.abs(net)}
          positive={net >= 0}
          subtitle={net >= 0 ? "Sobrou no mês" : "Déficit no mês"}
        />
      </div>

      {/* Charts Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>

        {/* Bar Chart — Spending by Category */}
        <div style={{
          background: "#fff", borderRadius: 14, padding: 24,
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)", border: "1px solid #f0f0f0"
        }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", margin: "0 0 18px 0" }}>Gastos por Categoria</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={categoryData} layout="vertical" margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
              <CartesianGrid horizontal={false} stroke="#f1f5f9" />
              <XAxis
                type="number"
                tickFormatter={v => `R$${(v / 1000).toFixed(1)}k`}
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false} tickLine={false}
              />
              <YAxis
                type="category" dataKey="name"
                tick={{ fontSize: 12, fill: "#475569" }}
                axisLine={false} tickLine={false}
                width={140}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="value" name="Valor"
                radius={[0, 6, 6, 0]} maxBarSize={24}
                cursor="pointer"
                onClick={(d) => setSelectedCategory(d.name === selectedCategory ? "all" : d.name)}
              >
                {categoryData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={COLORS[entry.name] || "#94a3b8"}
                    opacity={selectedCategory === "all" || selectedCategory === entry.name ? 1 : 0.3}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {selectedCategory !== "all" && (
            <button
              onClick={() => setSelectedCategory("all")}
              style={{
                marginTop: 8, fontSize: 12, color: "#6366f1", background: "none",
                border: "none", cursor: "pointer", fontWeight: 600, padding: 0
              }}
            >
              Limpar filtro
            </button>
          )}
        </div>

        {/* Donut Chart — Proportional Split */}
        <div style={{
          background: "#fff", borderRadius: 14, padding: 24,
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)", border: "1px solid #f0f0f0"
        }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", margin: "0 0 18px 0" }}>Proporção de Gastos</h3>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%" cy="45%"
                innerRadius={60} outerRadius={105}
                dataKey="value"
                labelLine={false}
                label={DonutLabel}
                strokeWidth={2} stroke="#fff"
              >
                {categoryData.map((entry, i) => (
                  <Cell key={i} fill={COLORS[entry.name] || "#94a3b8"} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                iconType="circle" iconSize={7}
                formatter={(v) => <span style={{ fontSize: 11, color: "#64748b" }}>{v}</span>}
                wrapperStyle={{ fontSize: 11 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Weekly Trend — full width */}
      <div style={{
        background: "#fff", borderRadius: 14, padding: 24, marginBottom: 16,
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)", border: "1px solid #f0f0f0"
      }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", margin: "0 0 18px 0" }}>Evolução Semanal</h3>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={weeklyData} margin={{ left: 10, right: 20, top: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.12} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.12} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="income" name="Receitas" stroke="#10b981" strokeWidth={2.5} fill="url(#incGrad)" dot={{ r: 4, fill: "#10b981", strokeWidth: 0 }} />
            <Area type="monotone" dataKey="expenses" name="Despesas" stroke="#ef4444" strokeWidth={2.5} fill="url(#expGrad)" dot={{ r: 4, fill: "#ef4444", strokeWidth: 0 }} />
            <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: 12, color: "#64748b" }}>{v}</span>} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom row: Top 5 + Transactions */}
      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 16 }}>

        {/* Top 5 Expenses */}
        <div style={{
          background: "#fff", borderRadius: 14, padding: 24,
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)", border: "1px solid #f0f0f0"
        }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", margin: "0 0 16px 0" }}>Top 5 Gastos</h3>
          {topExpenses.map((r, i) => (
            <div key={i} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "10px 0", borderBottom: i < 4 ? "1px solid #f8fafc" : "none"
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{r.description}</div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                  {new Date(r.date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                </div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#ef4444", fontVariantNumeric: "tabular-nums" }}>
                {fmtFull(r.amount)}
              </div>
            </div>
          ))}
        </div>

        {/* Transactions Table */}
        <div style={{
          background: "#fff", borderRadius: 14, padding: 24,
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)", border: "1px solid #f0f0f0"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", margin: 0 }}>
              Transações {selectedCategory !== "all" ? `· ${selectedCategory}` : ""}
            </h3>
            {selectedCategory !== "all" && (
              <button
                onClick={() => setSelectedCategory("all")}
                style={{
                  fontSize: 12, color: "#6366f1", background: "#6366f114",
                  border: "none", borderRadius: 6, padding: "4px 10px",
                  cursor: "pointer", fontWeight: 600
                }}
              >
                Ver todas
              </button>
            )}
          </div>
          <TransactionsTable data={data} filter={selectedCategory} />
        </div>
      </div>
    </div>
  );
}

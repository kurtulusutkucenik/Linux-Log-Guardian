"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useLanguage } from "./LanguageProvider";

export type ChartAgent = {
  agent_id: string;
  eps: number;
  alerts_total: number;
  status: string;
};

const STATUS_COLORS: Record<string, string> = {
  Online: "#00ff9d",
  Offline: "#64748b",
};

export function FleetCharts({ agents }: { agents: ChartAgent[] }) {
  const { t } = useLanguage();

  const epsData = agents
    .slice()
    .sort((a, b) => b.eps - a.eps)
    .map((a) => ({
      name: a.agent_id.replace(/^node-/, "").slice(0, 12),
      eps: Math.round(a.eps * 10) / 10,
    }));

  const alertData = agents.map((a) => ({
    name: a.agent_id.replace(/^node-/, "").slice(0, 10),
    alerts: a.alerts_total,
  }));

  const statusCounts = agents.reduce(
    (acc, a) => {
      const k = a.status === "Online" ? "Online" : "Offline";
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
  const pieData = Object.entries(statusCounts).map(([name, value]) => ({
    name,
    value,
  }));

  if (agents.length === 0) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="glass-panel p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-3">
          {t("chartsEps")}
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={epsData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10 }} />
            <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} />
            <Tooltip
              contentStyle={{
                background: "#0f1419",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
              }}
            />
            <Bar dataKey="eps" fill="#0891b2" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="glass-panel p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-3">
          {t("chartsAlerts")}
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={alertData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10 }} />
            <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                background: "#0f1419",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
              }}
            />
            <Bar dataKey="alerts" fill="#d97706" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="glass-panel p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-3">
          {t("chartsAgents")}
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={70}
              paddingAngle={3}
            >
              {pieData.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={STATUS_COLORS[entry.name] ?? "#64748b"}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "#0f1419",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

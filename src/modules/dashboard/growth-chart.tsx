"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const trendData = [
  { month: "Jan", mahasiswa: 2250, pembayaran: 780 },
  { month: "Feb", mahasiswa: 2310, pembayaran: 810 },
  { month: "Mar", mahasiswa: 2365, pembayaran: 845 },
  { month: "Apr", mahasiswa: 2481, pembayaran: 910 },
];

export default function GrowthChart() {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={trendData}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
          <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
            cursor={{ fill: '#f8fafc' }}
          />
          <Bar dataKey="mahasiswa" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={40} />
          <Bar dataKey="pembayaran" fill="#f59e0b" radius={[6, 6, 0, 0]} barSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

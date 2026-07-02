"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PerformanceDataPoint } from "@/types";

interface PerformanceChartProps {
  data: PerformanceDataPoint[];
  title?: string;
}

export function PerformanceChart({ data, title }: PerformanceChartProps) {
  return (
    <Card className="border-0 bg-white shadow-sm">
      {title && (
        <CardHeader>
          <CardTitle className="text-lg font-bold text-black-premium">
            {title}
          </CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e2db" />
              <XAxis dataKey="month" stroke="#4B5563" fontSize={12} />
              <YAxis stroke="#4B5563" fontSize={12} domain={[50, 100]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e2db",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="technical"
                stroke="#0A4FA3"
                strokeWidth={2}
                dot={{ fill: "#0A4FA3" }}
                name="Technique"
              />
              <Line
                type="monotone"
                dataKey="physical"
                stroke="#C99A2E"
                strokeWidth={2}
                dot={{ fill: "#C99A2E" }}
                name="Physique"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

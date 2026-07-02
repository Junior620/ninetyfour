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
      <CardContent className="p-4 sm:p-6">
        <div className="h-[240px] w-full sm:h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e2db" />
              <XAxis dataKey="month" stroke="#4B5563" fontSize={11} tickMargin={8} />
              <YAxis stroke="#4B5563" fontSize={11} domain={[50, 100]} width={32} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e2db",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
                iconSize={10}
              />
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

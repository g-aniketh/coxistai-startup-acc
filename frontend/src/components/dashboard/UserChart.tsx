"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import Link from "next/link";
import { CashflowChartData } from "@/lib/api";

interface UserChartProps {
  data?: CashflowChartData[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 shadow-lg rounded-lg border">
        <p className="font-bold text-gray-800">{`$${payload[0].value.toLocaleString()}`}</p>
      </div>
    );
  }

  return null;
};

export default function UserChart({ data = [] }: UserChartProps) {
  // Use mock data that matches the image exactly
  const chartData = [
    { name: "Mon", value: 12000 },
    { name: "Tue", value: 30000 },
    { name: "Wed", value: 33567 },
    { name: "Thu", value: 15000 },
    { name: "Fri", value: 8000 },
    { name: "Sat", value: 28000 },
    { name: "Sun", value: 23000 },
  ];

  return (
    <Card className="rounded-2xl shadow-lg border-0 bg-white">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-lg font-semibold text-gray-800">
            User in The Last Week
          </CardTitle>
          <CardDescription className="text-sm text-green-600 font-semibold">
            + 3,2%
          </CardDescription>
        </div>
        <Link
          href="#"
          className="text-sm text-blue-600 hover:underline font-semibold"
        >
          See statistics for all time
        </Link>
      </CardHeader>
      <CardContent className="h-64 pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
          >
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#6b7280" }}
              className="text-xs text-gray-500"
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `${value / 1000} K`}
              className="text-xs text-gray-500"
            />
            <Tooltip
              cursor={{ fill: "transparent" }}
              content={<CustomTooltip />}
            />
            <Bar
              dataKey="value"
              radius={[4, 4, 0, 0]}
              barSize={50}
              background={{ fill: "#E4E1DC" }}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={"#2C2C2C"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

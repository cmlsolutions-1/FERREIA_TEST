"use client"

import { Bar, BarChart, CartesianGrid, XAxis, Cell, Pie, PieChart } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import type { ReportSummary } from "@/services/reports.service"

const salesConfig = {
  ventas: { label: "Ventas", color: "var(--chart-1)" },
  compras: { label: "Compras", color: "var(--chart-2)" },
}

const pieColors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"]

export function DashboardCharts({ monthly, categories, loading }: Pick<ReportSummary, "monthly" | "categories"> & { loading: boolean }) {
  const chartRows = monthly.map((item) => ({ mes: item.month, ventas: item.sales, compras: item.purchases }))
  const categoryRows = categories.slice(0, 5).map((item) => ({ name: item.name, value: item.percentage }))
  const categoryConfig = categoryRows.reduce((acc, category, index) => {
    acc[category.name] = { label: category.name, color: pieColors[index % pieColors.length] }
    return acc
  }, {} as Record<string, { label: string; color: string }>)

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Ventas vs. Compras</CardTitle>
          <CardDescription>Valores reales en pesos colombianos por mes</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={salesConfig} className="h-[280px] w-full">
            <BarChart data={chartRows} accessibilityLayer>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="mes" tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="ventas" fill="var(--color-ventas)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="compras" fill="var(--color-compras)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
          {!loading && chartRows.length === 0 && <p className="-mt-36 pb-28 text-center text-sm text-muted-foreground">Todavía no hay ventas ni compras registradas.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ventas por categoría</CardTitle>
          <CardDescription>Participación %</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={categoryConfig} className="mx-auto h-[280px] w-full">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
              <Pie data={categoryRows} dataKey="value" nameKey="name" innerRadius={55} strokeWidth={4}>
                {categoryRows.map((entry, i) => (
                  <Cell key={entry.name} fill={pieColors[i % pieColors.length]} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
          <div className="mt-2 space-y-1">
            {categoryRows.map((c, i) => (
              <div key={c.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: pieColors[i % pieColors.length] }} />
                  {c.name}
                </span>
                <span className="font-medium text-foreground">{c.value}%</span>
              </div>
            ))}
            {!loading && categoryRows.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Todavía no hay categorías vendidas.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

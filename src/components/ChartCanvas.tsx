'use client';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  ArcElement, BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Tooltip, type ChartOptions,
} from 'chart.js';

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export interface Series { label: string; data: number[]; color: string | string[] }

export default function ChartCanvas({
  type = 'bar', labels, series, height = 240, horizontal = false, legend = true, max, integer = false,
}: {
  type?: 'bar' | 'doughnut'; labels: string[]; series: Series[]; height?: number;
  horizontal?: boolean; legend?: boolean; max?: number; integer?: boolean;
}) {
  const data = {
    labels,
    datasets: series.map((s) => ({
      label: s.label, data: s.data, backgroundColor: s.color,
      ...(type === 'bar' ? { borderRadius: 4 } : {}),
    })),
  };
  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: horizontal ? 'y' : 'x',
    plugins: { legend: { display: legend } },
    scales: {
      [horizontal ? 'x' : 'y']: { beginAtZero: true, ...(max ? { max } : {}), ticks: integer ? { stepSize: 1 } : {} },
      [horizontal ? 'y' : 'x']: { ticks: { font: { size: 10 } } },
    },
  };
  return (
    <div style={{ height }}>
      {type === 'bar' ? (
        <Bar data={data} options={options} />
      ) : (
        <Doughnut data={data} options={{ responsive: true, maintainAspectRatio: false }} />
      )}
    </div>
  );
}

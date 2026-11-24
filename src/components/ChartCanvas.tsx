'use client';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  ArcElement, BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Tooltip, type ChartOptions,
} from 'chart.js';
import { PALETTE } from '@/lib/theme';

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

// Aspecto comum a todos os gráficos
ChartJS.defaults.font.family = "'Inter', system-ui, sans-serif";
ChartJS.defaults.color = PALETTE.slate;
ChartJS.defaults.animation = { duration: 1100, easing: 'easeOutQuart' };
ChartJS.defaults.plugins.tooltip.backgroundColor = PALETTE.forestDark;
ChartJS.defaults.plugins.tooltip.padding = 10;
ChartJS.defaults.plugins.tooltip.cornerRadius = 8;
ChartJS.defaults.plugins.tooltip.titleFont = { family: "'Plus Jakarta Sans', 'Inter', sans-serif", weight: 700 };
ChartJS.defaults.plugins.legend.labels.usePointStyle = true;
ChartJS.defaults.plugins.legend.labels.boxWidth = 8;

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
      ...(type === 'bar' ? { borderRadius: 8, borderSkipped: false as const, maxBarThickness: 46 } : { borderWidth: 3, borderColor: '#fff', hoverOffset: 8 }),
    })),
  };
  const grid = { color: 'rgba(15, 61, 38, 0.07)' };
  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: horizontal ? 'y' : 'x',
    plugins: { legend: { display: legend, position: 'bottom' } },
    scales: {
      [horizontal ? 'x' : 'y']: { beginAtZero: true, grid, border: { display: false }, ...(max ? { max } : {}), ticks: integer ? { stepSize: 1 } : {} },
      [horizontal ? 'y' : 'x']: { grid: { display: false }, ticks: { font: { size: 10 } } },
    },
  };
  return (
    <div style={{ height }}>
      {type === 'bar' ? (
        <Bar data={data} options={options} />
      ) : (
        <Doughnut data={data} options={{ responsive: true, maintainAspectRatio: false, cutout: '64%', plugins: { legend: { position: 'bottom' } } }} />
      )}
    </div>
  );
}

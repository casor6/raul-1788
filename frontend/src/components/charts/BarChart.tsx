import { useMemo } from 'react';
import { Card } from 'primereact/card';
import { Chart } from 'primereact/chart';
import { getChartTheme } from './chartTheme';

export type SnailWins = { name: string; wins: number };

type Props = { snails: SnailWins[] };

export default function BarChart({ snails }: Props) {
    const theme = useMemo(getChartTheme, []);

    const data = {
        labels: snails.map((s) => s.name),
        datasets: [{
            label: 'Victorias',
            data: snails.map((s) => s.wins),
            backgroundColor: theme.primary,
            borderRadius: 6,
        }],
    };

    const options = {
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            x: {
                ticks: { color: theme.textSecondary },
                grid: { display: false },
            },
            y: {
                beginAtZero: true,
                suggestedMax: 6,
                ticks: { color: theme.textSecondary, stepSize: 1 },
                grid: { color: theme.border },
            },
        },
    };

    return (
        <Card title="Victorias de hoy" subTitle="6 carreras por día">
            <Chart type="bar" data={data} options={options} className="h-72" />
        </Card>
    );
}
import { useMemo } from 'react';
import { Card } from 'primereact/card';
import { Chart } from 'primereact/chart';
import { getChartTheme } from './chartTheme';

type Props = { won: number; lost: number };

export default function DoughnutChart({ won, lost }: Props) {
    const theme = useMemo(getChartTheme, []);

    const data = {
        labels: ['Ganadas', 'Perdidas'],
        datasets: [{
            data: [won, lost],
            backgroundColor: [theme.green, theme.red],
            borderColor: theme.border,
        }],
    };

    const options = {
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
            legend: { position: 'bottom', labels: { color: theme.text } },
        },
    };

    const total = won + lost;

    return (
        <Card title="Mis apuestas" subTitle={`${total} apuestas`}>
            {total === 0 ? (
                <p className="text-center py-12">Aún no tienes apuestas</p>
            ) : (
                <Chart type="doughnut" data={data} options={options} className="h-72" />
            )}
        </Card>
    );
}
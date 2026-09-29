import { useNavigate } from 'react-router';
import Navbar from '../components/Navbar';
import DoughnutChart from '../components/charts/DoughnutChart';
import BarChart, { type SnailWins } from '../components/charts/BarChart';

const mockUser = { name: 'Juan Pérez', balance: 1250.5 };
const mockBets = { won: 7, lost: 4 };
const mockSnailWins: SnailWins[] = [
    { name: 'Turbo', wins: 2 },
    { name: 'Babas', wins: 1 },
    { name: 'Rayo', wins: 0 },
    { name: 'Concha', wins: 2 },
    { name: 'Lento', wins: 1 },
    { name: 'Espiral', wins: 0 },
];

export default function DashboardPage() {
    const navigate = useNavigate();

    const handleLogout = () => {
        navigate('/login');
    };

    return (
        <div className="min-h-screen">
            <Navbar userName={mockUser.name} balance={mockUser.balance} onLogout={handleLogout} />

            <main className="p-4 md:p-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
                <DoughnutChart won={mockBets.won} lost={mockBets.lost} />
                <BarChart snails={mockSnailWins} />
            </main>
        </div>
    );
}
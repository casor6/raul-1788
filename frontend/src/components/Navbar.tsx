import { Toolbar } from 'primereact/toolbar';
import { Button } from 'primereact/button';

type Props = {
    userName: string;
    balance: number;
    onLogout: () => void;
};

const currency = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

export default function Navbar({ userName, balance, onLogout }: Props) {
    const start = <span className="text-xl font-bold">Snail Race</span>;

    const end = (
        <div className="flex items-center gap-4">
            <span className="hidden sm:inline">{userName}</span>
            <span className="font-semibold">{currency.format(balance)}</span>
            <Button icon="pi pi-sign-out" label="Salir" text onClick={onLogout} />
        </div>
    );

    return <Toolbar start={start} end={end} className="rounded-none border-x-0 border-t-0" />;
}
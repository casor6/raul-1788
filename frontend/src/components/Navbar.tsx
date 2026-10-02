import { Toolbar } from 'primereact/toolbar';
import { Button } from 'primereact/button';
import { useState } from 'react';
import AddBalanceModal from './AddBalanceModal';
import { currency } from '../utils';

type Props = {
    userName: string;
    balance: number;
    onLogout: () => void;
};

export default function Navbar({ userName, balance, onLogout }: Props) {
    const start = <span className="text-xl font-bold">Carreras de Caracoles</span>;
    const [visible, setVisible] = useState<boolean>(false);

    const end = (
        <div className="flex items-center gap-4">
            <span className="hidden sm:inline">{userName}</span>
            <span className="font-semibold">{currency.format(balance)}</span>
            <AddBalanceModal visible={visible} setVisible={setVisible} />
            <Button icon="pi pi-dollar" label="Agregar Saldo" size="small" onClick={() => setVisible(true)} />
            <Button icon="pi pi-sign-out" label="Salir" text onClick={onLogout} />
        </div>
    );

    return <Toolbar start={start} end={end} className="rounded-none border-x-0 border-t-0" />;
}
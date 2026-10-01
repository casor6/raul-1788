import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { useAuth } from '../context/AuthContext';
import { currency } from '../utils';
import { InputNumber } from 'primereact/inputnumber';
import { type InputNumberValueChangeEvent } from 'primereact/inputnumber';
import { useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { InputMask } from 'primereact/inputmask';
import { useRecharge } from '../hooks/useRecharge';

export default function AddBalanceModal({ visible, setVisible }: { visible: boolean; setVisible: (visible: boolean) => void }) {
    const { balance } = useAuth();

    const amounts: number[] = [10, 50, 100, 500];
    const [amount, setAmount] = useState<number>(0);
    const [cardName, setCardName] = useState<string>('');
    const [cardNumber, setCardNumber] = useState<string>('');
    const [cardExpiration, setCardExpiration] = useState<string>('');
    const [cardCVV, setCardCVV] = useState<string>('');
    const [formError, setFormError] = useState<string>('');

    const { recharge, loading, error: rechargeError } = useRecharge();
    const cleanForm = () => {
        setAmount(10);
        setCardName('');
        setCardNumber('');
        setCardExpiration('');
        setCardCVV('');
        setFormError('');
    }
    const addRecharge = async () => {
        if (amount < 10 || !cardName || !cardNumber || !cardExpiration || !cardCVV) {
            setFormError('Todos los campos son requeridos');
            return;
        }
        setFormError('');
        try {
            const response = await recharge({ amount, cardName, cardNumber: cardNumber.replaceAll(/\s|-|\//g, ''), cardExpiration, cardCVV });
            console.log(response);
            cleanForm();
            setVisible(false);
        } catch (error) {
            setFormError(error.message);
        }
    }


    const footerContent = (
        <div>
            <Button label="Cancelar" icon="pi pi-times" onClick={() => setVisible(false)} className="p-button-text" />
            <Button label="Agregar" icon="pi pi-check" onClick={addRecharge} loading={loading} />
        </div>
    );



    return (
        <div className="card flex justify-center">
            <Dialog header="Agregar Saldo" visible={visible} style={{ width: '50vw' }} onHide={() => { if (!visible) return; setVisible(false); }} footer={footerContent}>
                <div className='flex flex-col gap-4'>
                    <div className='flex justify-between w-full'>
                        <span className="text-xl font-semibold">Saldo Actual:</span>
                        <span className="text-xl font-semibold">{currency.format(balance ?? 0)}</span>
                    </div>
                    <span>Selecciona o ingresa un monto</span>
                    <div className="flex w-full gap-2 justify-around">
                        {amounts.map((amount) => (
                            <Button key={amount} label={currency.format(amount)} onClick={() => setAmount(amount)} />
                        ))}
                    </div>
                    {
                        rechargeError && <span className="text-red-500">{rechargeError}</span>
                    }
                    {
                        formError && <span className="text-red-500">{formError}</span>
                    }
                    <div className="flex flex-col">
                        <label htmlFor="integeronly" className="font-bold block mb-2">Otro monto (min 10)</label>
                        <InputNumber inputId="integeronly" value={amount} onValueChange={(e: InputNumberValueChangeEvent) => setAmount(e.value ?? 0)} placeholder='Ej. 750' min={10} />
                    </div>
                    <div className='flex flex-col'>
                        <label htmlFor="cardName" className="font-bold block mb-2">Nombre en la tarjeta</label>
                        <InputText id="cardName" value={cardName} onChange={(e) => setCardName(e.target.value)} placeholder='Ej. Juan Perez' />
                    </div>
                    <div className='flex gap-3 w-full'>
                        <div className='flex flex-1 flex-col'>
                            <label htmlFor="cardNumber" className="font-bold block mb-2">Numero de tarjeta</label>
                            <InputMask id="cardNumber" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} placeholder='Ej. 1234 5678 9123 4567' mask='9999-9999-9999-9999' />
                        </div>
                        <div className='flex flex-1 flex-col'>
                            <label htmlFor="cardExpiration" className="font-bold block mb-2">Fecha de expiracion</label>
                            <InputMask id="cardExpiration" mask="99/99" variant='outlined' value={cardExpiration} onChange={(e) => setCardExpiration(e.target.value)} placeholder='Ej. 12/26' />
                        </div>
                        <div className='flex flex-1 flex-col'>
                            <label htmlFor="cardCVV" className="font-bold block mb-2">CVV</label>
                            <InputText id="cardCVV" value={cardCVV} onChange={(e) => setCardCVV(e.target.value)} placeholder='123' maxLength={4} />
                        </div>
                    </div>
                </div>
            </Dialog>
        </div>
    )
}

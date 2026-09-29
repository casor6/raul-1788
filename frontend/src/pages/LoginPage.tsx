import { Card } from "primereact/card"
import { Button } from "primereact/button"
import { InputText } from "primereact/inputtext"
import { Password } from "primereact/password"
import type { FormEvent } from "react";
import { useState } from "react";
import { Link } from "react-router";

type FormValues = {
    email: string;
    password: string;
}
export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
    };

    function validate(values: FormValues) {
        const errors: Partial<Record<keyof FormValues, string>> = {};
        if (!values.email) errors.email = "El correo es requerido";
        else if (!values.email.includes("@")) errors.email = "El correo es inválido";

        if (!values.password) errors.password = "La contraseña es requerida";

        return errors;
    }

    const errors = validate({ email, password });
    const isValid = Object.keys(errors).length === 0;
    return <main className="min-h-screen flex items-center justify-center p-4">
        <Card title="Login" subTitle="Ingrese sus credenciales" className="w-full max-w-md">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                    <label htmlFor="email">Correo</label>
                    <InputText id="email" type="email" value={email}
                        onChange={(e) => setEmail(e.target.value)} />
                </div>

                <div className="flex flex-col gap-2">
                    <label htmlFor="password">Contraseña</label>
                    <Password inputId="password" value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        feedback={false} toggleMask
                        className="w-full" inputClassName="w-full" pt={{ iconField: { root: { className: 'w-full' } } }} />
                </div>

                <Button type="submit" label="Entrar" className="w-full" disabled={!isValid} />

                <p className="text-center text-sm">
                    ¿No tienes cuenta? <Link to="/register" className="text-blue-600">Regístrate</Link>
                </p>
            </form>
        </Card>
    </main>
}
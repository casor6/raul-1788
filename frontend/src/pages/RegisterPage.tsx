import { Card } from "primereact/card"
import { Button } from "primereact/button"
import { InputText } from "primereact/inputtext"
import { Password } from "primereact/password"
import type { FormEvent } from "react";
import { useState } from "react";
import { Link } from "react-router";

type FormValues = {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
}
export default function RegisterPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [touched, setTouched] = useState<Partial<Record<keyof FormValues, boolean>>>({});
    const [submitted, setSubmitted] = useState(false);

    const markTouched = (field: keyof FormValues) => () =>
        setTouched((prev) => ({ ...prev, [field]: true }));

    const showError = (field: keyof FormValues) =>
        (touched[field] || submitted) ? errors[field] : undefined;

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        setSubmitted(true);

        if (!isValid) return;
        console.log("Enviar al backend:", { name, email, password });
    };

    function validate(values: FormValues) {
        const errors: Partial<Record<keyof FormValues, string>> = {};
        if (!values.name) errors.name = "El nombre es requerido";

        if (!values.email) errors.email = "El correo es requerido";
        else if (!values.email.includes("@")) errors.email = "El correo es inválido";

        if (!values.password) errors.password = "La contraseña es requerida";
        else if (values.password.length < 6) errors.password = "Mínimo 6 caracteres";

        if (!values.confirmPassword) errors.confirmPassword = "Confirma tu contraseña";
        else if (values.password !== values.confirmPassword) errors.confirmPassword = "Las contraseñas no coinciden";

        return errors;
    }

    const errors = validate({ name, email, password, confirmPassword });
    const isValid = Object.keys(errors).length === 0;
    return <main className="min-h-screen flex items-center justify-center p-4">
        <Card title="Registro" subTitle="Ingrese sus credenciales" className="w-full max-w-md">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                    <label htmlFor="name">Nombre Completo</label>
                    <InputText id="name" type="text" value={name}
                        onChange={(e) => setName(e.target.value)} onBlur={markTouched("name")} />
                    {showError("name") && (
                        <p className="text-red-500 text-sm">{errors.name}</p>
                    )}
                </div>
                <div className="flex flex-col gap-2">
                    <label htmlFor="email">Correo</label>
                    <InputText id="email" type="email" value={email}
                        onChange={(e) => setEmail(e.target.value)} onBlur={markTouched("email")} />
                    {showError("email") && (
                        <p className="text-red-500 text-sm">{errors.email}</p>
                    )}
                </div>
                <div className="flex flex-col gap-2">
                    <label htmlFor="password">Contraseña</label>
                    <Password inputId="password" value={password}
                        onChange={(e) => setPassword(e.target.value)} onBlur={markTouched("password")} feedback={false} toggleMask
                        className="w-full" inputClassName="w-full" pt={{ iconField: { root: { className: 'w-full' } } }} />
                    {showError("password") && (
                        <p className="text-red-500 text-sm">{errors.password}</p>
                    )}
                </div>
                <div className="flex flex-col gap-2">
                    <label htmlFor="confirmPassword">Confirmar Contraseña</label>
                    <Password inputId="confirmPassword" value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)} onBlur={markTouched("confirmPassword")} feedback={false} toggleMask
                        className="w-full" inputClassName="w-full" pt={{ iconField: { root: { className: 'w-full' } } }} />
                    {showError("confirmPassword") && (
                        <p className="text-red-500 text-sm">{errors.confirmPassword}</p>
                    )}
                </div>

                <Button type="submit" label="Registrarse" className="w-full" disabled={!isValid} loading={false} />

                <p className="text-center text-sm">
                    ¿Ya tienes cuenta? <Link to="/login" className="text-blue-600">Inicia Sesión</Link>
                </p>
            </form>
        </Card>
    </main>
}
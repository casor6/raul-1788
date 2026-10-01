# Apuestas en carreras de caracoles

Aplicación web full-stack con temática de apuestas en carreras de caracoles: registro e inicio de sesión, dashboard con estadísticas simuladas y recarga de saldo mediante **SnailPay**, una pasarela de pagos simulada.

| Carpeta | Stack | Documentación |
|---|---|---|
| [`backend/`](backend/) | Node.js, Express 5, TypeScript, JWT, bcrypt | [backend/README.md](backend/README.md) |
| [`frontend/`](frontend/) | React 19, TypeScript, Vite, PrimeReact, Tailwind, Chart.js | [frontend/README.md](frontend/README.md) |

---

## Requisitos

- Node.js 22 o superior
- npm

## Puesta en marcha

Se necesitan dos terminales: una para el backend y otra para el frontend.

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Queda escuchando en `http://localhost:<PORT>` (por defecto `3000`, o el `PORT` definido en `.env`).

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env
```

Edita `frontend/.env` para que apunte al backend, sin `/` al final:

```env
VITE_API_URL=http://localhost:3000
```

```bash
npm run dev
```

Abre `http://localhost:5173`.

---

## Pruebas automatizadas

```bash
cd backend
npm test
```

Pruebas de integración con Vitest y supertest sobre registro, login y recargas con SnailPay (autenticación, validaciones y todas las tarjetas de prueba). No requieren servidor corriendo ni `.env`. El detalle está en [backend/README.md](backend/README.md#pruebas-automatizadas).

Verificaciones del frontend:

```bash
cd frontend
npm run lint
npm run build
```

---

## SnailPay: tarjetas de prueba

| Número de tarjeta     | CVV        | Vencimiento | HTTP | `status_detail`      |
|-----------------------|------------|-------------|------|----------------------|
| `1234123412341234`    | `543`      | `12/26`     | 200  | `approved`           |
| `1234123412341234`    | otro       | `12/26`     | 402  | `incorrect_cvv`      |
| `1234123412341234`    | `543`      | otro        | 402  | `incorrect_expiry`   |
| `4000000000000002`    | cualquiera | cualquiera  | 402  | `card_declined`      |
| `4000000000009995`    | cualquiera | cualquiera  | 402  | `insufficient_funds` |
| `1234123412341231`    | cualquiera | cualquiera  | 402  | `incorrect_cvv`      |
| `4242424242424242`    | cualquiera | cualquiera  | 500  | `service_error` (error del sistema) |
| Cualquier otro número | cualquiera | cualquiera  | 402  | `unknown_card`       |

"Cualquiera" significa cualquier fecha `MM/AA` válida y no vencida, y cualquier CVV de 3 o 4 dígitos.

Formato de las respuestas, errores de validación y ejemplos con curl: [backend/README.md](backend/README.md#servicios).

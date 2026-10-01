# Snail Race — Frontend

Aplicación web en **React 19 + TypeScript + Vite**. Permite registrarse, iniciar sesión, ver un dashboard con estadísticas de apuestas y recargar saldo con tarjeta a través del backend (**SnailPay**).

Consume la API de `snail-race-backend`.

---

## Stack

| Herramienta | Uso |
|---|---|
| React 19 + TypeScript | UI |
| Vite 8 | Dev server y build |
| React Router 8 | Rutas y protección de rutas |
| PrimeReact 10 + PrimeIcons | Componentes de UI (tema `lara-dark-blue`) e iconos |
| Tailwind CSS 4 | Utilidades de estilo |
| Chart.js | Gráficas del dashboard |

---

## Requisitos

- Node.js 22 o superior
- npm
- Backend `snail-race-backend` corriendo

## Instalación

```bash
cd snail-race-frontend
npm install
cp .env.example .env
```

### Variables de entorno

| Variable       | Descripción                         | Ejemplo                 |
|----------------|-------------------------------------|-------------------------|
| `VITE_API_URL` | URL base del backend, **sin `/` al final** | `http://localhost:3000` |

```env
VITE_API_URL=http://localhost:3000
```

- El puerto debe coincidir con el `PORT` del backend.

## Ejecución

```bash
npm run dev
```

Abre `http://localhost:5173`.

### Scripts

| Script            | Qué hace                                        |
|-------------------|-------------------------------------------------|
| `npm run dev`     | Servidor de desarrollo con recarga en caliente  |
| `npm run build`   | Typecheck (`tsc -b`) y build de producción en `dist/` |
| `npm run preview` | Sirve el build de `dist/` para probarlo         |
| `npm run lint`    | ESLint                                          |

---

## Rutas

| Ruta         | Acceso                 | Pantalla                                     |
|--------------|------------------------|----------------------------------------------|
| `/login`     | Solo sin sesión        | Inicio de sesión                             |
| `/register`  | Solo sin sesión        | Registro                                     |
| `/dashboard` | Requiere sesión        | Dashboard con gráficas y recarga de saldo    |
| `/` y cualquier otra | —              | Redirige a `/dashboard`                      |

- Sin sesión, `/dashboard` redirige a `/login`.
- Con sesión, `/login` y `/register` redirigen a `/dashboard`.

---

## Funcionalidades

### Registro (`/register`)

| Campo                 | Validación en el cliente               |
|-----------------------|----------------------------------------|
| Nombre completo       | Requerido                              |
| Correo                | Requerido, debe contener `@`           |
| Contraseña            | Requerida, mínimo 6 caracteres         |
| Confirmar contraseña  | Requerida, igual a la contraseña       |

- Los errores se muestran al salir de cada campo o al enviar.
- El botón queda deshabilitado mientras el formulario no sea válido.
- Envía `POST /auth/register` con `{ name, email, password }`. Si responde bien, guarda la sesión y entra a `/dashboard`.
- Los errores del backend (por ejemplo `User already exists`) se muestran arriba del formulario.

### Inicio de sesión (`/login`)

| Campo       | Validación en el cliente      |
|-------------|-------------------------------|
| Correo      | Requerido, debe contener `@`  |
| Contraseña  | Requerida                     |

Envía `POST /auth/login`. Si responde bien, guarda la sesión y entra a `/dashboard`. Si las credenciales son incorrectas, muestra `Invalid email or password`.

### Sesión

- El JWT se guarda en `localStorage` con la clave `token`. Nombre, email y saldo se obtienen decodificando el token en el navegador.
- El saldo mostrado se guarda en `localStorage` con la clave `balance`.
- Al cargar la app, si el token ya expiró (24 h), se borra y se pide iniciar sesión de nuevo.
- Todas las peticiones envían `Authorization: Bearer <token>`.
- Si el backend responde `401` a una petición que llevaba token, se cierra la sesión automáticamente.
- **Salir** borra `token` y `balance` del `localStorage`.

### Dashboard (`/dashboard`)

- **Barra superior:** nombre del usuario, saldo, botón **Agregar Saldo** y botón **Salir**.
- **Mis apuestas:** dona con apuestas ganadas y perdidas.
- **Victorias de hoy:** barras con victorias por caracol (6 carreras por día).

> Las gráficas usan **datos de ejemplo fijos** en `src/pages/Dashboard.tsx`; todavía no hay endpoint de apuestas ni de carreras.

### Agregar saldo (modal)

Se abre con **Agregar Saldo** en la barra superior.

| Campo                 | Entrada                                   | Se envía como       |
|-----------------------|-------------------------------------------|---------------------|
| Monto                 | Botones rápidos $10, $50, $100, $500, o monto libre (mínimo 10) | `amount` |
| Nombre en la tarjeta  | Texto libre                               | `cardName`          |
| Número de tarjeta     | Máscara `9999-9999-9999-9999`             | `cardNumber` (sin guiones ni espacios) |
| Fecha de expiración   | Máscara `MM/AA`                           | `cardExpiration`    |
| CVV                   | Hasta 4 caracteres                        | `cardCVV`           |

- Todos los campos son obligatorios y el monto mínimo es 10. Si falta algo, muestra `Todos los campos son requeridos`.
- Envía `POST /snailpay/recharge`. La pasarela simulada tarda ~1 s; mientras tanto el botón **Agregar** muestra un indicador de carga.
- **Si el pago se aprueba:** suma el monto al saldo mostrado, limpia el formulario y cierra el modal.
- **Si falla:** el modal sigue abierto y muestra el mensaje de error.

Mensajes de error:

| Respuesta del backend                     | Mensaje en pantalla                                          |
|-------------------------------------------|--------------------------------------------------------------|
| `400` con errores de tarjeta              | El primer error de validación (ej. `La tarjeta está vencida`) |
| `card_declined`                           | La tarjeta fue rechazada                                     |
| `insufficient_funds`                      | Fondos insuficientes                                         |
| `incorrect_cvv`                           | El CVV es incorrecto                                         |
| `incorrect_expiry`                        | La fecha de expiración es incorrecta                         |
| `unknown_card`                            | Tarjeta no reconocida                                        |
| `service_error`                           | El servicio de pagos no está disponible, intenta más tarde   |

---

## Tarjetas de prueba

Se capturan en el modal tal cual; la máscara agrega los guiones y el frontend los quita antes de enviar.

| Número de tarjeta     | CVV        | Vencimiento | Resultado en pantalla                                     |
|-----------------------|------------|-------------|-----------------------------------------------------------|
| `1234-1234-1234-1234` | `543`      | `12/26`     | Pago aprobado: se suma el saldo y se cierra el modal       |
| `1234-1234-1234-1234` | otro       | `12/26`     | El CVV es incorrecto                                      |
| `1234-1234-1234-1234` | `543`      | otro        | La fecha de expiración es incorrecta                      |
| `4000-0000-0000-0002` | cualquiera | cualquiera* | La tarjeta fue rechazada                                  |
| `4000-0000-0000-9995` | cualquiera | cualquiera* | Fondos insuficientes                                      |
| `1234-1234-1234-1231` | cualquiera | cualquiera* | El CVV es incorrecto                                      |
| `4242-4242-4242-4242` | cualquiera | cualquiera* | El servicio de pagos no está disponible, intenta más tarde |
| Cualquier otro número | cualquiera | cualquiera* | Tarjeta no reconocida                                     |

\* Debe ser una fecha `MM/AA` válida y no vencida, y el CVV debe tener 3 o 4 dígitos; si no, se muestra el error de validación correspondiente.

> La única tarjeta aprobada vence en `12/26`; a partir de enero de 2027 aparecerá `La tarjeta está vencida`.

---

## API consumida

| Método | Endpoint             | Desde                    |
|--------|----------------------|--------------------------|
| POST   | `/auth/register`     | `src/api/authService.ts` |
| POST   | `/auth/login`        | `src/api/authService.ts` |
| POST   | `/snailpay/recharge` | `src/api/paymentService.ts` |

Todas pasan por `apiFetch` (`src/api/http.ts`), que agrega el token, convierte las respuestas no exitosas en `ApiError` (con `status`, `message` y el cuerpo en `data`) y cierra la sesión ante un `401`.

---

## Estructura

```
snail-race-frontend/
└── src/
    ├── main.tsx                    # Providers (PrimeReact, Auth) y router
    ├── router.tsx                  # Definición de rutas
    ├── index.css                   # Tailwind, tema PrimeReact y PrimeIcons
    ├── api/
    │   ├── http.ts                 # apiFetch, ApiError, manejo del token
    │   ├── authService.ts          # Login y registro
    │   └── paymentService.ts       # Recarga de saldo
    ├── context/
    │   ├── AuthContext.ts          # Contexto y hook useAuth
    │   └── AuthProvider.tsx        # Sesión, usuario y saldo
    ├── routes/
    │   ├── ProtectedRoute.tsx      # Requiere sesión
    │   └── PublicRoute.tsx         # Solo sin sesión
    ├── hooks/useRecharge.ts        # Lógica de recarga y mensajes de error
    ├── pages/
    │   ├── LoginPage.tsx
    │   ├── RegisterPage.tsx
    │   └── Dashboard.tsx
    ├── components/
    │   ├── Navbar.tsx
    │   ├── AddBalanceModal.tsx
    │   └── charts/                 # DoughnutChart, BarChart, tema de colores
    └── utils/index.ts              # Formato de moneda MXN
```

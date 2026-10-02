# Backend

API REST en **Node.js + Express 5 + TypeScript**. Ofrece registro e inicio de sesión con JWT, y un servicio de recarga de saldo (**SnailPay**) con una pasarela de pagos simulada.

Los usuarios se guardan en un archivo JSON local (`data/users.json`); no se necesita base de datos.

---

## Requisitos

- Node.js 22 o superior
- npm

## Instalación

```bash
cd backend
npm install
cp .env.example .env
```

### Variables de entorno

| Variable     | Descripción                     | Valor por defecto si no se define |
|--------------|---------------------------------|-----------------------------------|
| `PORT`       | Puerto del servidor             | `3000`                            |
| `JWT_SECRET` | Secreto para firmar los tokens  | `replace_with_a_secret`           |
| `USERS_FILE` | Ruta del archivo de usuarios (la usan los tests) | `data/users.json`  |
| `PAYMENT_DELAY_MS` | Retardo simulado de la pasarela, en ms. Los tests usan `0`; un valor alto simula un timeout | `1000` |

Cómo se cargan:

- **Desarrollo (`npm run dev`):** se leen del archivo `.env` con la opción nativa de Node `--env-file`.
- **Producción (`npm start`):** se leen del entorno del sistema (por ejemplo, las variables de Railway). En este modo el `.env` **no** se carga.

## Ejecución

```bash
npm run dev
```

Levanta el servidor con `tsx` en modo watch. En consola aparece:

```
Server is running on port http://localhost:3000
```

### Scripts

| Script          | Qué hace                                  |
|-----------------|-------------------------------------------|
| `npm run dev`   | Servidor en desarrollo con recarga (tsx), carga `.env` |
| `npm run build` | Compila `src/` a `dist/` con `tsc`        |
| `npm start`     | Ejecuta `dist/index.js` (usa las variables del entorno) |
| `npm test`      | Corre las pruebas automatizadas con Vitest |

### Producción local

```bash
npm run build
PORT=4000 JWT_SECRET=mi_secreto npm start
```

### Datos

- Archivo: `data/users.json`.
- Si no existe, se crea solo al registrar el primer usuario.
- Cada usuario nuevo empieza con `balance: 0`.

---

## Servicios

URL base: `http://localhost:<PORT>`

Todas las peticiones y respuestas usan JSON (`Content-Type: application/json`). CORS está abierto a cualquier origen.

| Método | Ruta                 | Auth       | Descripción                       |
|--------|----------------------|------------|-----------------------------------|
| GET    | `/`                  | No         | Health check                      |
| POST   | `/auth/register`     | No         | Registrar usuario                 |
| POST   | `/auth/login`        | No         | Iniciar sesión, devuelve JWT      |
| POST   | `/snailpay/recharge` | Bearer JWT | Recargar saldo con tarjeta        |

---

### `GET /`

Health check.

**Respuesta `200`** (texto plano):

```
OK
```

---

### `POST /auth/register`

Registra un usuario nuevo.

**Body:**

| Campo      | Tipo   | Requerido | Reglas                                   |
|------------|--------|-----------|------------------------------------------|
| `name`     | string | Sí        |                                          |
| `email`    | string | Sí        | Formato válido; se guarda en minúsculas y sin espacios |
| `password` | string | Sí        | Mínimo 6 caracteres                      |

```json
{
  "name": "Juan Camaney",
  "email": "juan@mail.com",
  "password": "secreto123"
}
```

**Respuesta `201`**: el usuario queda registrado y con la sesión iniciada. Se devuelve un JWT con la misma forma que en `/auth/login`:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errores:**

| Código | `message`                                       | Causa                          |
|--------|-------------------------------------------------|--------------------------------|
| 400    | `Name, email and password are required`         | Falta algún campo              |
| 400    | `Invalid email format`                          | Email mal formado              |
| 400    | `Password must be at least 6 characters long`   | Contraseña corta               |
| 400    | `User already exists`                           | Email ya registrado            |

---

### `POST /auth/login`

Inicia sesión y devuelve un JWT válido por **24 horas**.

**Body:**

| Campo      | Tipo   | Requerido |
|------------|--------|-----------|
| `email`    | string | Sí        |
| `password` | string | Sí        |

```json
{
  "email": "juan@mail.com",
  "password": "secreto123"
}
```

**Respuesta `200`:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Payload del token** (decodificado):

```json
{
  "id": "1e18301b-04f7-43e7-b21b-cf5d27768ebb",
  "email": "juan@mail.com",
  "name": "Juan Camaney",
  "balance": 0,
  "iat": 1759300000,
  "exp": 1759386400
}
```

> `balance` en el token es el saldo **al momento del login**. No se actualiza tras una recarga; para ver el saldo nuevo hay que volver a iniciar sesión. No existe un endpoint para consultar el saldo.

**Errores:**

| Código | `message`                          | Causa                                 |
|--------|------------------------------------|---------------------------------------|
| 400    | `Email and password are required`  | Falta algún campo                     |
| 401    | `Invalid email or password`        | Usuario inexistente o contraseña mala |

---

### `POST /snailpay/recharge`

Recarga saldo al usuario autenticado cobrando a una tarjeta mediante la pasarela simulada. La pasarela tarda **~1 segundo** en responder (configurable con `PAYMENT_DELAY_MS`).

**Headers:**

```
Authorization: Bearer <token>
```

Sin token, con token inválido o expirado → `401 { "message": "Unauthorized" }`.

**Body:**

| Campo            | Tipo   | Requerido | Reglas                                                        |
|------------------|--------|-----------|---------------------------------------------------------------|
| `amount`         | number | Sí        | Número mayor a 0                                              |
| `cardNumber`     | string | Sí        | 13 a 19 dígitos. **Enviar sin espacios ni guiones** (ver nota) |
| `cardName`       | string | Sí        | Mínimo 2 caracteres                                           |
| `cardExpiration` | string | Sí        | Formato `MM/AA`, mes 01–12, no vencida                        |
| `cardCVV`        | string | Sí        | 3 o 4 dígitos                                                 |

```json
{
  "amount": 150,
  "cardNumber": "1234123412341234",
  "cardName": "Juan Camaney",
  "cardExpiration": "12/26",
  "cardCVV": "543"
}
```

> **Nota sobre `cardNumber`:** la validación acepta espacios y guiones (`1234 1234 1234 1234`), pero a la pasarela se le envía el valor original. Con espacios o guiones la tarjeta no se reconoce y la respuesta es `unknown_card`.

#### Validación de datos (antes de cobrar)

`amount` inválido → **`400`**:

```json
{ "message": "Invalid amount" }
```

Datos de tarjeta inválidos → **`400`**, con un error por campo:

```json
{
  "message": "Datos de tarjeta inválidos",
  "errors": {
    "cardNumber": "Número de tarjeta inválido",
    "cardName": "Nombre del titular requerido",
    "cardExpiration": "Formato esperado MM/AA",
    "cardCVV": "CVV inválido"
  }
}
```

Posibles mensajes de `cardExpiration`: `Formato esperado MM/AA`, `Mes inválido`, `La tarjeta está vencida`.

Usuario del token ya no existe → **`404 { "message": "User not found" }`**.

#### Respuesta de la pasarela

Todas las respuestas de cobro (éxito o fallo) tienen esta forma:

| Campo                | Tipo   | Descripción                                             |
|----------------------|--------|---------------------------------------------------------|
| `payer_id`           | string | ID del usuario                                          |
| `payer_email`        | string | Email del usuario                                       |
| `card_number`        | string | Número de tarjeta enviado (dato ficticio)               |
| `card_cvv`           | string | CVV enviado (dato ficticio)                             |
| `id`                 | string | ID de la transacción (UUID; en algunos casos con prefijo `sim_`) |
| `status`             | string | `success`, `failed` o `error`                           |
| `status_detail`      | string | Detalle del resultado (ver tabla de tarjetas)           |
| `date_created`       | string | Fecha ISO 8601                                          |
| `transaction_amount` | number | Monto cobrado                                           |
| `authorization_code` | string | Solo en éxito                                           |
| `reference`          | string | Solo en éxito                                           |

| `status`  | Código HTTP | ¿Suma saldo? |
|-----------|-------------|--------------|
| `success` | 200         | Sí, suma `amount` al `balance` |
| `failed`  | 402         | No           |
| `error`   | 500         | No           |

**Éxito `200`:**

```json
{
  "payer_id": "1e18301b-04f7-43e7-b21b-cf5d27768ebb",
  "payer_email": "juan@mail.com",
  "card_number": "1234123412341234",
  "card_cvv": "543",
  "status": "success",
  "status_detail": "approved",
  "id": "sim_5b7c0f7e-1d2a-4c0e-9a2b-3f1e2d4c5b6a",
  "date_created": "2026-10-01T18:00:00.000Z",
  "authorization_code": "a1b2c3d4-...",
  "reference": "e5f6a7b8-...",
  "transaction_amount": 150
}
```

**Rechazo `402`:**

```json
{
  "payer_id": "1e18301b-04f7-43e7-b21b-cf5d27768ebb",
  "payer_email": "juan@mail.com",
  "card_number": "4000000000009995",
  "card_cvv": "123",
  "status": "failed",
  "status_detail": "insufficient_funds",
  "id": "sim_9c8d7e6f-...",
  "date_created": "2026-10-01T18:00:00.000Z",
  "transaction_amount": 150
}
```

**Error de servicio `500`:**

```json
{
  "payer_id": "1e18301b-04f7-43e7-b21b-cf5d27768ebb",
  "payer_email": "juan@mail.com",
  "card_number": "4242424242424242",
  "card_cvv": "123",
  "status": "error",
  "status_detail": "service_error",
  "id": "0a1b2c3d-...",
  "date_created": "2026-10-01T18:00:00.000Z",
  "transaction_amount": 150
}
```

### Simular un timeout

Para probar cómo responde el cliente cuando SnailPay tarda demasiado, levanta el backend con un retardo mayor al timeout del frontend (10 s):

```bash
PAYMENT_DELAY_MS=15000 npm run dev
```

Cualquier recarga tardará 15 s; el frontend corta la petición a los 10 s y muestra un mensaje de timeout. El backend termina de procesar el cobro igualmente.

---

## Tarjetas de prueba

La pasarela es simulada: el resultado depende solo del número de tarjeta. Todas deben pasar primero la validación de formato (nombre ≥ 2 caracteres, fecha `MM/AA` no vencida, CVV de 3–4 dígitos).

| Número de tarjeta    | CVV   | Vencimiento | HTTP | `status`  | `status_detail`      | Resultado                    |
|----------------------|-------|-------------|------|-----------|----------------------|------------------------------|
| `1234123412341234`   | `543` | `12/26`     | 200  | `success` | `approved`           | Pago aprobado, suma saldo    |
| `1234123412341234`   | ≠ `543` | cualquiera | 402  | `failed`  | `incorrect_cvv`      | CVV incorrecto               |
| `1234123412341234`   | `543` | ≠ `12/26`   | 402  | `failed`  | `incorrect_expiry`   | Vencimiento incorrecto       |
| `4000000000000002`   | cualquiera | cualquiera | 402 | `failed` | `card_declined`     | Tarjeta rechazada            |
| `4000000000009995`   | cualquiera | cualquiera | 402 | `failed` | `insufficient_funds`| Fondos insuficientes         |
| `1234123412341231`   | cualquiera | cualquiera | 402 | `failed` | `incorrect_cvv`     | CVV incorrecto (siempre)     |
| `4242424242424242`   | cualquiera | cualquiera | 500 | `error`  | `service_error`     | Falla del servicio de pagos  |
| Cualquier otro número | cualquiera | cualquiera | 402 | `failed` | `unknown_card`      | Tarjeta no reconocida        |

Notas:

- En `1234123412341234` se valida primero el CVV y después el vencimiento.
- La única tarjeta aprobada vence en `12/26`; a partir de enero de 2027 la validación la marcará como vencida (`La tarjeta está vencida`).
- `authorization_code` y `reference` solo vienen en la respuesta aprobada.

---

## Pruebas automatizadas

Pruebas de integración con **Vitest** y **supertest**: hacen peticiones HTTP reales a la app de Express sin levantar el puerto.

```bash
npm test
```

No requieren servidor corriendo ni `.env`. Duran ~4 segundos.

### Qué cubren

| Archivo | Endpoint | Casos |
|---|---|---|
| `tests/auth.test.ts` | `POST /auth/register` | Registro válido con token y saldo 0; no expone el password; email normalizado a minúsculas y sin espacios; campos faltantes; body vacío; emails inválidos; password menor a 6 caracteres; email duplicado |
| | `POST /auth/login` | Login válido con token que vence en 24 h; email con mayúsculas y espacios; campos faltantes; email no registrado; password incorrecta |
| `tests/payments.test.ts` | `POST /snailpay/recharge` (autenticación) | Sin token; token mal formado; firmado con otro secreto; expirado; usuario inexistente (404) |
| | `POST /snailpay/recharge` (datos inválidos) | Monto faltante, cero, negativo o string; cada error de tarjeta (número, nombre, formato de fecha, mes inválido, vencida, CVV); todos los errores a la vez; el saldo no cambia |
| | `POST /snailpay/recharge` (tarjetas) | Todas las tarjetas de prueba con su código HTTP y `status_detail`; el saldo sube solo con `approved`; recargas acumuladas; número con espacios → `unknown_card` |

### Cómo están aisladas

- **Datos:** cada archivo de test usa su propio `users.json` temporal (`USERS_FILE`), que se borra al terminar. `data/users.json` no se toca.
- **Pasarela:** `PAYMENT_DELAY_MS=0` quita el retardo de 1 segundo.
- **Fecha:** los tests de pagos congelan la fecha en el 15 de junio de 2026, así que el vencimiento `12/26` de la tarjeta aprobada no los rompe con el paso del tiempo.
- **JWT:** se usa `JWT_SECRET=test_secret`.

La configuración está en `vitest.config.ts` y `tests/setup.ts`.

---

## Ejemplos con curl

```bash
# Registro
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Juan Camaney","email":"juan@mail.com","password":"secreto123"}'

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"juan@mail.com","password":"secreto123"}'

# Recarga aprobada
curl -X POST http://localhost:3000/snailpay/recharge \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"amount":150,"cardNumber":"1234123412341234","cardName":"Juan Camaney","cardExpiration":"12/26","cardCVV":"543"}'
```
---

## Estructura

```
backend/
├── data/users.json                 # Persistencia local de usuarios
├── vitest.config.ts                # Configuración de las pruebas
├── tests/
│   ├── setup.ts                    # users.json temporal por archivo de test
│   ├── helpers.ts                  # Crear usuario, decodificar token, leer saldo
│   ├── auth.test.ts                # Registro y login
│   └── payments.test.ts            # Recargas y tarjetas de prueba
└── src/
    ├── index.ts                    # Arranque del servidor (listen)
    ├── app.ts                      # App de Express: CORS, JSON y rutas
    ├── services/
    │   ├── Auth.ts                 # /auth/register, /auth/login
    │   ├── SnailPay.ts             # /snailpay/recharge
    │   └── ProcessPayment.ts       # Pasarela simulada y tarjetas de prueba
    ├── middlewares/RequireAuth.ts  # Verificación del Bearer token
    ├── shared/jwt.ts               # Firma y verificación de JWT
    ├── utils/CardValidation.ts     # Validación de datos de tarjeta
    ├── repository/UserLocalRepository.ts  # Lectura/escritura de users.json
    └── interfaces/                 # Tipos de usuario y Express
```

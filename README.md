# Devsoul Gestión

Sistema de gestión interna de Devsoul: clientes, softwares, contratos, facturación, finanzas, tickets e IA.

## Puesta en marcha

1. Instalar dependencias:

   ```bash
   npm install
   ```

2. Copiar `.env.example` a `.env` y completar:
   - `DATABASE_URL`: la conexión a PostgreSQL.
   - `SESSION_SECRET`: 32 caracteres o más, para firmar la cookie de sesión.
   - `SEED_PASSWORD_MARCE` y `SEED_PASSWORD_LAUTARO`: contraseñas iniciales de los socios, de 8 caracteres o más.
   - `EXCHANGE_RATE_CASA` (opcional): qué dólar usar para consolidar en ARS. Por defecto `oficial`; también acepta `bolsa` (MEP) o `blue`.
   - `OPENAI_API_KEY`: para el chat de IA.

3. Aplicar las migraciones y cargar los datos iniciales:

   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```

   El seed es idempotente. Si un usuario ya existe, solo actualiza su nombre y rol; nunca pisa la contraseña. Después del primer login, cada socio puede cambiar su contraseña en **Perfil**.

4. Levantar el entorno de desarrollo:

   ```bash
   npm run dev
   ```

   Abrir [http://localhost:3000](http://localhost:3000). Sin sesión, redirige a `/login`.

## Finanzas

- **Cuentas** (Finanzas → Configuración): dónde está el dinero (Ualá, banco, efectivo). El saldo de cada cuenta es su saldo inicial más la suma de sus movimientos. Al empezar, cargá en "Ualá ARS" el saldo real y la fecha desde la que registrás movimientos.
- **Movimientos**: cada ingreso o egreso pertenece a una cuenta y a una categoría. Al marcar una factura como cobrada se crea el ingreso automáticamente en la cuenta que elijas.
- **Transferencias**: mueven dinero entre cuentas, incluso de ARS a USD. No cuentan como ingreso ni egreso.
- **USD**: cada movimiento en dólares guarda la cotización del día, que se obtiene de una API pública o se carga a mano. Todos los reportes se consolidan en ARS.

## Roles

| Rol | Permisos |
| --- | --- |
| `OWNER` | Acceso total. |
| `FINANCIAL` | Puede marcar facturas como cobradas y registrar movimientos. |
| `MANAGER` | Acceso operativo. No puede marcar facturas como cobradas ni registrar movimientos. |

## Hoja de ruta

Ver `PROMPTS.md`.

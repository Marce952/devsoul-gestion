# Contexto del Proyecto: Devsoul Management System

Sos el Lead Fullstack Developer de **Devsoul**, una startup de desarrollo de software de 3 socios. Estamos construyendo nuestro sistema de gestión interna optimizado para celulares y toma de decisiones.

## Stack Tecnológico
- Framework: Next.js (App Router, React 19)
- Base de Datos: PostgreSQL
- ORM: Prisma
- Estilos & UI: Tailwind CSS + HeroUI (Ex-NextUI)
- Estética Visual: Glassmorphism sobre fondo negro absoluto.
- Íconos: lucide-react
- Arquitectura de API: Route Handlers nativos de Next.js (`/app/api/...`)

## Paleta de Colores Corporativa
- Fondo: #000000 (Negro absoluto)
- Texto: #FFFFFF (Blanco)
- Acento / CTA: #bdf61d (Verde Lima/Neón)
- Clase Glassmorphism base: `bg-white/5 backdrop-blur-md border border-white/10 shadow-lg`

## Reglas de Negocio
1. Clientes y Software: Un cliente puede contratar múltiples softwares a medida (pago único/cuotas) o suscripciones SaaS y mantenimiento mensual.
2. Facturación: Control manual de estados: `PAID` y `PENDING`. Registro en pesos (`ARS`) con soporte estructural para `USD`.
3. Tickets: Tracking interno de incidentes por cliente y software.
4. IA: El chat de IA consume un resumen financiero inyectado desde el backend (ingresos, egresos, facturas pendientes) para dar consejos de utilidad en tiempo real.

## Reglas de Código
- Código limpio, modular, responsive (Mobile-First) y tipado estricto con TypeScript.
- No usar comentarios redundantes ni explicaciones extensas en texto. Entregar código directo listo para usar.





## Cuidado no ejecutar sin aviso
<!-- ### API Endpoints (`api/softwares/route.ts` & `api/softwares/[id]/route.ts`)
- POST: Crear software (name, description, type [SAAS, CUSTOM], basePrice).
- GET: Listar softwares con filtros por tipo (SaaS / A medida).

### UI Vista Principal (`app/dashboard/softwares/page.tsx`)
- Top Bar: Título "Catálogo de Software" y Botón "+ Registrar Software" (Fondo #bdf61d).
- HeroUI Tabs para filtrar rápidamente en pantalla: "Todos", "Modelos SaaS", "Desarrollos a Medida".
- Grid de Software (Cards Glassmorphic):
  · Encabezado: Nombre del software y un Lucide Icon según el tipo (ej: `Layers` para SaaS, `Code` para Custom).
  · Detalle: Descripción corta y precio base formateado (`basePrice`).
  · Footer de la tarjeta: Botón para editar y indicador de cuántos clientes lo usan actualmente.

### Formulario de Registro
- HeroUI Modal que incluya:
  · Input: Nombre del Software.
  · Textarea: Descripción.
  · HeroUI Select: Tipo de Software (`SAAS` o `CUSTOM`).
  · Input numérico: Precio base (con prefijo o indicador de moneda).

  ### API Endpoints (`api/invoices/route.ts` & `api/invoices/[id]/route.ts`)
- GET: Listar todas las facturas (`Invoice`) con soporte de paginación y filtros por query params: `status` (PAID/PENDING), `period` (ej: "2026-05"), y `clientId`. Incluir relación con `Client` y `Contract`.
- PATCH (`api/invoices/[id]/route.ts`): Cambiar estado de la factura de `PENDING` a `PAID` registrando la fecha actual en `paymentDate`. Si pasa a PAID, crear automáticamente un registro en la tabla `Transaction` como `INCOME`.

### UI Vista Principal (`app/dashboard/facturacion/page.tsx`)
- Mobile-First: Priorizar diseño de lista scroleable para celulares y tabla extendida para desktop.
- Filtros superiores rápidos usando HeroUI Select: Estado (Todos, Pendientes, Cobrados) y Mes/Año.
- Listado de Facturas (Estilo Glassmorphism):
  · Cada fila/tarjeta debe mostrar: Nombre del Cliente, Software asociado, Período, Monto formateado con su moneda (`ARS` o `USD`).
  · Vencimiento: Mostrar fecha. Si está vencida y `PENDING`, resaltar el texto en rojo.
  · Estado: HeroUI Chip (Verde con texto negro para `PAID`, Amarillo/Naranja para `PENDING`).
  · Acción rápida: Si está `PENDING`, mostrar botón de check (Lucide `CheckCircle`) para marcar como cobrado instantáneamente.

  ### API Endpoints (`api/tickets/route.ts` & `api/tickets/[id]/route.ts`)
- POST: Crear ticket asociado a un clientId y softwareId (title, description, priority). Status inicial: `OPEN`.
- GET: Listar tickets activos ordenados por prioridad (`HIGH` primero) y status.
- PATCH (`api/tickets/[id]/route.ts`): Actualizar el `status` del ticket (`OPEN` -> `IN_PROGRESS` -> `RESOLVED`).

### UI Vista Principal (`app/dashboard/tickets/page.tsx`)
- Top Bar: Título "Mantenimiento y Tickets" y Botón "+ Levantar Ticket".
- Layout Kanban o Lista de Prioridades (Optimizado para móvil):
  · Tarjetas Glassmorphic delgadas para cada ticket.
  · Header: Chip de prioridad (Rojo para `HIGH`, Amarillo para `MEDIUM`, Gris para `LOW`) + ID de Ticket.
  · Cuerpo: Título del problema, Cliente y Software afectado.
  · Footer: Select rápido de HeroUI (tamaño sm) para cambiar el estado del ticket en tiempo real (`OPEN`, `IN_PROGRESS`, `RESOLVED`) con cambios reflejados inmediatamente en la UI.

### Formulario de Creación de Ticket
- HeroUI Modal interactivo:
  · Select de Cliente (traer dinámicamente de la API).
  · Select de Software (filtrado dinámico basado en el cliente seleccionado o general).
  · Input para Título y Textarea para el detalle del error/mantenimiento.
  · Select de Prioridad. -->
# App Hector1

Aplicación de reservas de salas con panel de administración, web pública y flujo de booking paso a paso.

---

## Arquitectura

El frontend (React + Vite) se comunica con tu backend a través de **webhooks de n8n**.  
No hay ningún proveedor de backend incluido: tú controlas 100 % de los datos y la lógica.

```
Navegador ──► React App ──► n8n Webhooks ──► Tu base de datos / servicios
```

---

## Puesta en marcha local

### 1. Requisitos previos

- Node.js ≥ 18
- Una instancia de n8n accesible (local o en la nube)

### 2. Instalación

```bash
npm install
```

### 3. Variables de entorno

Copia el archivo de ejemplo y rellena tus URLs de n8n:

```bash
cp .env.local.example .env.local
```

Edita `.env.local`:

```env
# URL base de tu n8n (sin barra final)
VITE_N8N_BASE_URL=https://tu-instancia-n8n.com

# Rutas de los webhooks (ver sección "Configurar n8n" más abajo)
VITE_N8N_WEBHOOK_ROOMS=/webhook/rooms
VITE_N8N_WEBHOOK_RESERVATIONS=/webhook/reservations
VITE_N8N_WEBHOOK_CUSTOMERS=/webhook/customers
VITE_N8N_WEBHOOK_PAYMENTS=/webhook/payments
VITE_N8N_WEBHOOK_INVOICES=/webhook/invoices
VITE_N8N_WEBHOOK_EXPENSES=/webhook/expenses
VITE_N8N_WEBHOOK_COMPANY=/webhook/company
```

### 4. Arrancar el servidor de desarrollo

```bash
npm run dev
```

---

## Configurar n8n

Para cada entidad de la tabla siguiente debes crear **un workflow en n8n** con un nodo **Webhook** (tipo *Listen for Webhook*) como disparador.

| Variable de entorno | Entidad | Descripción |
|---|---|---|
| `VITE_N8N_WEBHOOK_ROOMS` | Salas | Espacios disponibles para reservar |
| `VITE_N8N_WEBHOOK_RESERVATIONS` | Reservas | Reservas de clientes |
| `VITE_N8N_WEBHOOK_CUSTOMERS` | Clientes | CRM de clientes |
| `VITE_N8N_WEBHOOK_PAYMENTS` | Pagos | Registro de cobros |
| `VITE_N8N_WEBHOOK_INVOICES` | Facturas | Documentos de facturación |
| `VITE_N8N_WEBHOOK_EXPENSES` | Gastos | Control de gastos del negocio |
| `VITE_N8N_WEBHOOK_COMPANY` | Empresa | Datos del negocio, logo, colores, SEO |

### Diseño de cada workflow

El frontend envía peticiones REST estándar. Dentro del workflow usa un nodo **Switch** o **IF** sobre `{{ $json.method }}` para enrutar cada operación:

| Método HTTP | Operación | Qué contiene la petición |
|---|---|---|
| `GET` | Listar / filtrar | Query params: `sort`, `limit`, `filter_CAMPO=valor` |
| `POST` | Crear registro | Body JSON con los campos del registro |
| `PUT` | Actualizar registro | Path: `…/:id` — Body JSON con los campos a cambiar |
| `DELETE` | Eliminar registro | Path: `…/:id` |

### Ejemplo de workflow para Salas

```
[Webhook: /webhook/rooms]
        │
   [Switch: method]
   ├── GET    → [Leer de DB / Airtable / Google Sheets] → [Respond to Webhook]
   ├── POST   → [Insertar en DB] → [Respond to Webhook]
   ├── PUT    → [Actualizar en DB por id del path] → [Respond to Webhook]
   └── DELETE → [Eliminar de DB por id del path] → [Respond to Webhook]
```

> **Nota**: El `id` del registro viaja en el path de la URL (`/webhook/rooms/abc123`).  
> En n8n puedes leerlo con `{{ $json.params.id }}` si el webhook tiene el path dinámico activado,  
> o incluirlo en el body/query según tu configuración.

### Respuestas esperadas

El frontend espera que cada operación devuelva:

- **GET list/filter** → array JSON: `[{id, campo1, campo2, …}, …]`
- **GET :id** → objeto JSON: `{id, campo1, campo2, …}`
- **POST** → objeto creado: `{id, campo1, campo2, …}`
- **PUT** → objeto actualizado: `{id, campo1, campo2, …}`
- **DELETE** → `null` o `{}`

---

## Estructura del proyecto

```
src/
├── api/
│   └── base44Client.js   ← Cliente HTTP genérico (llama a los webhooks n8n)
├── components/
│   ├── admin/            ← Componentes del panel de administración
│   ├── booking/          ← Componentes del flujo de reserva
│   ├── public/           ← Layout y componentes de la web pública
│   └── ui/               ← Sistema de diseño (shadcn/ui)
├── hooks/
│   └── useCompany.js     ← Hook para cargar datos del negocio
├── lib/
│   ├── AuthContext.jsx   ← Contexto de auth (simplificado, sin proveedor externo)
│   └── query-client.js   ← Configuración de React Query
└── pages/
    ├── Home.jsx               ← Portada pública
    ├── Booking.jsx            ← Flujo de reserva (4 pasos)
    ├── ClientDashboard.jsx    ← Dashboard del cliente
    ├── Admin.jsx              ← Dashboard de administración
    ├── AdminReservations.jsx  ← Gestión de reservas
    ├── AdminRooms.jsx         ← Gestión de salas
    ├── AdminCustomers.jsx     ← CRM de clientes
    ├── AdminPayments.jsx      ← Control de pagos
    ├── AdminInvoices.jsx      ← Facturación
    ├── AdminExpenses.jsx      ← Gastos
    ├── AdminAnalytics.jsx     ← Analítica
    ├── AdminSettings.jsx      ← Configuración del negocio
    └── AdminWebsite.jsx       ← Editor de la web pública
```

---

## Campos de cada entidad

### Company (Configuración del negocio)
`name`, `legal_name`, `nif`, `logo_url`, `description`, `address`, `city`,
`postal_code`, `province`, `country`, `phone`, `email`, `website`, `currency`,
`timezone`, `primary_color`, `hero_image`, `stat1_value`, `stat1_label`,
`stat2_value`, `stat2_label`, `stat3_value`, `stat3_label`,
`social_instagram`, `social_facebook`, `social_linkedin`,
`seo_title`, `seo_description`, `seo_image`, `terms_url`, `privacy_url`,
`cancellation_policy_text`, `status`

### Room (Sala)
`name`, `description`, `capacity_min`, `capacity_max`, `size_sqm`,
`price_per_hour`, `deposit_required`, `deposit_type`, `deposit_amount`,
`available_from`, `available_to`, `buffer_minutes`, `min_booking_hours`,
`max_booking_hours`, `available_days`, `equipment`, `services`, `images`, `status`

### Reservation (Reserva)
`room_id`, `room_name`, `date`, `start_time`, `end_time`, `duration_hours`,
`customer_name`, `customer_email`, `customer_phone`, `notes`,
`subtotal_amount`, `tax_amount`, `total_amount`,
`deposit_amount`, `deposit_paid`, `status`, `created_date`

### Customer (Cliente)
`full_name`, `email`, `phone`, `nif`, `notes`, `total_bookings`, `total_spent`, `status`

### Payment (Pago)
`reservation_id`, `type`, `method`, `amount`, `reference`, `status`, `created_date`

### Invoice (Factura)
`series`, `invoice_number`, `type`, `customer_name`, `issue_date`,
`total`, `status`, `fiscal_status`, `pdf_url`

### Expense (Gasto)
`title`, `category`, `supplier`, `date`, `amount`, `tax_amount`, `total`, `status`

---

## Scripts disponibles

```bash
npm run dev      # Servidor de desarrollo
npm run build    # Build de producción
npm run preview  # Vista previa del build
npm run lint     # Linter
```

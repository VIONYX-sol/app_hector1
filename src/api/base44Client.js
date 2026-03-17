/**
 * Cliente HTTP genérico para conectar con n8n.
 *
 * CONFIGURACIÓN en .env.local:
 * ─────────────────────────────────────────────────────────────────────────────
 * VITE_N8N_BASE_URL=https://tu-instancia-n8n.com
 *
 * Cada entidad usa su propia ruta de webhook. Crea en n8n un webhook del tipo
 * "Listen for webhook" para cada entidad y copia la URL aquí:
 *
 * VITE_N8N_WEBHOOK_ROOMS=        /webhook/rooms
 * VITE_N8N_WEBHOOK_RESERVATIONS= /webhook/reservations
 * VITE_N8N_WEBHOOK_CUSTOMERS=    /webhook/customers
 * VITE_N8N_WEBHOOK_PAYMENTS=     /webhook/payments
 * VITE_N8N_WEBHOOK_INVOICES=     /webhook/invoices
 * VITE_N8N_WEBHOOK_EXPENSES=     /webhook/expenses
 * VITE_N8N_WEBHOOK_COMPANY=      /webhook/company
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * DISEÑO DE LOS WEBHOOKS EN N8N:
 * Cada webhook recibe peticiones REST estándar:
 *   GET    /webhook/{entity}            → listar / filtrar (params en query string)
 *   GET    /webhook/{entity}/:id        → obtener uno
 *   POST   /webhook/{entity}            → crear
 *   PUT    /webhook/{entity}/:id        → actualizar
 *   DELETE /webhook/{entity}/:id        → eliminar
 *
 * Parámetros de query para GET list/filter:
 *   sort=campo           campo por el que ordenar (prefijo - para DESC, ej: -created_date)
 *   limit=100            número máximo de resultados
 *   filter_CAMPO=valor   filtros (ej: filter_status=active, filter_room_id=abc123)
 *   filter_CAMPO=v1,v2   filtro de lista (array de valores)
 */

const N8N_BASE_URL = import.meta.env.VITE_N8N_BASE_URL || '';

const ENTITY_PATHS = {
  Room:        import.meta.env.VITE_N8N_WEBHOOK_ROOMS        || '/webhook/rooms',
  Reservation: import.meta.env.VITE_N8N_WEBHOOK_RESERVATIONS || '/webhook/reservations',
  Customer:    import.meta.env.VITE_N8N_WEBHOOK_CUSTOMERS    || '/webhook/customers',
  Payment:     import.meta.env.VITE_N8N_WEBHOOK_PAYMENTS     || '/webhook/payments',
  Invoice:     import.meta.env.VITE_N8N_WEBHOOK_INVOICES     || '/webhook/invoices',
  Expense:     import.meta.env.VITE_N8N_WEBHOOK_EXPENSES     || '/webhook/expenses',
  Company:     import.meta.env.VITE_N8N_WEBHOOK_COMPANY      || '/webhook/company',
};

async function request(url, options = {}) {
  const method = options.method || 'GET';
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!response.ok) {
    const text = await response.text().catch(() => response.statusText);
    throw new Error(`[${method} ${url}] HTTP ${response.status}: ${text}`);
  }
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

/**
 * Crea los métodos CRUD para una entidad.
 * El webhook de n8n debe enrutar según el método HTTP y el path recibido.
 */
function makeEntity(entityPath) {
  const baseUrl = () => `${N8N_BASE_URL}${entityPath}`;

  return {
    /**
     * Listar todos los registros.
     * @param {string} sort  Campo de ordenación (ej: '-created_date')
     * @param {number} limit Máximo de resultados
     */
    list(sort, limit) {
      const params = new URLSearchParams();
      if (sort)  params.set('sort', sort);
      if (limit) params.set('limit', String(limit));
      const qs = params.toString();
      return request(`${baseUrl()}${qs ? `?${qs}` : ''}`);
    },

    /**
     * Filtrar registros por campos concretos.
     * @param {Object} filters  { campo: valor } o { campo: [v1, v2] }
     * @param {string} sort
     * @param {number} limit
     */
    filter(filters, sort, limit) {
      const params = new URLSearchParams();
      if (sort)  params.set('sort', sort);
      if (limit) params.set('limit', String(limit));
      Object.entries(filters || {}).forEach(([key, value]) => {
        const encoded = Array.isArray(value) ? value.join(',') : String(value);
        params.set(`filter_${key}`, encoded);
      });
      return request(`${baseUrl()}?${params}`);
    },

    /**
     * Obtener un único registro por id.
     * @param {string} id
     */
    get(id) {
      return request(`${baseUrl()}/${id}`);
    },

    /**
     * Crear un nuevo registro.
     * @param {Object} data
     */
    create(data) {
      return request(baseUrl(), {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    /**
     * Actualizar un registro existente.
     * @param {string} id
     * @param {Object} data  Campos a actualizar
     */
    update(id, data) {
      return request(`${baseUrl()}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    /**
     * Eliminar un registro.
     * @param {string} id
     */
    delete(id) {
      return request(`${baseUrl()}/${id}`, { method: 'DELETE' });
    },
  };
}

export const base44 = {
  entities: Object.fromEntries(
    Object.entries(ENTITY_PATHS).map(([name, path]) => [name, makeEntity(path)])
  ),
};

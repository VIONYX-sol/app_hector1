/**
 * Clean API client for the venue reservation platform.
 * Communicates with our own backend API.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const method = options.method || 'GET';
  
  // Add CSRF header for mutation requests
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    headers['X-Requested-With'] = 'XMLHttpRequest';
  }
  
  const config = {
    ...options,
    headers,
    credentials: 'include', // Important for httpOnly cookie auth
  };

  const response = await fetch(url, config);
  
  // Handle empty responses
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new ApiError(
      data?.message || data?.error || `HTTP ${response.status}`,
      response.status,
      data
    );
  }

  return data;
}

// ==========================================
// PUBLIC API
// ==========================================

export const publicApi = {
  // Venues
  getVenues: () => request('/public/venues'),
  
  getVenue: (slug) => request(`/public/venues/${slug}`),
  
  getVenueAvailability: (id, from, to) => {
    const params = new URLSearchParams({ from, to });
    return request(`/public/venues/${id}/availability?${params}`);
  },
  
  // Reservations
  createReservation: (data) => request('/public/reservations', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

// ==========================================
// ADMIN API
// ==========================================

export const adminApi = {
  // Auth
  login: (email, password) => request('/admin/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }),
  
  logout: () => request('/admin/auth/logout', {
    method: 'POST',
  }),
  
  getMe: () => request('/admin/auth/me'),
  
  // Dashboard
  getDashboardStats: () => request('/admin/dashboard/stats'),
  
  // Reservations
  getReservations: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/admin/reservations${qs ? `?${qs}` : ''}`);
  },
  
  getReservation: (id) => request(`/admin/reservations/${id}`),
  
  updateReservation: (id, data) => request(`/admin/reservations/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  
  getReservationCalendar: (venueId, from, to) => {
    const params = new URLSearchParams();
    if (venueId) params.set('venueId', venueId);
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    return request(`/admin/reservations/calendar?${params}`);
  },
  
  // Venues
  getVenues: () => request('/admin/venues'),
  
  getVenue: (id) => request(`/admin/venues/${id}`),
  
  createVenue: (data) => request('/admin/venues', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  updateVenue: (id, data) => request(`/admin/venues/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  
  archiveVenue: (id) => request(`/admin/venues/${id}`, {
    method: 'DELETE',
  }),
  
  // Venue Blocks
  getVenueBlocks: (venueId) => request(`/admin/venues/${venueId}/blocks`),
  
  createVenueBlock: (venueId, data) => request(`/admin/venues/${venueId}/blocks`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  deleteVenueBlock: (blockId) => request(`/admin/blocks/${blockId}`, {
    method: 'DELETE',
  }),
  
  // Customers
  getCustomers: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/admin/customers${qs ? `?${qs}` : ''}`);
  },
  
  getCustomer: (id) => request(`/admin/customers/${id}`),
  
  // Settings
  getSettings: () => request('/admin/settings'),
  
  updateSettings: (data) => request('/admin/settings', {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  
  // Audit Logs
  getAuditLogs: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/admin/audit-logs${qs ? `?${qs}` : ''}`);
  },
};

// ==========================================
// HEALTH CHECK
// ==========================================

export const healthApi = {
  check: () => request('/health'),
};

export { ApiError };

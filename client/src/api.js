const API_BASE = '/api/quotations';
const AUTH_BASE = '/api/auth';

function getAuthHeader() {
  const token = localStorage.getItem('subodhi_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

// Resilient response parser: handles both JSON and plain-text/HTML server errors safely
async function handleResponse(res) {
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch (e) {
    if (!res.ok) {
      const cleanSnippet = text.replace(/<[^>]*>?/gm, '').trim().slice(0, 160);
      throw new Error(cleanSnippet || `Server error (${res.status})`);
    }
    return text;
  }

  if (!res.ok) {
    throw new Error(data?.error || data?.message || `Server error (${res.status})`);
  }

  return data;
}

// ==========================================
// AUTHENTICATION & USER MANAGEMENT
// ==========================================
export async function loginUser(credentials) {
  const res = await fetch(`${AUTH_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  });
  const data = await handleResponse(res);
  if (data?.token) {
    localStorage.setItem('subodhi_token', data.token);
    localStorage.setItem('subodhi_user', JSON.stringify(data.user));
  }
  return data;
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem('subodhi_user');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function logoutUser() {
  localStorage.removeItem('subodhi_token');
  localStorage.removeItem('subodhi_user');
}

export async function fetchUsers() {
  const res = await fetch(`${AUTH_BASE}/users`, {
    headers: { ...getAuthHeader() }
  });
  return handleResponse(res);
}

export async function createEmployee(employeeData) {
  const res = await fetch(`${AUTH_BASE}/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader()
    },
    body: JSON.stringify(employeeData)
  });
  return handleResponse(res);
}

export async function deleteEmployee(id) {
  const res = await fetch(`${AUTH_BASE}/users/${id}`, {
    method: 'DELETE',
    headers: { ...getAuthHeader() }
  });
  return handleResponse(res);
}

// ==========================================
// QUOTATIONS API
// ==========================================
export async function fetchQuotations(params = {}) {
  const query = new URLSearchParams();
  if (params.status && params.status !== 'ALL') query.append('status', params.status);
  if (params.isConverted !== undefined && params.isConverted !== 'ALL') query.append('isConverted', params.isConverted);
  if (params.search) query.append('search', params.search);

  const res = await fetch(`${API_BASE}?${query.toString()}`, {
    headers: { ...getAuthHeader() }
  });
  return handleResponse(res);
}

export async function fetchAnalytics() {
  const res = await fetch(`${API_BASE}/stats/analytics`, {
    headers: { ...getAuthHeader() }
  });
  return handleResponse(res);
}

export async function fetchQuotationById(id) {
  const res = await fetch(`${API_BASE}/${id}`, {
    headers: { ...getAuthHeader() }
  });
  return handleResponse(res);
}

export async function createQuotation(data) {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...getAuthHeader()
    },
    body: JSON.stringify(data)
  });
  return handleResponse(res);
}

export async function uploadExcelQuotation(formData) {
  const res = await fetch(`${API_BASE}/upload-excel`, {
    method: 'POST',
    headers: { ...getAuthHeader() },
    body: formData
  });
  return handleResponse(res);
}

export async function authorizeQuotation(id, payload = {}) {
  const res = await fetch(`${API_BASE}/${id}/authorize`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...getAuthHeader()
    },
    body: JSON.stringify(payload)
  });
  return handleResponse(res);
}

export async function rejectQuotation(id, payload = {}) {
  const res = await fetch(`${API_BASE}/${id}/reject`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...getAuthHeader()
    },
    body: JSON.stringify(payload)
  });
  return handleResponse(res);
}

export async function sendToCustomer(id) {
  const res = await fetch(`${API_BASE}/${id}/send-to-customer`, {
    method: 'POST',
    headers: { ...getAuthHeader() }
  });
  return handleResponse(res);
}

export async function submitForApproval(id) {
  const res = await fetch(`${API_BASE}/${id}/submit-for-approval`, {
    method: 'POST',
    headers: { ...getAuthHeader() }
  });
  return handleResponse(res);
}

export async function adjustQuotation(id, payload) {
  const res = await fetch(`${API_BASE}/${id}/adjust`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...getAuthHeader()
    },
    body: JSON.stringify(payload)
  });
  return handleResponse(res);
}

export async function markConversion(id, payload) {
  const res = await fetch(`${API_BASE}/${id}/conversion`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...getAuthHeader()
    },
    body: JSON.stringify(payload)
  });
  return handleResponse(res);
}

export async function deleteQuotation(id) {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
    headers: { ...getAuthHeader() }
  });
  return handleResponse(res);
}

export function getPdfDownloadUrl(id) {
  const token = localStorage.getItem('subodhi_token');
  return token ? `${API_BASE}/${id}/pdf?token=${encodeURIComponent(token)}` : `${API_BASE}/${id}/pdf`;
}

export function getSampleExcelUrl() {
  return `${API_BASE}/sample-excel`;
}

const API_BASE = '/api/quotations';
const AUTH_BASE = '/api/auth';

function getAuthHeader() {
  const token = localStorage.getItem('subodhi_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
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
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to log in');
  }
  if (data.token) {
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
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to fetch users');
  }
  return res.json();
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
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to create employee account');
  }
  return data;
}

export async function deleteEmployee(id) {
  const res = await fetch(`${AUTH_BASE}/users/${id}`, {
    method: 'DELETE',
    headers: { ...getAuthHeader() }
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to delete employee account');
  }
  return data;
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
  if (!res.ok) throw new Error('Failed to fetch quotations');
  return res.json();
}

export async function fetchAnalytics() {
  const res = await fetch(`${API_BASE}/stats/analytics`, {
    headers: { ...getAuthHeader() }
  });
  if (!res.ok) throw new Error('Failed to fetch analytics');
  return res.json();
}

export async function fetchQuotationById(id) {
  const res = await fetch(`${API_BASE}/${id}`, {
    headers: { ...getAuthHeader() }
  });
  if (!res.ok) throw new Error('Failed to fetch quotation details');
  return res.json();
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
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create quotation');
  }
  return res.json();
}

export async function uploadExcelQuotation(formData) {
  const res = await fetch(`${API_BASE}/upload-excel`, {
    method: 'POST',
    headers: { ...getAuthHeader() },
    body: formData
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to upload and parse Excel quotation');
  }
  return res.json();
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
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to authorize quotation');
  }
  return res.json();
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
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to reject quotation');
  }
  return res.json();
}

export async function sendToCustomer(id) {
  const res = await fetch(`${API_BASE}/${id}/send-to-customer`, {
    method: 'POST',
    headers: { ...getAuthHeader() }
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to send quotation to customer');
  }
  return res.json();
}

export async function submitForApproval(id) {
  const res = await fetch(`${API_BASE}/${id}/submit-for-approval`, {
    method: 'POST',
    headers: { ...getAuthHeader() }
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to submit quotation for approval');
  }
  return res.json();
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
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to record adjustment');
  }
  return res.json();
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
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to update conversion status');
  }
  return res.json();
}

export async function deleteQuotation(id) {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
    headers: { ...getAuthHeader() }
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to delete quotation');
  }
  return res.json();
}

export function getPdfDownloadUrl(id) {
  const token = localStorage.getItem('subodhi_token');
  return token ? `${API_BASE}/${id}/pdf?token=${encodeURIComponent(token)}` : `${API_BASE}/${id}/pdf`;
}

export function getSampleExcelUrl() {
  return `${API_BASE}/sample-excel`;
}

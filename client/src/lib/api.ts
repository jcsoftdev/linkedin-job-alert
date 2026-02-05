
export const getToken = () => localStorage.getItem('token');

export const getHeaders = () => {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const api = {
  get: async (url: string) => {
    const res = await fetch(`/api${url}`, { headers: getHeaders() });
    if (!res.ok) throw new Error((await res.json()).error || 'Request failed');
    return res.json();
  },
  post: async (url: string, body: unknown) => {
    const res = await fetch(`/api${url}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  },
  delete: async (url: string) => {
    const res = await fetch(`/api${url}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Request failed');
    return res.json();
  }
};

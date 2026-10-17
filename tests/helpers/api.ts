import { expect, request, type APIRequestContext } from '@playwright/test';
export const policies = Object.fromEntries(['buying', 'shipping', 'returns', 'terms', 'privacy', 'custom'].map(key => [key, '2026-09-27']));
export const receipt = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aL1sAAAAASUVORK5CYII=';
export async function client(role?: 'owner' | 'viewer' | 'customer') {
  const api = await request.newContext({ baseURL: 'http://127.0.0.1:4400' });
  // Bootstrap guest identity before concurrent mutations.
  expect((await api.get('/session')).status()).toBe(200);
  if (role) expect((await api.post('/auth/session', { data: { email: `qa-${role}@example.test`, password: 'QaOnly123456!' } })).status()).toBe(201);
  return api;
}
export async function placeOrder(api: APIRequestContext, slug: string) {
  expect((await api.post('/cart/items', { data: { slug } })).status()).toBe(201);
  const res = await api.post('/orders', { data: { name: 'QA Buyer', phone: '09121234567', city: 'تهران', address: 'QA isolated address', acceptedPolicies: policies } });
  expect(res.status(), await res.text()).toBe(201);
  return res.json();
}

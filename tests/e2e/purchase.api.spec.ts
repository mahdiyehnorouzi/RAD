import { test, expect } from '@playwright/test';
import { client, placeOrder, receipt } from '../helpers/api';
test('P0 session, purchase, receipt retry, staff approval and customer status @smoke', async () => {
  const buyer = await client();
  const admin = await client('owner');
  const stranger = await client();
  try {
    const order = await placeOrder(buyer, 'qa-work-0');
    expect(order.total).toBe(1200000);
    expect(order.status).toBe('pending_payment');
    expect([403,404]).toContain((await stranger.get(`/orders/${order.id}`)).status());
    expect((await buyer.post(`/orders/${order.id}/confirm-payment`, { data: { receiptImage: receipt, trackingNumber: '12' } })).status()).toBe(400);
    expect((await buyer.get(`/orders/${order.id}`)).status()).toBe(200);
    const data = { receiptImage: receipt, trackingNumber: '۱۲۳۴-۵۶۷۸' };
    for (let i = 0; i < 2; i++) {
      const res = await buyer.post(`/orders/${order.id}/confirm-payment`, { data });
      expect(res.status(), await res.text()).toBe(201);
      expect((await res.json()).status).toBe('pending_verification');
    }
    const rows = await (await admin.get('/admin/orders')).json();
    expect(rows.find((row: { id: string }) => row.id === order.id)).toMatchObject({ receiptSubmissions: 1, paymentTrackingNumber: '12345678', receiptImage: receipt });
    expect((await admin.post(`/admin/orders/${order.id}/payment/approve`)).status()).toBe(201);
    expect((await (await buyer.get(`/orders/${order.id}`)).json()).status).toBe('confirmed');
    expect((await stranger.post('/cart/items', { data: { slug: 'qa-work-0' } })).status()).toBe(409);
  } finally { await Promise.all([buyer.dispose(), admin.dispose(), stranger.dispose()]); }
});
test('P0 two identities race for a unique work @smoke', async () => {
  const a = await client(); const b = await client();
  try {
    const results = await Promise.all([a,b].map(c => c.post('/cart/items', { data: { slug: 'qa-work-1' } })));
    expect(results.map(r => r.status()).sort()).toEqual([201,409]);
    const bags = await Promise.all([a,b].map(async c => (await c.get('/cart')).json()));
    expect(bags.flatMap(bag => bag.slugs)).toEqual(['qa-work-1']);
  } finally { await a.dispose(); await b.dispose(); }
});
test('P0 admin authentication and viewer write protection @smoke', async () => {
  const guest = await client(); const viewer = await client('viewer');
  try {
    expect((await guest.get('/admin/orders')).status()).toBe(401);
    expect((await viewer.get('/admin/orders')).status()).toBe(200);
    expect((await viewer.post('/admin/orders/nonexistent/payment/approve')).status()).toBe(403);
  } finally { await guest.dispose(); await viewer.dispose(); }
});
test('P1 cart duplicate add, persistence, removal and sold status', async () => {
  const buyer = await client();
  try {
    for (let i=0;i<2;i++) expect((await buyer.post('/cart/items', { data: { slug: 'qa-work-2' } })).status()).toBe(201);
    expect((await (await buyer.get('/cart')).json()).slugs).toEqual(['qa-work-2']);
    expect((await buyer.delete('/cart/items/qa-work-2')).ok()).toBeTruthy();
    expect((await (await buyer.get('/cart')).json()).slugs).toEqual([]);
    expect((await buyer.post('/cart/items', { data: { slug: 'qa-work-79' } })).status()).toBe(409);
  } finally { await buyer.dispose(); }
});

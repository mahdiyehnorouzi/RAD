import { test, expect } from '@playwright/test';
import { client, placeOrder } from '../helpers/api';
test('P0 customer → admin → customer thread, sender identity and unauthorized reply @smoke', async () => {
  const buyer = await client(); const staff = await client('owner'); const other = await client();
  try {
    const order = await placeOrder(buyer, 'qa-work-3');
    const created = await buyer.post('/contact/messages', { data: { topic: 'payment', source: 'order', orderId: order.id, body: 'QA customer question' } });
    expect(created.status()).toBe(201);
    const root = await created.json();
    const inbox = await (await staff.get('/admin/messages')).json();
    expect(inbox.find((row: { id: string }) => row.id === root.id)).toMatchObject({ body: 'QA customer question', fromAdmin: false });
    expect((await staff.post(`/admin/messages/${root.id}/reply`, { data: { body: 'QA staff answer' } })).status()).toBe(201);
    const thread = await (await buyer.get(`/contact/messages?orderId=${order.id}`)).json();
    expect(thread.map((m: { body: string }) => m.body)).toEqual(['QA customer question', 'QA staff answer']);
    expect(thread[1]).toMatchObject({ fromAdmin: true, parentId: root.id });
    expect((await other.get(`/contact/messages?orderId=${order.id}`)).status()).toBe(403);
    expect((await other.post(`/contact/messages/${root.id}/reply`, { data: { body: 'Unauthorized reply' } })).status()).toBe(403);
    expect((await buyer.post(`/contact/messages/${root.id}/reply`, { data: { body: '' } })).status()).toBe(400);
  } finally { await Promise.all([buyer.dispose(),staff.dispose(),other.dispose()]); }
});

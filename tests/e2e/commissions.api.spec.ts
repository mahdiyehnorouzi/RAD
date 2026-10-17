import { test, expect } from '@playwright/test';
import { client, policies, receipt } from '../helpers/api';
test('P0 custom order persists media, admin review, response and private notes @smoke', async () => {
  const buyer = await client('customer'); const staff = await client('owner'); const guest = await client();
  try {
    const input = { customerName: 'QA Customer', brief: { concept: 'QA handmade bowl', dimensions: '20cm', material: 'ceramic', intendedUse: 'daily', budget: '500', permission: 'suggest', images: [receipt], image: receipt }, acceptedPolicies: policies };
    expect((await guest.post('/commissions', { data: input })).status()).toBe(401);
    const created = await buyer.post('/commissions', { data: input });
    expect(created.status(), await created.text()).toBe(201);
    const row = await created.json();
    const detail = await (await staff.get(`/admin/commissions/${row.id}`)).json();
    expect(detail.payload.brief).toEqual(input.brief);
    expect((await staff.post(`/admin/commissions/${row.id}/review`)).status()).toBe(201);
    expect((await staff.post(`/admin/commissions/${row.id}/messages`, { data: { body: { fa: 'یادداشت خصوصی', en: 'Private QA note' }, internal: true } })).status()).toBe(201);
    expect((await staff.post(`/admin/commissions/${row.id}/decide`, { data: { decision: 'approve' } })).status()).toBe(201);
    const seen = await (await buyer.get(`/commissions/${row.id}`)).json();
    expect(seen.stage).toBe('quote');
    expect(seen.internalNotes).toBeUndefined();
    expect(JSON.stringify(seen)).not.toContain('Private QA note');
    expect((await buyer.post(`/commissions/${row.id}/messages`, { data: { body: { fa: 'متشکرم', en: 'Thank you' } } })).status()).toBe(201);
    expect((await (await staff.get(`/admin/commissions/${row.id}`)).json()).messages.at(-1).author).toBe('customer');
  } finally { await Promise.all([buyer.dispose(),staff.dispose(),guest.dispose()]); }
});

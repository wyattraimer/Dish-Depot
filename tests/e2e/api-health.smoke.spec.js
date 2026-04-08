import { expect, test } from '@playwright/test'

test('returns a healthy API status', async ({ request }) => {
  const response = await request.get('/api/health')

  await expect(response).toBeOK()
  await expect(response.json()).resolves.toEqual({ ok: true })
})

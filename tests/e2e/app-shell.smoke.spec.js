import { expect, test } from '@playwright/test'

test('loads the app shell and local-safe empty states', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('dishDepotWelcomeDismissed', 'true')
  })

  await page.goto('/')

  const welcomeDialog = page.getByRole('dialog', { name: 'Welcome to Dish Depot' })
  if (await welcomeDialog.isVisible().catch(() => false)) {
    await page.getByRole('button', { name: 'Get Started' }).click()
  }

  await expect(page.getByRole('heading', { level: 1, name: 'Dish Depot' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Add Recipe' })).toBeVisible()

  await page.getByRole('button', { name: 'Meal Planner' }).click()

  await expect(page.getByRole('heading', { level: 2, name: 'Weekly Meal Planner' })).toBeVisible()
  await expect(page.getByRole('heading', { level: 3, name: 'Monday' })).toBeVisible()
})

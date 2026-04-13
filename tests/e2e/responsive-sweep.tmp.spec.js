import { test } from '@playwright/test'

const viewports = [
  { key: 'mobile', width: 390, height: 844 },
  { key: 'tablet', width: 834, height: 1112 },
  { key: 'desktop', width: 1280, height: 900 },
]

for (const viewport of viewports) {
  test(`${viewport.key}: capture responsive sweep surfaces`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await page.addInitScript(() => {
      window.localStorage.setItem('dishDepotWelcomeDismissed', '1')
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await page.screenshot({ path: `test-results/responsive-${viewport.key}-shell.png`, fullPage: true })

    await page.getByRole('button', { name: /Open Classic Chocolate Chip Cookies/i }).click()
    await page.screenshot({ path: `test-results/responsive-${viewport.key}-focused.png`, fullPage: true })
    await page.locator('.focused-recipe-close').click()

    await page.locator('.controls-primary-action .toolbar-primary-cta').click()
    await page.screenshot({ path: `test-results/responsive-${viewport.key}-add-recipe.png`, fullPage: true })
    await page.getByRole('button', { name: /Close add recipe dialog/i }).click()

    await page.getByRole('button', { name: 'Tools' }).click()
    await page.getByRole('button', { name: 'Shopping List' }).click()
    await page.getByRole('button', { name: 'Select All' }).click()
    await page.screenshot({ path: `test-results/responsive-${viewport.key}-shopping.png`, fullPage: true })
    await page.getByRole('button', { name: /Close shopping list builder/i }).click()

    await page.getByRole('button', { name: 'Tools' }).click()
    await page.getByRole('button', { name: 'Export Recipes' }).click()
    await page.screenshot({ path: `test-results/responsive-${viewport.key}-export.png`, fullPage: true })
    await page.getByRole('button', { name: /Close export review/i }).click()

    await page.getByRole('button', { name: 'Meal Planner' }).click()
    await page.screenshot({ path: `test-results/responsive-${viewport.key}-planner.png`, fullPage: true })

    for (const surface of ['profile', 'groups', 'group-invites', 'share', 'import']) {
      await page.goto(`/tests/e2e/responsive-harness.html?surface=${surface}`)
      await page.waitForLoadState('networkidle')
      await page.screenshot({ path: `test-results/responsive-${viewport.key}-${surface}.png`, fullPage: true })
    }
  })
}

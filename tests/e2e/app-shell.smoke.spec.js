import { expect, test } from '@playwright/test'

async function dismissWelcomeIfVisible(page) {
  const welcomeDialog = page.getByRole('dialog', { name: 'Welcome to Dish Depot' })

  if (await welcomeDialog.isVisible().catch(() => false)) {
    await page.getByRole('button', { name: 'Get Started' }).click()
  }
}

async function gotoLocalSafeApp(page, { theme = 'light', interceptWindowOpen = false } = {}) {
  await page.addInitScript(({ theme: initialTheme, interceptWindowOpen: shouldInterceptWindowOpen }) => {
    window.localStorage.setItem('dishDepotWelcomeDismissed', 'true')

    if (initialTheme === 'dark') {
      window.localStorage.setItem('recipeTheme', 'dark')
    } else {
      window.localStorage.removeItem('recipeTheme')
    }

    if (shouldInterceptWindowOpen) {
      window.__openCalls = []
      window.open = (...args) => {
        window.__openCalls.push(args)

        return {
          document: {
            open() {},
            write() {},
            close() {},
          },
          focus() {},
          print() {},
          close() {},
        }
      }
    }
  }, { theme, interceptWindowOpen })

  await page.goto('/')

  await dismissWelcomeIfVisible(page)

  await expect(page.getByRole('heading', { level: 1, name: 'Dish Depot' })).toBeVisible()
  await dismissWelcomeIfVisible(page)
}

async function readViewportEdgeSamples(page) {
  const viewport = page.viewportSize()
  const screenshotBase64 = (await page.screenshot({ animations: 'disabled' })).toString('base64')
  const points = [
    { name: 'top-left', x: 2, y: 2 },
    { name: 'top-right', x: viewport.width - 3, y: 2 },
    { name: 'bottom-left', x: 2, y: viewport.height - 3 },
    { name: 'bottom-right', x: viewport.width - 3, y: viewport.height - 3 },
  ]

  return page.evaluate(async ({ base64, samplePoints }) => {
    const binary = atob(base64)
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0))
    const blob = new Blob([bytes], { type: 'image/png' })
    const bitmap = await createImageBitmap(blob)
    const canvas = document.createElement('canvas')
    canvas.width = bitmap.width
    canvas.height = bitmap.height
    const context = canvas.getContext('2d')

    if (!context) {
      throw new Error('Unable to inspect screenshot pixels.')
    }

    context.drawImage(bitmap, 0, 0)

    return samplePoints.map(({ name, x, y }) => {
      const pixel = context.getImageData(x, y, 1, 1).data
      const [red, green, blue, alpha] = pixel
      const luminance = (0.2126 * red) + (0.7152 * green) + (0.0722 * blue)

      return {
        name,
        red,
        green,
        blue,
        alpha,
        luminance,
      }
    })
  }, { base64: screenshotBase64, samplePoints: points })
}

async function readControlsToGridSpacing(page) {
  return page.evaluate(() => {
    const controls = document.querySelector('section.controls')
    const grid = document.querySelector('section.recipe-grid')

    if (!controls || !grid) {
      throw new Error('Expected the controls and recipe grid sections to render.')
    }

    const controlsRect = controls.getBoundingClientRect()
    const gridRect = grid.getBoundingClientRect()

    return {
      computedMarginTop: Number.parseFloat(window.getComputedStyle(grid).marginTop),
      renderedGap: Number.parseFloat((gridRect.top - controlsRect.bottom).toFixed(2)),
    }
  })
}

test('loads the app shell and local-safe empty states', async ({ page }) => {
  await gotoLocalSafeApp(page)
  await expect(page.getByRole('button', { name: 'Add Recipe' })).toBeVisible()

  await page.getByRole('button', { name: 'Meal Planner' }).click()

  await expect(page.getByRole('heading', { level: 2, name: 'Weekly Meal Planner' })).toBeVisible()
  await expect(page.getByRole('heading', { level: 3, name: 'Monday' })).toBeVisible()
})

test('keeps dark-mode root edges dark across the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await gotoLocalSafeApp(page, { theme: 'dark' })

  const themeState = await page.evaluate(() => {
    const readBackground = (element) => {
      const styles = window.getComputedStyle(element)

      return {
        backgroundImage: styles.backgroundImage,
        backgroundAttachment: styles.backgroundAttachment,
      }
    }

    const root = document.querySelector('#root')
    if (!root) {
      throw new Error('Expected #root to exist.')
    }

    return {
      htmlTheme: document.documentElement.dataset.theme,
      bodyTheme: document.body.dataset.theme,
      html: readBackground(document.documentElement),
      body: readBackground(document.body),
      root: readBackground(root),
    }
  })

  expect(themeState.htmlTheme).toBe('dark')
  expect(themeState.bodyTheme).toBe('dark')

  const edgeSamples = await readViewportEdgeSamples(page)

  for (const sample of edgeSamples) {
    expect(sample.alpha).toBeGreaterThan(0)
    expect(sample.luminance).toBeLessThan(80)
  }
})

test('keeps recipe card action buttons clickable without opening the card modal', async ({ page }) => {
  await gotoLocalSafeApp(page, { interceptWindowOpen: true })

  const recipeCard = page.locator('.recipe-card', {
    has: page.getByRole('heading', { level: 3, name: 'Classic Chocolate Chip Cookies' }),
  })
  const focusedRecipeDialog = page.getByRole('dialog', { name: 'Classic Chocolate Chip Cookies' })

  await expect(recipeCard).toBeVisible()
  await expect(focusedRecipeDialog).toHaveCount(0)

  await recipeCard.getByRole('button', { name: 'Visit recipe' }).click()

  await expect(focusedRecipeDialog).toHaveCount(0)
  await expect.poll(async () => page.evaluate(() => window.__openCalls)).toEqual([
    ['https://www.allrecipes.com/recipe/10813/best-chocolate-chip-cookies/', '_blank', 'noopener,noreferrer'],
  ])

  await recipeCard.getByRole('button', { name: 'Print recipe' }).click()

  await expect(focusedRecipeDialog).toHaveCount(0)
  await expect.poll(async () => page.evaluate(() => window.__openCalls)).toEqual([
    ['https://www.allrecipes.com/recipe/10813/best-chocolate-chip-cookies/', '_blank', 'noopener,noreferrer'],
    ['', '_blank'],
  ])
})

test('keeps controls-to-grid spacing at the intended desktop and compact gaps', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await gotoLocalSafeApp(page)

  const desktopSpacing = await readControlsToGridSpacing(page)

  expect(desktopSpacing.computedMarginTop).toBe(24)
  expect(desktopSpacing.renderedGap).toBeGreaterThanOrEqual(24)

  await page.setViewportSize({ width: 390, height: 844 })
  await page.reload()
  await expect(page.getByRole('heading', { level: 1, name: 'Dish Depot' })).toBeVisible()

  const compactSpacing = await readControlsToGridSpacing(page)

  expect(compactSpacing.computedMarginTop).toBe(16)
  expect(compactSpacing.renderedGap).toBeGreaterThanOrEqual(16)
})

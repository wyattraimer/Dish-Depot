import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import dishDepotLogo from './assets/dishdepot-no-background-674x674.png'
import dishDepotLogoBadge from './assets/dishdepot-674x674.png'
import { hasSupabaseConfig, supabase } from './lib/supabaseClient'

const CATEGORIES = {
  breakfast: { icon: 'fa-coffee', color: '#ffc107' },
  lunch: { icon: 'fa-sun', color: '#28a745' },
  dinner: { icon: 'fa-moon', color: '#6f42c1' },
  dessert: { icon: 'fa-ice-cream', color: '#e83e8c' },
  snack: { icon: 'fa-cookie', color: '#fd7e14' },
  side: { icon: 'fa-carrot', color: '#ffb703' },
  beverage: { icon: 'fa-mug-hot', color: '#17a2b8' },
  other: { icon: 'fa-utensils', color: '#6c757d' },
}

const CATEGORY_OPTIONS = [
  'breakfast',
  'lunch',
  'dinner',
  'dessert',
  'snack',
  'side',
  'beverage',
  'other',
]

const DEFAULT_RECIPES = [
  {
    id: 1001,
    name: 'Classic Chocolate Chip Cookies',
    url: 'https://www.allrecipes.com/recipe/10813/best-chocolate-chip-cookies/',
    image:
      'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=1200&q=80',
    ingredients: [
      '2 1/4 cups all-purpose flour',
      '1 tsp baking soda',
      '1 tsp salt',
      '1 cup unsalted butter, softened',
      '3/4 cup granulated sugar',
      '3/4 cup packed brown sugar',
      '2 large eggs',
      '2 tsp vanilla extract',
      '2 cups semisweet chocolate chips',
    ],
    directions: [
      'Preheat oven to 375 F and line two baking sheets with parchment paper.',
      'Whisk flour, baking soda, and salt together in a medium bowl.',
      'Beat butter, granulated sugar, and brown sugar until creamy, then mix in eggs and vanilla.',
      'Mix dry ingredients into wet ingredients just until combined, then fold in chocolate chips.',
      'Scoop 2 tablespoon portions of dough onto baking sheets and bake 9-11 minutes until edges are golden.',
      'Cool on the pan for 3 minutes before transferring cookies to a wire rack.',
    ],
    categories: ['dessert', 'snack'],
    notes: 'Slightly underbake for chewier centers. Sprinkle flaky salt on top while warm.',
    type: 'url',
  },
  {
    id: 1002,
    name: 'Chicken Fajita Bowl',
    url: 'https://eatwithclarity.com/chicken-fajita-bowls/',
    image:
      'https://eatwithclarity.com/wp-content/uploads/2023/03/chicken-fajita-bowls.jpg',
    ingredients: [
      '1 1/2 pounds chicken breast',
      '2 tablespoons olive oil',
      '1 teaspoon salt',
      '1 1/4 teaspoon garlic powder',
      '1 1/4 teaspoon cumin',
      '1 teaspoon brown sugar',
      '1 teaspoon oregano',
      '1 1/2 teaspoons chili powder',
      '3 teaspoons paprika',
      '1 tablespoon tapioca starch',
      '3 bell peppers any color',
      '1/2 large red onion',
    ],
    directions: [
      'Pound the chicken to about 1/4-1/2 inch thick. I used two large breasts and cut them in half lengthwise and cooked just like that (and cut after cooking), but you can also cut into strips before seasoning.',
      'Combine all seasonings and tapioca in a bowl.',
      'Coat the chicken in the seasonings.',
      'Add the olive oil to a skillet. Once hot, add the chicken and cook on each side for about 4-5 minutes or until cooked through.',
      'Set aside on a plate and cut into strips if you haven’t already.',
      'Add the sliced red onion and peppers to the same skillet and saute until golden brown, about 7-8 minutes. Add more oil if you notice anything sticking.',
      'Add the chicken back in and saute for 1-2 minutes to let the flavors blend.',
      'Assemble your bowls with a base of rice/lettuce, then add in the chicken/pepper mix, black beans, pico de gallo and chipotle aioli.',
      'If you aren’t a chipotle fan, you can use my cashew queso and cilantro lime crema instead.',
      'Also delicious with fresh guacamole and cilantro on top! Enjoy!',
    ],
    categories: ['dinner', 'lunch'],
    notes: 'Great for meal prep. Add black beans and corn to stretch servings.',
    type: 'url',
  },
  {
    id: 1003,
    name: 'Lemon Blueberry Buttermilk Pancakes',
    image:
      'https://images.unsplash.com/photo-1528207776546-365bb710ee93?auto=format&fit=crop&w=1200&q=80',
    ingredients: [
      '2 cups all-purpose flour',
      '2 tbsp sugar',
      '2 tsp baking powder',
      '1/2 tsp baking soda',
      '1/2 tsp salt',
      '2 cups buttermilk',
      '2 large eggs',
      '3 tbsp melted butter',
      '1 tsp vanilla extract',
      '1 tbsp lemon zest',
      '1 cup fresh blueberries',
    ],
    directions: [
      'Whisk flour, sugar, baking powder, baking soda, and salt in a large bowl.',
      'In another bowl, whisk buttermilk, eggs, melted butter, vanilla, and lemon zest.',
      'Pour wet ingredients into dry ingredients and stir gently until mostly combined.',
      'Fold in blueberries and let batter rest for 5 minutes.',
      'Cook pancakes on a lightly greased skillet over medium heat until bubbles form, then flip and cook until golden.',
      'Serve warm with maple syrup and extra blueberries.',
    ],
    categories: ['breakfast', 'dessert'],
    notes: 'Use frozen blueberries straight from the freezer to avoid purple batter.',
    type: 'custom',
  },
]

const STORAGE_KEY = 'recipeBookmarks'
const THEME_KEY = 'recipeTheme'
const MEAL_PLAN_KEY = 'recipeMealPlan'
const FALLBACK_API_BASE =
  import.meta.env.PROD && window.location.hostname.endsWith('coloradomesa.edu')
    ? 'https://recipes-zmky.onrender.com/api'
    : '/api'
const API_BASE = (import.meta.env.VITE_API_BASE || FALLBACK_API_BASE).replace(/\/$/, '')
const EXTRACT_ENDPOINT = `${API_BASE}/recipes/extract`

const MEAL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const MEAL_SLOTS = ['Breakfast', 'Lunch', 'Dinner']
const CLOUD_MEAL_PLAN_WEEK = '2000-01-03'

const DAY_TO_KEY = {
  Monday: 'monday',
  Tuesday: 'tuesday',
  Wednesday: 'wednesday',
  Thursday: 'thursday',
  Friday: 'friday',
  Saturday: 'saturday',
  Sunday: 'sunday',
}

const SLOT_TO_KEY = {
  Breakfast: 'breakfast',
  Lunch: 'lunch',
  Dinner: 'dinner',
}

const KEY_TO_DAY = Object.fromEntries(Object.entries(DAY_TO_KEY).map(([day, key]) => [key, day]))
const KEY_TO_SLOT = Object.fromEntries(Object.entries(SLOT_TO_KEY).map(([slot, key]) => [key, slot]))

const emptyForm = {
  name: '',
  url: '',
  image: '',
  ingredients: '',
  directions: '',
  notes: '',
  categories: [],
  visibility: 'private',
}

function migrateRecipes(recipes) {
  return recipes.map((recipe) => {
    if (recipe.category && !recipe.categories) {
      return {
        ...recipe,
        categories: [recipe.category],
      }
    }
    return recipe
  })
}

function mapSupabaseRecipeToApp(recipe) {
  return {
    id: recipe.id,
    name: recipe.name || '',
    url: recipe.url || '',
    image: recipe.image || '',
    notes: recipe.notes || '',
    ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
    directions: Array.isArray(recipe.directions) ? recipe.directions : [],
    categories: Array.isArray(recipe.categories) ? recipe.categories : [],
    pinned: Boolean(recipe.pinned),
    type: recipe.type || (recipe.url ? 'url' : 'custom'),
    visibility: recipe.visibility || 'private',
    shareSlug: recipe.share_slug || '',
    ownerId: recipe.owner_id || null,
    sharedReadOnly: false,
  }
}

function isUuidLike(value) {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function toCloudRecipePayload(recipe, ownerId) {
  return {
    owner_id: ownerId,
    name: recipe.name || '',
    url: recipe.url || null,
    image: recipe.image || null,
    notes: recipe.notes || null,
    ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
    directions: Array.isArray(recipe.directions) ? recipe.directions : [],
    categories: Array.isArray(recipe.categories) ? recipe.categories : [],
    pinned: Boolean(recipe.pinned),
    type: recipe.type || (recipe.url ? 'url' : 'custom'),
    visibility: recipe.visibility || 'private',
    share_slug: recipe.shareSlug || null,
    deleted_at: null,
  }
}

function buildRecipeFingerprint(recipe) {
  const normalizeList = (value) =>
    (Array.isArray(value) ? value : [])
      .map((item) => String(item || '').trim().toLowerCase())
      .filter(Boolean)
      .join('|')

  return [
    String(recipe.url || '').trim().toLowerCase(),
    String(recipe.name || '').trim().toLowerCase(),
    normalizeList(recipe.ingredients),
    normalizeList(recipe.directions),
  ].join('::')
}

function formatCategory(category) {
  return category.charAt(0).toUpperCase() + category.slice(1)
}

function createEmptyMealPlan() {
  return MEAL_DAYS.reduce((plan, day) => {
    plan[day] = { Breakfast: '', Lunch: '', Dinner: '' }
    return plan
  }, {})
}

function mapCloudMealPlanRowsToLocal(rows) {
  const base = createEmptyMealPlan()

  if (!Array.isArray(rows)) {
    return base
  }

  rows.forEach((row) => {
    const day = KEY_TO_DAY[row.day]
    const slot = KEY_TO_SLOT[row.slot]
    if (!day || !slot) {
      return
    }

    base[day][slot] = row.recipe_id ? String(row.recipe_id) : ''
  })

  return base
}

function normalizeIngredientKey(value) {
  return value.toLowerCase().replace(/\s+/g, ' ').trim()
}

const UNICODE_FRACTIONS = {
  '¼': '1/4',
  '½': '1/2',
  '¾': '3/4',
  '⅐': '1/7',
  '⅑': '1/9',
  '⅒': '1/10',
  '⅓': '1/3',
  '⅔': '2/3',
  '⅕': '1/5',
  '⅖': '2/5',
  '⅗': '3/5',
  '⅘': '4/5',
  '⅙': '1/6',
  '⅚': '5/6',
  '⅛': '1/8',
  '⅜': '3/8',
  '⅝': '5/8',
  '⅞': '7/8',
}

const UNIT_ALIASES = {
  tsp: { aliases: ['tsp', 'teaspoon', 'teaspoons', 't'], type: 'volume', toBase: 4.92892 },
  tbsp: { aliases: ['tbsp', 'tablespoon', 'tablespoons'], type: 'volume', toBase: 14.7868 },
  cup: { aliases: ['cup', 'cups', 'c'], type: 'volume', toBase: 236.588 },
  ml: { aliases: ['ml', 'milliliter', 'milliliters'], type: 'volume', toBase: 1 },
  l: { aliases: ['l', 'liter', 'liters'], type: 'volume', toBase: 1000 },
  oz: { aliases: ['oz', 'ounce', 'ounces'], type: 'mass', toBase: 28.3495 },
  lb: { aliases: ['lb', 'lbs', 'pound', 'pounds'], type: 'mass', toBase: 453.592 },
  g: { aliases: ['g', 'gram', 'grams'], type: 'mass', toBase: 1 },
  kg: { aliases: ['kg', 'kilogram', 'kilograms'], type: 'mass', toBase: 1000 },
  clove: { aliases: ['clove', 'cloves'], type: 'count', toBase: 1 },
  can: { aliases: ['can', 'cans'], type: 'count', toBase: 1 },
  piece: { aliases: ['piece', 'pieces'], type: 'count', toBase: 1 },
  slice: { aliases: ['slice', 'slices'], type: 'count', toBase: 1 },
  bunch: { aliases: ['bunch', 'bunches'], type: 'count', toBase: 1 },
  stick: { aliases: ['stick', 'sticks'], type: 'count', toBase: 1 },
  package: { aliases: ['package', 'packages', 'pkg', 'pkgs'], type: 'count', toBase: 1 },
}

const UNIT_LOOKUP = Object.entries(UNIT_ALIASES).reduce((lookup, [unit, config]) => {
  config.aliases.forEach((alias) => {
    lookup[alias] = unit
  })
  return lookup
}, {})

const NAME_ALIASES = {
  'all purpose flour': 'flour',
  'all-purpose flour': 'flour',
  scallions: 'green onion',
  scallion: 'green onion',
  'confectioners sugar': 'powdered sugar',
  'powdered sugars': 'powdered sugar',
}

const NOISE_WORDS = new Set([
  'fresh',
  'chopped',
  'diced',
  'minced',
  'large',
  'small',
  'medium',
  'optional',
  'to',
  'taste',
])

function replaceUnicodeFractions(text) {
  return text
    .split('')
    .map((char) => (UNICODE_FRACTIONS[char] ? ` ${UNICODE_FRACTIONS[char]} ` : char))
    .join('')
}

function parseNumericToken(token) {
  if (!token) {
    return null
  }

  const normalized = token.replace(/,/g, '').trim()
  if (!normalized) {
    return null
  }

  if (/^\d+\/\d+$/.test(normalized)) {
    const [num, den] = normalized.split('/').map(Number)
    if (!den) {
      return null
    }
    return num / den
  }

  if (/^\d+(\.\d+)?$/.test(normalized)) {
    return Number(normalized)
  }

  return null
}

function parseLeadingQuantity(tokens) {
  if (tokens.length === 0) {
    return { quantity: null, consumed: 0 }
  }

  const first = parseNumericToken(tokens[0])
  if (first == null) {
    return { quantity: null, consumed: 0 }
  }

  let consumed = 1
  let quantity = first

  const second = parseNumericToken(tokens[1])
  if (second != null && second < 1) {
    quantity += second
    consumed += 1
  }

  return { quantity, consumed }
}

function normalizeIngredientName(rawName) {
  const base = rawName
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .split(',')[0]
    .replace(/[^a-z\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  const cleaned = base
    .split(' ')
    .filter((word) => !NOISE_WORDS.has(word))
    .join(' ')
    .trim()

  if (!cleaned) {
    return ''
  }

  const singular = cleaned
    .split(' ')
    .map((word) => {
      if (word.length > 3 && word.endsWith('s') && !word.endsWith('ss')) {
        return word.slice(0, -1)
      }
      return word
    })
    .join(' ')

  return NAME_ALIASES[singular] || singular
}

function parseIngredientLine(rawText) {
  const replaced = replaceUnicodeFractions(rawText || '')
  const cleaned = replaced
    .replace(/^[-*•]+\s*/, '')
    .replace(/\s+/g, ' ')
    .trim()

  if (!cleaned) {
    return null
  }

  const tokens = cleaned.split(' ')
  const { quantity, consumed } = parseLeadingQuantity(tokens)

  let tokenIndex = consumed
  let unitKey = ''
  let unitType = ''
  let toBase = 1

  const rawUnit = (tokens[tokenIndex] || '').toLowerCase().replace(/[.,]/g, '')
  if (UNIT_LOOKUP[rawUnit]) {
    unitKey = UNIT_LOOKUP[rawUnit]
    unitType = UNIT_ALIASES[unitKey].type
    toBase = UNIT_ALIASES[unitKey].toBase
    tokenIndex += 1
  }

  const remaining = tokens.slice(tokenIndex).join(' ').trim()
  const normalizedName = normalizeIngredientName(remaining)

  if (!normalizedName) {
    return {
      raw: cleaned,
      convertible: false,
    }
  }

  if (quantity == null || !unitType) {
    return {
      raw: cleaned,
      name: normalizedName,
      convertible: false,
    }
  }

  return {
    raw: cleaned,
    name: normalizedName,
    quantity,
    unitKey,
    unitType,
    toBase,
    convertible: true,
  }
}

function toDisplayName(name) {
  return name
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function roundQuantity(value) {
  const rounded = Math.round(value * 100) / 100
  if (Number.isInteger(rounded)) {
    return String(rounded)
  }
  return rounded.toFixed(2).replace(/0$/, '').replace(/\.0$/, '')
}

function formatTotalUnit(baseAmount, unitType, preferredSystem) {
  if (unitType === 'count') {
    return { quantity: baseAmount, unit: '' }
  }

  if (unitType === 'volume') {
    if (preferredSystem === 'metric') {
      if (baseAmount >= 1000) {
        return { quantity: baseAmount / 1000, unit: 'l' }
      }
      return { quantity: baseAmount, unit: 'ml' }
    }

    if (baseAmount >= UNIT_ALIASES.cup.toBase) {
      return { quantity: baseAmount / UNIT_ALIASES.cup.toBase, unit: 'cup' }
    }
    if (baseAmount >= UNIT_ALIASES.tbsp.toBase) {
      return { quantity: baseAmount / UNIT_ALIASES.tbsp.toBase, unit: 'tbsp' }
    }
    return { quantity: baseAmount / UNIT_ALIASES.tsp.toBase, unit: 'tsp' }
  }

  if (preferredSystem === 'metric') {
    if (baseAmount >= 1000) {
      return { quantity: baseAmount / 1000, unit: 'kg' }
    }
    return { quantity: baseAmount, unit: 'g' }
  }

  if (baseAmount >= UNIT_ALIASES.lb.toBase) {
    return { quantity: baseAmount / UNIT_ALIASES.lb.toBase, unit: 'lb' }
  }
  return { quantity: baseAmount / UNIT_ALIASES.oz.toBase, unit: 'oz' }
}

function buildShoppingAggregation(candidates, preferredSystem) {
  const totalsMap = new Map()
  const unresolvedMap = new Map()

  candidates
    .filter((candidate) => candidate.selected)
    .forEach((candidate) => {
      const ingredients = Array.isArray(candidate.recipe.ingredients) ? candidate.recipe.ingredients : []
      ingredients.forEach((rawIngredient) => {
        const parsed = parseIngredientLine(rawIngredient)
        if (!parsed) {
          return
        }

        if (!parsed.convertible) {
          const unresolvedKey = normalizeIngredientKey(parsed.raw)
          const unresolved = unresolvedMap.get(unresolvedKey) || {
            key: `unresolved:${unresolvedKey}`,
            text: parsed.raw,
            count: 0,
          }
          unresolved.count += 1
          unresolvedMap.set(unresolvedKey, unresolved)
          return
        }

        const totalKey =
          parsed.unitType === 'count'
            ? `${parsed.unitType}:${parsed.unitKey}:${parsed.name}`
            : `${parsed.unitType}:${parsed.name}`

        const existing = totalsMap.get(totalKey) || {
          key: `total:${totalKey}`,
          name: parsed.name,
          unitType: parsed.unitType,
          unitKey: parsed.unitKey,
          baseAmount: 0,
          sourceCount: 0,
        }

        existing.baseAmount += parsed.quantity * parsed.toBase
        existing.sourceCount += 1
        totalsMap.set(totalKey, existing)
      })
    })

  const totals = Array.from(totalsMap.values())
    .map((entry) => {
      if (entry.unitType === 'count') {
        return {
          ...entry,
          amountLabel: `${roundQuantity(entry.baseAmount)} ${entry.unitKey} ${toDisplayName(entry.name)}`,
        }
      }

      const display = formatTotalUnit(entry.baseAmount, entry.unitType, preferredSystem)
      return {
        ...entry,
        amountLabel: `${roundQuantity(display.quantity)} ${display.unit} ${toDisplayName(entry.name)}`,
      }
    })
    .sort((a, b) => a.amountLabel.localeCompare(b.amountLabel))

  const unresolved = Array.from(unresolvedMap.values()).sort((a, b) => a.text.localeCompare(b.text))
  return { totals, unresolved }
}

function escapePrintHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function buildPrintableRecipesDocument(recipes) {
  const generatedAt = new Date().toLocaleString()

  const recipeSections = recipes
    .map((recipe) => {
      const categories = recipe.categories || (recipe.category ? [recipe.category] : [])
      const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : []
      const directions = Array.isArray(recipe.directions) ? recipe.directions : []
      const notes = recipe.notes ? `<p class="notes"><strong>Notes:</strong> ${escapePrintHtml(recipe.notes)}</p>` : ''
      const url = recipe.url
        ? `<p class="source"><strong>Source:</strong> <a href="${escapePrintHtml(recipe.url)}">${escapePrintHtml(recipe.url)}</a></p>`
        : ''

      const ingredientsList =
        ingredients.length > 0
          ? `<ul>${ingredients.map((item) => `<li>${escapePrintHtml(item)}</li>`).join('')}</ul>`
          : '<p class="muted">No ingredients provided.</p>'

      const directionsList =
        directions.length > 0
          ? `<ol>${directions.map((step) => `<li>${escapePrintHtml(step)}</li>`).join('')}</ol>`
          : '<p class="muted">No directions provided.</p>'

      return `
        <article class="recipe-card">
          <header>
            <h2>${escapePrintHtml(recipe.name || 'Untitled Recipe')}</h2>
            ${categories.length > 0 ? `<p class="categories">${categories.map((category) => escapePrintHtml(formatCategory(category))).join(' • ')}</p>` : ''}
          </header>
          ${url}
          ${notes}
          <section>
            <h3>Ingredients</h3>
            ${ingredientsList}
          </section>
          <section>
            <h3>Directions</h3>
            ${directionsList}
          </section>
        </article>
      `
    })
    .join('')

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Dish Depot Recipes</title>
    <style>
      :root {
        color-scheme: light;
      }
      * {
        box-sizing: border-box;
      }
      body {
        margin: 0;
        padding: 22px;
        color: #1f2933;
        font-family: "Georgia", "Times New Roman", serif;
        line-height: 1.55;
        background: #fff;
      }
      .print-header {
        margin-bottom: 20px;
        border-bottom: 2px solid #d1d5db;
        padding-bottom: 12px;
      }
      .preview-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 14px;
      }
      .preview-actions button {
        border: 1px solid #bcc6d2;
        background: #f8fafc;
        color: #1f2933;
        border-radius: 999px;
        padding: 8px 12px;
        font: 600 0.9rem/1.2 "Segoe UI", "Arial", sans-serif;
        cursor: pointer;
      }
      .preview-actions button.primary {
        border-color: #d1483e;
        background: #d1483e;
        color: #fff;
      }
      .preview-note {
        margin: 0 0 12px;
        color: #4b5563;
        font: 500 0.88rem/1.35 "Segoe UI", "Arial", sans-serif;
      }
      .print-header h1 {
        margin: 0;
        font-size: 1.7rem;
      }
      .print-header p {
        margin: 5px 0 0;
        color: #4b5563;
      }
      .recipe-card {
        border: 1px solid #d1d5db;
        border-radius: 10px;
        padding: 16px;
        margin-bottom: 14px;
        page-break-inside: avoid;
      }
      h2 {
        margin: 0;
        font-size: 1.3rem;
      }
      h3 {
        margin: 0 0 7px;
        font-size: 1rem;
      }
      .categories,
      .source,
      .notes,
      .muted {
        margin: 8px 0;
      }
      .categories,
      .muted {
        color: #4b5563;
      }
      .source a {
        color: #1f4e79;
        word-break: break-all;
      }
      ul,
      ol {
        margin: 0;
        padding-left: 1.2rem;
      }
      li + li {
        margin-top: 4px;
      }
      @media print {
        .preview-actions,
        .preview-note {
          display: none;
        }
        body {
          padding: 0;
        }
        .recipe-card {
          margin-bottom: 10px;
        }
      }
    </style>
  </head>
  <body>
    <div class="preview-actions" role="group" aria-label="Preview actions">
      <button type="button" data-action="back">Back to Dish Depot</button>
      <button type="button" data-action="print" class="primary">Print / Save PDF</button>
    </div>
    <p class="preview-note">Use "Back to Dish Depot" to return without printing.</p>
    <header class="print-header">
      <h1>Dish Depot Recipe Export</h1>
      <p>Generated ${escapePrintHtml(generatedAt)} • ${recipes.length} recipe${recipes.length === 1 ? '' : 's'}</p>
    </header>
    ${recipeSections}
    <script>
      (() => {
        const printButton = document.querySelector('[data-action="print"]')
        const backButton = document.querySelector('[data-action="back"]')

        if (printButton) {
          printButton.addEventListener('click', () => {
            window.focus()
            window.print()
          })
        }

        if (backButton) {
          backButton.addEventListener('click', () => {
            if (window.opener && !window.opener.closed) {
              window.close()
              return
            }
            if (window.history.length > 1) {
              window.history.back()
              return
            }
            window.location.replace('/')
          })
        }
      })()
    </script>
  </body>
</html>`
}

function isRunningStandalonePwa() {
  if (typeof window === 'undefined') {
    return false
  }

  const displayModeStandalone = window.matchMedia('(display-mode: standalone)').matches
  const displayModeFullscreen = window.matchMedia('(display-mode: fullscreen)').matches
  const displayModeMinimalUi = window.matchMedia('(display-mode: minimal-ui)').matches
  const iosStandalone = typeof navigator !== 'undefined' && 'standalone' in navigator && Boolean(navigator.standalone)

  return displayModeStandalone || displayModeFullscreen || displayModeMinimalUi || iosStandalone
}

const AVATAR_SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 30

function extractAvatarStoragePath(value) {
  if (typeof value !== 'string') {
    return ''
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return ''
  }

  if (!/^https?:\/\//i.test(trimmed)) {
    return trimmed
  }

  try {
    const parsed = new URL(trimmed)
    const marker = '/avatars/'
    const markerIndex = parsed.pathname.indexOf(marker)
    if (markerIndex === -1) {
      return ''
    }
    return decodeURIComponent(parsed.pathname.slice(markerIndex + marker.length))
  } catch {
    return ''
  }
}

async function resolveAvatarDisplayUrl(value) {
  if (typeof value !== 'string' || !value.trim()) {
    return ''
  }

  const trimmed = value.trim()
  const storagePath = extractAvatarStoragePath(trimmed)
  if (!storagePath || !hasSupabaseConfig || !supabase) {
    return trimmed
  }

  const { data, error } = await supabase.storage.from('avatars').createSignedUrl(storagePath, AVATAR_SIGNED_URL_TTL_SECONDS)
  if (!error && data?.signedUrl) {
    return data.signedUrl
  }

  const { data: publicData } = supabase.storage.from('avatars').getPublicUrl(storagePath)
  if (publicData?.publicUrl) {
    return publicData.publicUrl
  }

  return /^https?:\/\//i.test(trimmed) ? trimmed : ''
}

function FloatingControls({
  canShowFloating,
  showAddRecipeFab,
  showInstallBtn,
  showSwUpdateBanner,
  onInstallClick,
  onDismissInstall,
  onTriggerSwUpdate,
  onDismissSwUpdate,
  onAddRecipe,
}) {
  const [showBackToTop, setShowBackToTop] = useState(false)
  const showBackToTopRef = useRef(false)
  const scrollRafRef = useRef(0)

  useEffect(() => {
    if (!canShowFloating) {
      showBackToTopRef.current = false
      return undefined
    }

    const updateBackToTopVisibility = () => {
      scrollRafRef.current = 0
      const shouldShow = window.scrollY > 320
      if (showBackToTopRef.current !== shouldShow) {
        showBackToTopRef.current = shouldShow
        setShowBackToTop(shouldShow)
      }
    }

    const onScroll = () => {
      if (scrollRafRef.current !== 0) {
        return
      }
      scrollRafRef.current = window.requestAnimationFrame(updateBackToTopVisibility)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    updateBackToTopVisibility()

    return () => {
      window.removeEventListener('scroll', onScroll)
      if (scrollRafRef.current !== 0) {
        window.cancelAnimationFrame(scrollRafRef.current)
      }
    }
  }, [canShowFloating])

  const scrollToTop = () => {
    const startY = window.scrollY
    if (startY <= 0) {
      return
    }

    const duration = 260
    const startTime = performance.now()

    const step = (now) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)

      window.scrollTo(0, Math.round(startY * (1 - eased)))

      if (progress < 1) {
        window.requestAnimationFrame(step)
      }
    }

    window.requestAnimationFrame(step)
  }

  return (
    <>
      {showInstallBtn ? (
        <div className="pwa-install-wrap" role="group" aria-label="Install app prompt">
          <button id="pwaInstallBtn" className="btn btn-secondary pwa-install-btn" type="button" onClick={onInstallClick}>
            <i className="fas fa-download" />
            Install App
          </button>
          <button className="pwa-install-dismiss" type="button" onClick={onDismissInstall} aria-label="Dismiss install app prompt">
            <i className="fas fa-times" />
          </button>
        </div>
      ) : null}

      {showSwUpdateBanner ? (
        <div id="swUpdateBanner" className="sw-update-banner">
          <div className="sw-update-message">New version available</div>
          <button className="btn btn-primary" type="button" onClick={onTriggerSwUpdate}>
            Update now
          </button>
          <button className="btn btn-secondary" type="button" onClick={onDismissSwUpdate}>
            Later
          </button>
        </div>
      ) : null}

      {canShowFloating && showBackToTop && !showSwUpdateBanner ? (
        <button
          className={`btn btn-primary back-to-top-btn ${showInstallBtn ? 'back-to-top-btn-has-install' : ''}`}
          type="button"
          onClick={scrollToTop}
          aria-label="Back to top"
        >
          <i className="fas fa-arrow-up" />
          <span>Top</span>
        </button>
      ) : null}

      {canShowFloating && !showSwUpdateBanner && showAddRecipeFab ? (
        <button
          className={`btn btn-primary mobile-add-fab ${showInstallBtn ? 'mobile-add-fab-has-install' : ''} ${showBackToTop ? 'mobile-add-fab-has-top' : ''}`}
          type="button"
          onClick={onAddRecipe}
          aria-label="Add recipe"
        >
          <i className="fas fa-plus" />
          <span>Add Recipe</span>
        </button>
      ) : null}
    </>
  )
}

function App() {
  const [recipes, setRecipes] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      const parsed = saved ? JSON.parse(saved) : DEFAULT_RECIPES
      return migrateRecipes(parsed)
    } catch {
      return DEFAULT_RECIPES
    }
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [showPinnedOnly, setShowPinnedOnly] = useState(false)
  const [activeView, setActiveView] = useState('recipes')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [focusedRecipe, setFocusedRecipe] = useState(null)
  const [currentEditingId, setCurrentEditingId] = useState(null)
  const [currentRecipeType, setCurrentRecipeType] = useState('url')
  const [form, setForm] = useState(emptyForm)
  const [highlightedId, setHighlightedId] = useState(null)
  const [messages, setMessages] = useState([])
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showInstallBtn, setShowInstallBtn] = useState(false)
  const [showSwUpdateBanner, setShowSwUpdateBanner] = useState(false)
  const [isOnline, setIsOnline] = useState(() => navigator.onLine)
  const [isInstalledPwa, setIsInstalledPwa] = useState(() => isRunningStandalonePwa())
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem(THEME_KEY)
    return savedTheme === 'dark' ? 'dark' : 'light'
  })
  const [authMode, setAuthMode] = useState('signin')
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authDisplayName, setAuthDisplayName] = useState('')
  const [authUsername, setAuthUsername] = useState('')
  const [authBusy, setAuthBusy] = useState(false)
  const [authUser, setAuthUser] = useState(null)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [profileDisplayName, setProfileDisplayName] = useState('')
  const [profileUsername, setProfileUsername] = useState('')
  const [profileAvatarValue, setProfileAvatarValue] = useState('')
  const [profileAvatarUrl, setProfileAvatarUrl] = useState('')
  const [isAvatarActionMenuOpen, setIsAvatarActionMenuOpen] = useState(false)
  const [profileBusy, setProfileBusy] = useState(false)
  const [profileUploading, setProfileUploading] = useState(false)
  const [recipeScope, setRecipeScope] = useState('mine')
  const [sharedRecipes, setSharedRecipes] = useState([])
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [shareTargetRecipe, setShareTargetRecipe] = useState(null)
  const [shareLookupText, setShareLookupText] = useState('')
  const [shareResults, setShareResults] = useState([])
  const [shareCanEdit, setShareCanEdit] = useState(false)
  const [shareBusy, setShareBusy] = useState(false)
  const [shareRecipients, setShareRecipients] = useState([])
  const [shareRecipientsLoading, setShareRecipientsLoading] = useState(false)
  const [isBulkUploading, setIsBulkUploading] = useState(false)
  const [isImportPreviewOpen, setIsImportPreviewOpen] = useState(false)
  const [importCandidates, setImportCandidates] = useState([])
  const [importSummary, setImportSummary] = useState(null)
  const [isExportPreviewOpen, setIsExportPreviewOpen] = useState(false)
  const [exportCandidates, setExportCandidates] = useState([])
  const [isShoppingListOpen, setIsShoppingListOpen] = useState(false)
  const [shoppingCandidates, setShoppingCandidates] = useState([])
  const [shoppingChecklist, setShoppingChecklist] = useState({})
  const [shoppingUnitSystem, setShoppingUnitSystem] = useState('us')
  const [shoppingMergeSelection, setShoppingMergeSelection] = useState({})
  const [shoppingManualGroups, setShoppingManualGroups] = useState([])
  const [shoppingManualText, setShoppingManualText] = useState('')
  const [shoppingManualEditingKey, setShoppingManualEditingKey] = useState('')
  const [shoppingManualEditDraft, setShoppingManualEditDraft] = useState('')
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractWarnings, setExtractWarnings] = useState([])
  const [extractCandidate, setExtractCandidate] = useState(null)
  const [mealPlan, setMealPlan] = useState(() => {
    try {
      const savedPlan = localStorage.getItem(MEAL_PLAN_KEY)
      if (!savedPlan) {
        return createEmptyMealPlan()
      }
      const parsed = JSON.parse(savedPlan)
      const base = createEmptyMealPlan()
      MEAL_DAYS.forEach((day) => {
        MEAL_SLOTS.forEach((slot) => {
          base[day][slot] = parsed?.[day]?.[slot] || ''
        })
      })
      return base
    } catch {
      return createEmptyMealPlan()
    }
  })

  const swRegistrationRef = useRef(null)
  const importInputRef = useRef(null)
  const profileAvatarInputRef = useRef(null)
  const profileAvatarEditBtnRef = useRef(null)
  const profileAvatarMenuRef = useRef(null)
  const networkStatusRef = useRef(navigator.onLine)
  const cloudSyncUserRef = useRef('')
  const cloudMealPlanUserRef = useRef('')

  const scopedRecipes = useMemo(() => (recipeScope === 'shared' ? sharedRecipes : recipes), [recipeScope, sharedRecipes, recipes])

  const filteredRecipes = useMemo(() => {
    const normalizedSearch = searchTerm.toLowerCase().trim()
    return scopedRecipes
      .filter((recipe) => {
        const matchesSearch =
          !normalizedSearch ||
          recipe.name.toLowerCase().includes(normalizedSearch) ||
          (recipe.categories || []).some((cat) => cat.toLowerCase().includes(normalizedSearch)) ||
          (recipe.notes || '').toLowerCase().includes(normalizedSearch)

        const matchesCategory = !categoryFilter || (recipe.categories || []).includes(categoryFilter)
        const matchesPinned = !showPinnedOnly || Boolean(recipe.pinned)
        return matchesSearch && matchesCategory && matchesPinned
      })
      .sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)))
  }, [scopedRecipes, searchTerm, categoryFilter, showPinnedOnly])

  const plannerRecipes = useMemo(
    () => [...recipes].sort((a, b) => a.name.localeCompare(b.name)),
    [recipes],
  )

  const recipeNameById = useMemo(() => {
    const map = new Map()
    recipes.forEach((recipe) => {
      map.set(String(recipe.id), recipe.name)
    })
    return map
  }, [recipes])

  const selectedImportCount = useMemo(
    () => importCandidates.filter((candidate) => candidate.selected).length,
    [importCandidates],
  )

  const selectedExportCount = useMemo(
    () => exportCandidates.filter((candidate) => candidate.selected).length,
    [exportCandidates],
  )

  const selectedShoppingCount = useMemo(
    () => shoppingCandidates.filter((candidate) => candidate.selected).length,
    [shoppingCandidates],
  )

  const shoppingAggregation = useMemo(
    () => buildShoppingAggregation(shoppingCandidates, shoppingUnitSystem),
    [shoppingCandidates, shoppingUnitSystem],
  )

  const combinedShoppingItems = shoppingAggregation.totals
  const unresolvedShoppingItems = shoppingAggregation.unresolved
  const unresolvedByKey = useMemo(
    () => Object.fromEntries(unresolvedShoppingItems.map((item) => [item.key, item])),
    [unresolvedShoppingItems],
  )
  const hiddenUnresolvedKeys = useMemo(() => {
    const hidden = new Set()
    shoppingManualGroups.forEach((group) => {
      group.sourceKeys.forEach((key) => hidden.add(key))
    })
    return hidden
  }, [shoppingManualGroups])
  const visibleUnresolvedItems = useMemo(
    () => unresolvedShoppingItems.filter((item) => !hiddenUnresolvedKeys.has(item.key)),
    [unresolvedShoppingItems, hiddenUnresolvedKeys],
  )

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes))
  }, [recipes])

  useEffect(() => {
    localStorage.setItem(MEAL_PLAN_KEY, JSON.stringify(mealPlan))
  }, [mealPlan])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.body.dataset.theme = theme

    const themeColor = theme === 'dark' ? '#0b131d' : '#e63946'
    const themeColorMeta = document.querySelector('meta[name="theme-color"]')
    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', themeColor)
    }

    const statusBarMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')
    if (statusBarMeta) {
      statusBarMeta.setAttribute('content', theme === 'dark' ? 'black-translucent' : 'default')
    }

    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  useEffect(() => {
    if (!focusedRecipe) {
      return undefined
    }

    const { overflow, position, top, width } = document.body.style
    const scrollY = window.scrollY

    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = '100%'

    return () => {
      document.body.style.overflow = overflow
      document.body.style.position = position
      document.body.style.top = top
      document.body.style.width = width
      window.scrollTo(0, scrollY)
    }
  }, [focusedRecipe])

  useEffect(() => {
    const onBeforeInstallPrompt = (event) => {
      event.preventDefault()
      setDeferredPrompt(event)
      setShowInstallBtn(true)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
  }, [])

  useEffect(() => {
    if (!hasSupabaseConfig || !supabase) {
      return undefined
    }

    let isMounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) {
        return
      }
      setAuthUser(data.session?.user || null)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user || null)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!hasSupabaseConfig || !supabase || !authUser?.id) {
      setProfileDisplayName('')
      setProfileUsername('')
      setProfileAvatarValue('')
      setProfileAvatarUrl('')
      return
    }

    let cancelled = false

    const loadProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('display_name,username,avatar_url')
        .eq('id', authUser.id)
        .maybeSingle()

      if (cancelled) {
        return
      }

      if (error) {
        const missingAvatarColumn = String(error.message || '').toLowerCase().includes('avatar_url')

        if (!missingAvatarColumn) {
          showMessage(`Could not load profile: ${error.message}`, 'info')
          return
        }

        const { data: fallbackData, error: fallbackError } = await supabase
          .from('profiles')
          .select('display_name,username')
          .eq('id', authUser.id)
          .maybeSingle()

        if (cancelled) {
          return
        }

        if (fallbackError) {
          showMessage(`Could not load profile: ${fallbackError.message}`, 'info')
          return
        }

        setProfileDisplayName(fallbackData?.display_name || '')
        setProfileUsername(fallbackData?.username || '')
        setProfileAvatarValue('')
        setProfileAvatarUrl('')
        return
      }

      setProfileDisplayName(data?.display_name || '')
      setProfileUsername(data?.username || '')
      const avatarValue = data?.avatar_url || ''
      setProfileAvatarValue(avatarValue)
      const avatarDisplayUrl = await resolveAvatarDisplayUrl(avatarValue)
      if (cancelled) {
        return
      }
      setProfileAvatarUrl(avatarDisplayUrl)
    }

    void loadProfile()

    return () => {
      cancelled = true
    }
  }, [authUser?.id])

  useEffect(() => {
    if (!hasSupabaseConfig || !supabase) {
      return
    }

    if (!authUser?.id) {
      cloudSyncUserRef.current = ''
      cloudMealPlanUserRef.current = ''
      return
    }

    if (!isOnline) {
      return
    }

    if (cloudSyncUserRef.current === authUser.id) {
      return
    }

    let cancelled = false

    const pushCloudMessage = (text, type) => {
      const id = Date.now() + Math.random()
      setMessages((prev) => [...prev, { id, text, type }])
      window.setTimeout(() => {
        setMessages((prev) => prev.filter((message) => message.id !== id))
      }, 3000)
    }

    const fetchCloudRecipes = async () => {
      const { data, error } = await supabase
        .from('recipes')
        .select('id,owner_id,name,url,image,notes,ingredients,directions,categories,pinned,type,visibility,share_slug,updated_at,deleted_at')
        .eq('owner_id', authUser.id)
        .is('deleted_at', null)
        .order('updated_at', { ascending: false })

      if (cancelled) {
        return
      }

      if (error) {
        pushCloudMessage(`Cloud sync unavailable: ${error.message}`, 'info')
        return
      }

      cloudSyncUserRef.current = authUser.id

      if (!Array.isArray(data) || data.length === 0) {
        pushCloudMessage('No cloud recipes found yet. Using your local recipes.', 'info')
        return
      }

      setRecipes(migrateRecipes(data.map((item) => ({ ...mapSupabaseRecipeToApp(item), sharedReadOnly: false }))))
      pushCloudMessage(`Loaded ${data.length} cloud recipe${data.length === 1 ? '' : 's'}.`, 'success')
    }

    void fetchCloudRecipes()

    return () => {
      cancelled = true
    }
  }, [authUser?.id, isOnline])

  useEffect(() => {
    if (!hasSupabaseConfig || !supabase || !authUser?.id || !isOnline) {
      setSharedRecipes([])
      return
    }

    let cancelled = false

    const fetchSharedRecipes = async () => {
      const { data: shareRows, error: sharesError } = await supabase
        .from('recipe_shares')
        .select('recipe_id,can_edit')
        .eq('shared_with_user_id', authUser.id)

      if (cancelled) {
        return
      }

      if (sharesError) {
        showMessage(`Could not load shared recipes: ${sharesError.message}`, 'info')
        return
      }

      if (!Array.isArray(shareRows) || shareRows.length === 0) {
        setSharedRecipes([])
        return
      }

      const recipeIds = shareRows.map((row) => row.recipe_id)
      const editMap = new Map(shareRows.map((row) => [row.recipe_id, Boolean(row.can_edit)]))

      const { data: sharedRows, error: sharedError } = await supabase
        .from('recipes')
        .select('id,owner_id,name,url,image,notes,ingredients,directions,categories,pinned,type,visibility,share_slug,updated_at,deleted_at')
        .in('id', recipeIds)
        .is('deleted_at', null)
        .order('updated_at', { ascending: false })

      if (cancelled) {
        return
      }

      if (sharedError) {
        showMessage(`Could not load shared recipes: ${sharedError.message}`, 'info')
        return
      }

      const mapped = migrateRecipes(
        (sharedRows || []).map((row) => ({
          ...mapSupabaseRecipeToApp(row),
          sharedReadOnly: !editMap.get(row.id),
        })),
      )

      setSharedRecipes(mapped)
    }

    void fetchSharedRecipes()

    return () => {
      cancelled = true
    }
  }, [authUser?.id, isOnline, recipeScope])

  useEffect(() => {
    if (!hasSupabaseConfig || !supabase || !authUser?.id || !isOnline) {
      return
    }

    if (cloudMealPlanUserRef.current === authUser.id) {
      return
    }

    let cancelled = false

    const fetchCloudMealPlan = async () => {
      const { data, error } = await supabase
        .from('meal_plans')
        .select('day,slot,recipe_id,updated_at')
        .eq('owner_id', authUser.id)
        .eq('week_start', CLOUD_MEAL_PLAN_WEEK)

      if (cancelled) {
        return
      }

      if (error) {
        showMessage(`Could not load cloud meal plan: ${error.message}`, 'info')
        return
      }

      cloudMealPlanUserRef.current = authUser.id

      if (!Array.isArray(data) || data.length === 0) {
        return
      }

      setMealPlan(mapCloudMealPlanRowsToLocal(data))
      showMessage('Loaded meal planner from cloud.', 'success')
    }

    void fetchCloudMealPlan()

    return () => {
      cancelled = true
    }
  }, [authUser?.id, isOnline])

  useEffect(() => {
    const refreshStandaloneState = () => {
      setIsInstalledPwa(isRunningStandalonePwa())
    }

    const mediaQueries = [
      window.matchMedia('(display-mode: standalone)'),
      window.matchMedia('(display-mode: fullscreen)'),
      window.matchMedia('(display-mode: minimal-ui)'),
    ]

    const detach = mediaQueries.map((mediaQuery) => {
      const onChange = () => refreshStandaloneState()

      if (typeof mediaQuery.addEventListener === 'function') {
        mediaQuery.addEventListener('change', onChange)
        return () => mediaQuery.removeEventListener('change', onChange)
      }

      mediaQuery.addListener(onChange)
      return () => mediaQuery.removeListener(onChange)
    })

    window.addEventListener('focus', refreshStandaloneState)
    window.addEventListener('pageshow', refreshStandaloneState)
    refreshStandaloneState()

    return () => {
      detach.forEach((removeListener) => removeListener())
      window.removeEventListener('focus', refreshStandaloneState)
      window.removeEventListener('pageshow', refreshStandaloneState)
    }
  }, [])

  useEffect(() => {
    const setOnlineStatus = (online, notify = true) => {
      const changed = networkStatusRef.current !== online
      networkStatusRef.current = online
      setIsOnline(online)

      if (!changed) {
        return
      }

      if (!notify) {
        return
      }

      const id = Date.now() + Math.random()
      setMessages((prev) => [
        ...prev,
        {
          id,
          text: online
            ? 'Back online. Network features are available again.'
            : 'You are offline. Some features like URL extraction will not work.',
          type: online ? 'success' : 'info',
        },
      ])
      window.setTimeout(() => {
        setMessages((prev) => prev.filter((message) => message.id !== id))
      }, 3000)
    }

    const onOnline = () => setOnlineStatus(true, true)
    const onOffline = () => setOnlineStatus(false, true)

    const verifyReachability = async () => {
      if (!navigator.onLine) {
        setOnlineStatus(false, false)
        return
      }

      const controller = new AbortController()
      const timeoutId = window.setTimeout(() => controller.abort(), 4500)

      try {
        const response = await fetch(`${API_BASE}/health`, {
          method: 'GET',
          cache: 'no-store',
          signal: controller.signal,
        })
        setOnlineStatus(response.ok, false)
      } catch {
        setOnlineStatus(false, false)
      } finally {
        window.clearTimeout(timeoutId)
      }
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void verifyReachability()
      }
    }

    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    window.addEventListener('focus', onVisibilityChange)
    document.addEventListener('visibilitychange', onVisibilityChange)

    networkStatusRef.current = navigator.onLine
    setIsOnline(navigator.onLine)
    void verifyReachability()

    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
      window.removeEventListener('focus', onVisibilityChange)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [])

  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      return undefined
    }

    const onControllerChange = () => {
      window.location.reload()
    }

    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange)

    const checkForUpdates = () => {
      const registration = swRegistrationRef.current
      if (!registration) {
        return
      }
      registration.update().catch(() => undefined)
    }

    const onVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        checkForUpdates()
      }
    }

    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .then((registration) => {
        swRegistrationRef.current = registration

        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' })
          return
        }

        registration.addEventListener('updatefound', () => {
          const installingWorker = registration.installing
          if (!installingWorker) {
            return
          }
          installingWorker.addEventListener('statechange', () => {
            if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
              installingWorker.postMessage({ type: 'SKIP_WAITING' })
            }
          })
        })

        checkForUpdates()
      })
      .catch(() => undefined)

    const periodicUpdateCheck = window.setInterval(checkForUpdates, 60 * 1000)
    window.addEventListener('focus', onVisibilityOrFocus)
    document.addEventListener('visibilitychange', onVisibilityOrFocus)

    return () => {
      window.clearInterval(periodicUpdateCheck)
      window.removeEventListener('focus', onVisibilityOrFocus)
      document.removeEventListener('visibilitychange', onVisibilityOrFocus)
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange)
    }
  }, [])

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsModalOpen(false)
        setIsImportPreviewOpen(false)
        setIsExportPreviewOpen(false)
        setIsShoppingListOpen(false)
        setFocusedRecipe(null)
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    if (!isAvatarActionMenuOpen) {
      return undefined
    }

    const handleOutsideAvatarMenuClick = (event) => {
      if (!(event.target instanceof Node)) {
        return
      }

      if (profileAvatarMenuRef.current?.contains(event.target)) {
        return
      }

      if (profileAvatarEditBtnRef.current?.contains(event.target)) {
        return
      }

      setIsAvatarActionMenuOpen(false)
    }

    document.addEventListener('mousedown', handleOutsideAvatarMenuClick)
    document.addEventListener('touchstart', handleOutsideAvatarMenuClick)

    return () => {
      document.removeEventListener('mousedown', handleOutsideAvatarMenuClick)
      document.removeEventListener('touchstart', handleOutsideAvatarMenuClick)
    }
  }, [isAvatarActionMenuOpen])

  useEffect(() => {
    setShoppingChecklist((prev) => {
      const validKeys = new Set([
        ...combinedShoppingItems.map((item) => item.key),
        ...visibleUnresolvedItems.map((item) => item.key),
        ...shoppingManualGroups.map((group) => group.key),
      ])
      const next = {}
      Object.entries(prev).forEach(([key, checked]) => {
        if (validKeys.has(key)) {
          next[key] = checked
        }
      })
      return next
    })
  }, [combinedShoppingItems, visibleUnresolvedItems, shoppingManualGroups])

  useEffect(() => {
    const validKeys = new Set(unresolvedShoppingItems.map((item) => item.key))

    setShoppingMergeSelection((prev) => {
      const next = {}
      Object.entries(prev).forEach(([key, selected]) => {
        if (validKeys.has(key)) {
          next[key] = selected
        }
      })
      return next
    })

    setShoppingManualGroups((prev) =>
      prev
        .map((group) => ({
          ...group,
          sourceKeys: group.sourceKeys.filter((key) => validKeys.has(key)),
        }))
        .filter((group) => group.sourceKeys.length > 0),
    )
  }, [unresolvedShoppingItems])

  function showMessage(text, type = 'info') {
    const id = Date.now() + Math.random()
    setMessages((prev) => [...prev, { id, text, type }])
    window.setTimeout(() => {
      setMessages((prev) => prev.filter((message) => message.id !== id))
    }, 3000)
  }

  function canSyncToCloud() {
    return Boolean(hasSupabaseConfig && supabase && authUser?.id && isOnline)
  }

  async function syncMealPlanSlotToCloud(day, slot, recipeId) {
    if (!canSyncToCloud()) {
      return
    }

    const dayKey = DAY_TO_KEY[day]
    const slotKey = SLOT_TO_KEY[slot]
    if (!dayKey || !slotKey) {
      return
    }

    if (!recipeId) {
      const { error } = await supabase
        .from('meal_plans')
        .delete()
        .eq('owner_id', authUser.id)
        .eq('week_start', CLOUD_MEAL_PLAN_WEEK)
        .eq('day', dayKey)
        .eq('slot', slotKey)

      if (error) {
        showMessage(`Cloud sync failed: ${error.message}`, 'info')
      }
      return
    }

    const payload = {
      owner_id: authUser.id,
      week_start: CLOUD_MEAL_PLAN_WEEK,
      day: dayKey,
      slot: slotKey,
      recipe_id: recipeId,
    }

    const { error } = await supabase.from('meal_plans').upsert(payload)

    if (error) {
      showMessage(`Cloud sync failed: ${error.message}`, 'info')
    }
  }

  async function clearMealPlanInCloud() {
    if (!canSyncToCloud()) {
      return
    }

    const { error } = await supabase
      .from('meal_plans')
      .delete()
      .eq('owner_id', authUser.id)
      .eq('week_start', CLOUD_MEAL_PLAN_WEEK)

    if (error) {
      showMessage(`Cloud sync failed: ${error.message}`, 'info')
    }
  }

  function replaceRecipeIdEverywhere(oldId, newId) {
    if (String(oldId) === String(newId)) {
      return
    }

    setMealPlan((prev) => {
      const next = createEmptyMealPlan()
      MEAL_DAYS.forEach((day) => {
        MEAL_SLOTS.forEach((slot) => {
          const value = prev[day]?.[slot] || ''
          next[day][slot] = String(value) === String(oldId) ? String(newId) : value
        })
      })
      return next
    })
  }

  async function insertRecipeToCloud(localRecipe, localIdToReplace, options = {}) {
    const suppressErrorMessage = Boolean(options.suppressErrorMessage)

    if (!canSyncToCloud()) {
      return { ok: false }
    }

    const payload = toCloudRecipePayload(localRecipe, authUser.id)
    const { data, error } = await supabase.from('recipes').insert(payload).select('id').single()

    if (error) {
      if (!suppressErrorMessage) {
        showMessage(`Cloud sync failed: ${error.message}`, 'info')
      }
      return { ok: false, error }
    }

    if (data?.id) {
      setRecipes((prev) =>
        prev.map((recipe) =>
          String(recipe.id) === String(localIdToReplace)
            ? { ...recipe, id: data.id, ownerId: authUser.id, sharedReadOnly: false }
            : recipe,
        ),
      )
      replaceRecipeIdEverywhere(localIdToReplace, data.id)
      return { ok: true, id: data.id }
    }

    return { ok: false }
  }

  async function uploadLocalRecipesToCloud() {
    if (!hasSupabaseConfig || !supabase) {
      showMessage('Cloud sync is not configured yet.', 'info')
      return
    }

    if (!authUser?.id) {
      showMessage('Please sign in or create an account first to upload recipes to the cloud.', 'info')
      return
    }

    if (!isOnline) {
      showMessage('You are offline. Reconnect, then upload recipes to the cloud.', 'info')
      return
    }

    if (!canSyncToCloud()) {
      showMessage('Cloud sync is unavailable right now. Please try again.', 'info')
      return
    }

    const localCandidates = recipes.filter((recipe) => !isUuidLike(recipe.id))
    if (localCandidates.length === 0) {
      showMessage('All local recipes are already in cloud sync.', 'info')
      return
    }

    setIsBulkUploading(true)

    try {
      const { data: cloudRows, error } = await supabase
        .from('recipes')
        .select('id,name,url,ingredients,directions')
        .eq('owner_id', authUser.id)
        .is('deleted_at', null)

      if (error) {
        showMessage(`Could not check cloud recipes: ${error.message}`, 'info')
        return
      }

      const cloudFingerprints = new Set((cloudRows || []).map(buildRecipeFingerprint))
      let uploaded = 0
      let skipped = 0
      let failed = 0

      for (const recipe of localCandidates) {
        const fingerprint = buildRecipeFingerprint(recipe)
        if (cloudFingerprints.has(fingerprint)) {
          skipped += 1
          continue
        }

        const result = await insertRecipeToCloud(recipe, recipe.id, { suppressErrorMessage: true })
        if (result.ok) {
          uploaded += 1
          cloudFingerprints.add(fingerprint)
        } else {
          failed += 1
        }
      }

      const parts = []
      parts.push(`Uploaded ${uploaded}`)
      if (skipped > 0) {
        parts.push(`skipped ${skipped} duplicates`)
      }
      if (failed > 0) {
        parts.push(`failed ${failed}`)
      }

      showMessage(parts.join(' • '), failed > 0 ? 'info' : 'success')
    } finally {
      setIsBulkUploading(false)
    }
  }

  async function updateRecipeInCloud(id, recipeData) {
    if (!canSyncToCloud() || !isUuidLike(id)) {
      return
    }

    const payload = toCloudRecipePayload(recipeData, authUser.id)
    const { error } = await supabase.from('recipes').update(payload).eq('id', id).eq('owner_id', authUser.id)

    if (error) {
      showMessage(`Cloud sync failed: ${error.message}`, 'info')
    }
  }

  async function softDeleteRecipeInCloud(id) {
    if (!canSyncToCloud() || !isUuidLike(id)) {
      return
    }

    const { error } = await supabase
      .from('recipes')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('owner_id', authUser.id)

    if (error) {
      showMessage(`Cloud sync failed: ${error.message}`, 'info')
    }
  }

  function canManageRecipe(recipe) {
    if (!recipe) {
      return false
    }

    if (!recipe.ownerId) {
      return true
    }

    if (authUser?.id && recipe.ownerId === authUser.id) {
      return true
    }

    return !recipe.sharedReadOnly
  }

  function canShareRecipe(recipe) {
    return Boolean(authUser?.id && recipe?.ownerId && recipe.ownerId === authUser.id)
  }

  async function loadShareRecipients(recipeId) {
    if (!hasSupabaseConfig || !supabase || !authUser?.id || !isUuidLike(recipeId)) {
      setShareRecipients([])
      return
    }

    setShareRecipientsLoading(true)

    try {
      const { data: shareRows, error } = await supabase
        .from('recipe_shares')
        .select('shared_with_user_id,can_edit')
        .eq('recipe_id', recipeId)

      if (error) {
        showMessage(`Could not load recipe shares: ${error.message}`, 'info')
        setShareRecipients([])
        return
      }

      const rows = Array.isArray(shareRows) ? shareRows : []
      const ids = [...new Set(rows.map((row) => row.shared_with_user_id).filter((id) => isUuidLike(id)))]

      let profileMap = new Map()
      if (ids.length > 0) {
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('id,username,display_name')
          .in('id', ids)

        if (!profileError && Array.isArray(profiles)) {
          profileMap = new Map(
            profiles.map((profile) => [
              profile.id,
              {
                username: profile.username || '',
                displayName: profile.display_name || '',
              },
            ]),
          )
        }
      }

      const normalized = rows
        .map((row) => {
          const profile = profileMap.get(row.shared_with_user_id)
          return {
            userId: row.shared_with_user_id,
            canEdit: Boolean(row.can_edit),
            username: profile?.username || '',
            displayName: profile?.displayName || '',
          }
        })
        .sort((a, b) => {
          const left = (a.username || a.displayName || a.userId).toLowerCase()
          const right = (b.username || b.displayName || b.userId).toLowerCase()
          return left.localeCompare(right)
        })

      setShareRecipients(normalized)
    } finally {
      setShareRecipientsLoading(false)
    }
  }

  function openShareModal(recipe) {
    setShareTargetRecipe(recipe)
    setShareLookupText('')
    setShareResults([])
    setShareCanEdit(false)
    setShareRecipients([])
    setIsShareModalOpen(true)

    void loadShareRecipients(recipe.id)
  }

  function closeShareModal() {
    setIsShareModalOpen(false)
    setShareTargetRecipe(null)
    setShareLookupText('')
    setShareResults([])
    setShareCanEdit(false)
    setShareRecipients([])
    setShareBusy(false)
  }

  async function searchShareCandidates(event) {
    event.preventDefault()

    if (!hasSupabaseConfig || !supabase || !authUser?.id) {
      showMessage('Sign in to share recipes.', 'info')
      return
    }

    if (!isUuidLike(shareTargetRecipe?.id)) {
      showMessage('Save this recipe to cloud first, then share it.', 'info')
      return
    }

    const query = shareLookupText.trim().toLowerCase()
    if (!query) {
      showMessage('Enter a username to search.', 'error')
      return
    }

    setShareBusy(true)

    try {
      const { data, error: lookupError } = await supabase.rpc('search_profiles_for_sharing', {
        query_text: query,
        limit_count: 8,
      })

      if (lookupError) {
        if (lookupError.message.toLowerCase().includes('search_profiles_for_sharing')) {
          showMessage('Username search is not configured yet. Add the search_profiles_for_sharing RPC in Supabase.', 'info')
          return
        }

        showMessage(`Could not look up recipient: ${lookupError.message}`, 'error')
        return
      }

      const normalized = Array.isArray(data)
        ? data
            .filter((row) => isUuidLike(row?.id))
            .map((row) => ({
              id: row.id,
              username: (row.username || '').trim(),
              displayName: (row.display_name || '').trim(),
            }))
        : []

      setShareResults(normalized)

      if (normalized.length === 0) {
        showMessage('No users found with that username.', 'info')
      }
    } finally {
      setShareBusy(false)
    }
  }

  async function shareRecipeWithUser(recipient) {
    if (!hasSupabaseConfig || !supabase || !authUser?.id) {
      showMessage('Sign in to share recipes.', 'info')
      return
    }

    if (!isUuidLike(shareTargetRecipe?.id)) {
      showMessage('Save this recipe to cloud first, then share it.', 'info')
      return
    }

    if (!recipient?.id || !isUuidLike(recipient.id)) {
      showMessage('Select a valid recipient account.', 'error')
      return
    }

    setShareBusy(true)

    try {
      const { error } = await supabase.from('recipe_shares').upsert({
        recipe_id: shareTargetRecipe.id,
        shared_with_user_id: recipient.id,
        can_edit: shareCanEdit,
      })

      if (error) {
        showMessage(`Could not share recipe: ${error.message}`, 'error')
        return
      }

      const targetLabel = recipient.username ? `@${recipient.username}` : recipient.displayName || 'recipient'
      showMessage(`Recipe shared with ${targetLabel}.`, 'success')
      setShareLookupText('')
      setShareResults([])
      await loadShareRecipients(shareTargetRecipe.id)
    } finally {
      setShareBusy(false)
    }
  }

  async function updateSharePermission(recipient, canEdit) {
    if (!hasSupabaseConfig || !supabase || !authUser?.id || !shareTargetRecipe?.id) {
      return
    }

    setShareBusy(true)

    try {
      const { error } = await supabase
        .from('recipe_shares')
        .update({ can_edit: canEdit })
        .eq('recipe_id', shareTargetRecipe.id)
        .eq('shared_with_user_id', recipient.userId)

      if (error) {
        showMessage(`Could not update permissions: ${error.message}`, 'error')
        return
      }

      setShareRecipients((prev) =>
        prev.map((item) => (item.userId === recipient.userId ? { ...item, canEdit } : item)),
      )
      showMessage('Share permissions updated.', 'success')
    } finally {
      setShareBusy(false)
    }
  }

  async function revokeShare(recipient) {
    if (!hasSupabaseConfig || !supabase || !authUser?.id || !shareTargetRecipe?.id) {
      return
    }

    const confirmRemoval = window.confirm('Remove this user from recipe sharing?')
    if (!confirmRemoval) {
      return
    }

    setShareBusy(true)

    try {
      const { error } = await supabase
        .from('recipe_shares')
        .delete()
        .eq('recipe_id', shareTargetRecipe.id)
        .eq('shared_with_user_id', recipient.userId)

      if (error) {
        showMessage(`Could not revoke share: ${error.message}`, 'error')
        return
      }

      setShareRecipients((prev) => prev.filter((item) => item.userId !== recipient.userId))
      showMessage('Share removed.', 'info')
    } finally {
      setShareBusy(false)
    }
  }

  function requireOnline(featureLabel, detail = 'requires an internet connection.') {
    if (networkStatusRef.current) {
      return true
    }

    showMessage(`You are offline. ${featureLabel} ${detail}`, 'info')
    return false
  }

  function closeImportPreview() {
    setIsImportPreviewOpen(false)
    setImportCandidates([])
    setImportSummary(null)
  }

  function closeExportPreview() {
    setIsExportPreviewOpen(false)
    setExportCandidates([])
  }

  function toggleTheme() {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  async function handleAuthSubmit(event) {
    event.preventDefault()

    if (!hasSupabaseConfig || !supabase) {
      showMessage('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.', 'info')
      return
    }

    const email = authEmail.trim()
    if (!email || !authPassword) {
      showMessage('Please enter both email and password.', 'error')
      return
    }

    const normalizedUsername = authUsername.trim().toLowerCase()
    const normalizedDisplayName = authDisplayName.trim()

    setAuthBusy(true)

    try {
      if (authMode === 'signup') {
        if (!normalizedUsername) {
          showMessage('Please choose a username.', 'error')
          return
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password: authPassword,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              name: normalizedDisplayName,
              username: normalizedUsername,
            },
          },
        })

        if (error) {
          showMessage(error.message, 'error')
          return
        }

        if (data.session) {
          showMessage('Account created and signed in.', 'success')
        } else {
          showMessage('Account created. Check your email to confirm your account.', 'info')
        }
        return
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: authPassword,
      })

      if (error) {
        showMessage(error.message, 'error')
        return
      }

      showMessage('Signed in successfully.', 'success')
    } finally {
      setAuthBusy(false)
    }
  }

  async function handleSignOut() {
    if (!supabase) {
      return
    }

    const { error } = await supabase.auth.signOut()
    if (error) {
      showMessage(error.message, 'error')
      return
    }

    showMessage('Signed out.', 'info')
    setIsProfileModalOpen(false)
  }

  function openProfileModal() {
    setIsProfileModalOpen(true)
  }

  function closeProfileModal() {
    setIsProfileModalOpen(false)
    setIsAvatarActionMenuOpen(false)
    setProfileBusy(false)
    setProfileUploading(false)
  }

  async function handleProfileSave(event) {
    event.preventDefault()

    if (!hasSupabaseConfig || !supabase || !authUser?.id) {
      showMessage('Sign in to update your profile.', 'info')
      return
    }

    const username = profileUsername.trim().toLowerCase()
    if (!username) {
      showMessage('Please enter a username.', 'error')
      return
    }

    setProfileBusy(true)

    try {
      const { error } = await supabase.from('profiles').upsert({
        id: authUser.id,
        display_name: profileDisplayName.trim() || null,
        username,
        avatar_url: profileAvatarValue.trim() || null,
      })

      if (error) {
        showMessage(`Could not update profile: ${error.message}`, 'error')
        return
      }

      showMessage('Profile updated.', 'success')
    } finally {
      setProfileBusy(false)
    }
  }

  async function handleAvatarUpload(event) {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    if (!hasSupabaseConfig || !supabase || !authUser?.id) {
      showMessage('Sign in to upload a profile picture.', 'info')
      event.target.value = ''
      return
    }

    setProfileUploading(true)

    try {
      const extension = file.name.split('.').pop()?.toLowerCase() || 'png'
      const safeExt = extension.replace(/[^a-z0-9]/g, '') || 'png'
      const path = `${authUser.id}/avatar.${safeExt}`

      const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })

      if (uploadError) {
        if (uploadError.message.toLowerCase().includes('bucket')) {
          showMessage('Avatar uploads need a Supabase Storage bucket named "avatars".', 'info')
        } else {
          showMessage(`Could not upload image: ${uploadError.message}`, 'error')
        }
        return
      }

      const { data: signedData } = await supabase.storage
        .from('avatars')
        .createSignedUrl(path, AVATAR_SIGNED_URL_TTL_SECONDS)

      if (signedData?.signedUrl) {
        setProfileAvatarUrl(signedData.signedUrl)
      } else {
        const { data } = supabase.storage.from('avatars').getPublicUrl(path)
        if (!data?.publicUrl) {
          showMessage('Upload succeeded but could not get image URL.', 'info')
          return
        }
        setProfileAvatarUrl(data.publicUrl)
      }

      setProfileAvatarValue(path)
      showMessage('Profile picture uploaded. Save profile to apply.', 'success')
    } finally {
      setProfileUploading(false)
      event.target.value = ''
    }
  }

  async function removeProfileAvatar() {
    if (!hasSupabaseConfig || !supabase || !authUser?.id) {
      setProfileAvatarValue('')
      setProfileAvatarUrl('')
      showMessage('Profile picture removed locally.', 'info')
      return
    }

    const previousAvatarValue = profileAvatarValue.trim()
    const storagePath = extractAvatarStoragePath(previousAvatarValue)

    setProfileUploading(true)
    try {
      if (storagePath) {
        const { error: removeStorageError } = await supabase.storage.from('avatars').remove([storagePath])
        if (removeStorageError) {
          showMessage(`Could not remove avatar file: ${removeStorageError.message}`, 'error')
          return
        }
      }

      const { error: updateError } = await supabase.from('profiles').update({ avatar_url: null }).eq('id', authUser.id)
      if (updateError) {
        showMessage(`Could not remove profile picture: ${updateError.message}`, 'error')
        return
      }

      setProfileAvatarValue('')
      setProfileAvatarUrl('')
      showMessage('Profile picture removed.', 'success')
    } finally {
      setProfileUploading(false)
    }
  }

  function openAvatarFilePicker() {
    profileAvatarInputRef.current?.click()
  }

  function handleAvatarEditClick() {
    setIsAvatarActionMenuOpen((prev) => !prev)
  }

  function handleSelectAvatarPhoto() {
    setIsAvatarActionMenuOpen(false)
    openAvatarFilePicker()
  }

  async function handleRemoveAvatarPhoto() {
    setIsAvatarActionMenuOpen(false)
    await removeProfileAvatar()
  }

  function openModal(recipe = null) {
    setExtractWarnings([])
    setExtractCandidate(null)

    if (!recipe) {
      setCurrentEditingId(null)
      setCurrentRecipeType('url')
      setForm(emptyForm)
      setIsModalOpen(true)
      return
    }

    const recipeType = recipe.type || (recipe.url ? 'url' : 'custom')
    setCurrentEditingId(recipe.id)
    setCurrentRecipeType(recipeType)
    setForm({
      name: recipe.name || '',
      url: recipe.url || '',
      image: recipe.image || '',
      ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients.join('\n') : '',
      directions: Array.isArray(recipe.directions) ? recipe.directions.join('\n') : '',
      notes: recipe.notes || '',
      categories: recipe.categories || (recipe.category ? [recipe.category] : []),
      visibility: recipe.visibility || 'private',
    })
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
    setCurrentEditingId(null)
    setIsExtracting(false)
    setExtractWarnings([])
    setExtractCandidate(null)
  }

  function openFocusedRecipe(recipe) {
    setFocusedRecipe(recipe)
  }

  function closeFocusedRecipe() {
    setFocusedRecipe(null)
  }

  function toggleCategory(category) {
    setForm((prev) => {
      const exists = prev.categories.includes(category)
      if (exists) {
        return { ...prev, categories: prev.categories.filter((item) => item !== category) }
      }
      return { ...prev, categories: [...prev.categories, category] }
    })
  }

  function makeRecipeId(existingIds) {
    let id = Date.now()
    while (existingIds.has(id)) {
      id += 1
    }
    return id
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!form.name.trim()) {
      showMessage('Please enter a recipe name', 'error')
      return
    }

    if (form.categories.length === 0) {
      showMessage('Please select at least one category', 'error')
      return
    }

    let recipeData
    if (currentRecipeType === 'url') {
      if (!form.url.trim()) {
        showMessage('Please enter a recipe URL', 'error')
        return
      }

      const extractedIngredients = form.ingredients
        .split('\n')
        .map((value) => value.trim())
        .filter(Boolean)
      const extractedDirections = form.directions
        .split('\n')
        .map((value) => value.trim())
        .filter(Boolean)

      recipeData = {
        name: form.name.trim(),
        url: form.url.trim(),
        image: form.image.trim(),
        ingredients: extractedIngredients,
        directions: extractedDirections,
        categories: form.categories,
        notes: form.notes.trim(),
        type: 'url',
        visibility: form.visibility || 'private',
      }
    } else {
      const ingredients = form.ingredients
        .split('\n')
        .map((value) => value.trim())
        .filter(Boolean)
      const directions = form.directions
        .split('\n')
        .map((value) => value.trim())
        .filter(Boolean)

      if (ingredients.length === 0) {
        showMessage('Please enter ingredients', 'error')
        return
      }

      if (directions.length === 0) {
        showMessage('Please enter directions', 'error')
        return
      }

      recipeData = {
        name: form.name.trim(),
        ingredients,
        directions,
        image: form.image.trim(),
        categories: form.categories,
        notes: form.notes.trim(),
        type: 'custom',
        visibility: form.visibility || 'private',
      }
    }

    if (currentEditingId) {
      const updatedRecipe = { ...recipeData, pinned: Boolean(recipes.find((recipe) => recipe.id === currentEditingId)?.pinned), id: currentEditingId }
      setRecipes((prev) =>
        prev.map((recipe) =>
          recipe.id === currentEditingId
            ? { ...recipe, ...recipeData, pinned: Boolean(recipe.pinned), id: currentEditingId }
            : recipe,
        ),
      )

      if (canSyncToCloud()) {
        if (isUuidLike(currentEditingId)) {
          await updateRecipeInCloud(currentEditingId, updatedRecipe)
        } else {
          await insertRecipeToCloud(updatedRecipe, currentEditingId)
        }
      }

      showMessage('Recipe updated successfully!', 'success')
    } else {
      const existingIds = new Set(recipes.map((recipe) => recipe.id))
      const localId = makeRecipeId(existingIds)
      const newRecipe = { ...recipeData, pinned: false, id: localId }
      setRecipes((prev) => [newRecipe, ...prev])

      if (canSyncToCloud()) {
        await insertRecipeToCloud(newRecipe, localId)
      }

      showMessage('Recipe added successfully!', 'success')
    }

    closeModal()
  }

  async function handleDeleteRecipe(id) {
    const shouldDelete = window.confirm('Are you sure you want to delete this recipe?')
    if (!shouldDelete) {
      return
    }

    setRecipes((prev) => prev.filter((recipe) => recipe.id !== id))
    setMealPlan((prev) => {
      const next = createEmptyMealPlan()
      MEAL_DAYS.forEach((day) => {
        MEAL_SLOTS.forEach((slot) => {
          const value = prev[day]?.[slot] || ''
          next[day][slot] = String(value) === String(id) ? '' : value
        })
      })
      return next
    })

    await softDeleteRecipeInCloud(id)
  }

  async function togglePinnedRecipe(id) {
    let pinnedRecipe = null

    setRecipes((prev) =>
      prev.map((recipe) => {
        if (recipe.id !== id) {
          return recipe
        }

        pinnedRecipe = { ...recipe, pinned: !recipe.pinned }
        return pinnedRecipe
      }),
    )

    if (!pinnedRecipe || !canSyncToCloud()) {
      return
    }

    if (isUuidLike(pinnedRecipe.id)) {
      await updateRecipeInCloud(pinnedRecipe.id, pinnedRecipe)
    } else {
      await insertRecipeToCloud(pinnedRecipe, pinnedRecipe.id)
    }
  }

  async function updateMealPlan(day, slot, recipeId) {
    setMealPlan((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [slot]: recipeId,
      },
    }))

    await syncMealPlanSlotToCloud(day, slot, recipeId)
  }

  async function clearMealPlan() {
    const shouldClear = window.confirm('Clear all planned meals for the week?')
    if (!shouldClear) {
      return
    }
    setMealPlan(createEmptyMealPlan())
    await clearMealPlanInCloud()
    showMessage('Meal planner cleared.', 'info')
  }

  function visitRecipe(url) {
    if (!requireOnline('Opening recipe websites')) {
      return
    }

    window.open(url, '_blank', 'noopener,noreferrer')
  }

  async function copyRecipeUrl(url) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url)
      } else {
        const tempInput = document.createElement('textarea')
        tempInput.value = url
        tempInput.setAttribute('readonly', '')
        tempInput.style.position = 'absolute'
        tempInput.style.left = '-9999px'
        document.body.appendChild(tempInput)
        tempInput.select()
        const successful = document.execCommand('copy')
        document.body.removeChild(tempInput)
        if (!successful) {
          throw new Error('Copy command failed')
        }
      }
      showMessage('Recipe URL copied to clipboard!', 'success')
    } catch {
      showMessage('Could not copy URL. Please copy it manually.', 'error')
    }
  }

  async function handleExtractFromUrl() {
    const inputUrl = form.url.trim()
    if (!inputUrl) {
      showMessage('Enter a recipe URL first.', 'error')
      return
    }

    if (!requireOnline('URL extraction')) {
      return
    }

    try {
      setIsExtracting(true)
      setExtractWarnings([])
      setExtractCandidate(null)

      const response = await fetch(EXTRACT_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: inputUrl }),
      })

      const payload = await response.json().catch(() => null)
      if (!response.ok || !payload?.ok) {
        const message = payload?.error?.message || 'Could not extract recipe details from this URL'
        throw new Error(message)
      }

      const extracted = payload.data
      const warnings = payload.meta?.warnings || []

      setExtractWarnings(warnings)
      setExtractCandidate({
        data: extracted,
        meta: payload.meta || null,
        warnings,
      })
      showMessage('Recipe details extracted. Review and apply.', 'success')
    } catch (error) {
      const failedMessage = error?.message || 'Extraction failed'
      const isNetworkFailure =
        error?.name === 'AbortError' ||
        failedMessage === 'Failed to fetch' ||
        failedMessage.toLowerCase().includes('network')

      if (isNetworkFailure) {
        networkStatusRef.current = false
        setIsOnline(false)
        showMessage('You are offline (or the API is unreachable). URL extraction is unavailable right now.', 'info')
      } else {
        showMessage(failedMessage, 'error')
      }
      setExtractWarnings([])
      setExtractCandidate(null)
    } finally {
      setIsExtracting(false)
    }
  }

  function applyExtractCandidate() {
    if (!extractCandidate?.data) {
      return
    }

    const extracted = extractCandidate.data
    setForm((prev) => ({
      ...prev,
      name: extracted.name || prev.name,
      url: extracted.url || prev.url,
      image: extracted.image || prev.image,
      ingredients: (extracted.ingredients || []).join('\n'),
      directions: (extracted.directions || []).join('\n'),
      notes: extracted.notes || prev.notes,
      categories:
        Array.isArray(extracted.categories) && extracted.categories.length > 0
          ? extracted.categories
          : prev.categories,
    }))

    setExtractCandidate(null)
    setExtractWarnings([])
    showMessage('Extracted fields applied to the form.', 'success')
  }

  function discardExtractCandidate() {
    setExtractCandidate(null)
    setExtractWarnings([])
    showMessage('Extracted preview discarded.', 'info')
  }

  function randomizeRecipe() {
    if (recipes.length === 0) {
      window.alert('No recipes to randomize! Add some recipes first.')
      return
    }

    if (filteredRecipes.length === 0) {
      window.alert('No recipes match your current filters. Try adjusting search/category.')
      return
    }

    const randomIndex = Math.floor(Math.random() * filteredRecipes.length)
    const selectedRecipe = filteredRecipes[randomIndex]
    setHighlightedId(selectedRecipe.id)

    const target = document.querySelector(`[data-recipe-id="${selectedRecipe.id}"]`)
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }

    window.setTimeout(() => {
      openFocusedRecipe(selectedRecipe)
      setHighlightedId(null)
    }, 600)
  }

  function exportRecipes() {
    if (recipes.length === 0) {
      window.alert('No recipes to export! Add some recipes first.')
      return
    }

    setExportCandidates(
      recipes.map((recipe, index) => ({
        previewId: `export-${Date.now()}-${index}-${Math.random().toString(16).slice(2)}`,
        recipe,
        selected: true,
      })),
    )
    setIsExportPreviewOpen(true)
  }

  function toggleExportCandidate(previewId) {
    setExportCandidates((prev) =>
      prev.map((candidate) =>
        candidate.previewId === previewId ? { ...candidate, selected: !candidate.selected } : candidate,
      ),
    )
  }

  function setAllExportCandidates(selected) {
    setExportCandidates((prev) => prev.map((candidate) => ({ ...candidate, selected })))
  }

  function confirmExportSelection() {
    const selectedRecipes = exportCandidates
      .filter((candidate) => candidate.selected)
      .map((candidate) => candidate.recipe)

    if (selectedRecipes.length === 0) {
      showMessage('Select at least one recipe to export.', 'error')
      return
    }

    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      recipes: selectedRecipes,
    }

    const jsonString = JSON.stringify(exportData, null, 2)
    const filename = `recipe-bookmarks-${new Date().toISOString().split('T')[0]}.json`
    const blob = new Blob([jsonString], { type: 'application/json' })
    const downloadUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(downloadUrl)
    closeExportPreview()
    showMessage(
      `Exported ${selectedRecipes.length} recipe${selectedRecipes.length !== 1 ? 's' : ''} successfully!`,
      'success',
    )
  }

  function printRecipesAsPdf(recipesToPrint) {
    if (!Array.isArray(recipesToPrint) || recipesToPrint.length === 0) {
      showMessage('Select at least one recipe to print.', 'error')
      return false
    }

    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      showMessage('Popup blocked. Please allow popups to print and save as PDF.', 'error')
      return false
    }

    const printableDocument = buildPrintableRecipesDocument(recipesToPrint)
    printWindow.document.open()
    printWindow.document.write(printableDocument)
    printWindow.document.close()

    const triggerPrint = () => {
      printWindow.focus()
      printWindow.print()
    }

    window.setTimeout(triggerPrint, 220)
    return true
  }

  function confirmPrintSelection() {
    const selectedRecipes = exportCandidates
      .filter((candidate) => candidate.selected)
      .map((candidate) => candidate.recipe)

    if (selectedRecipes.length === 0) {
      showMessage('Select at least one recipe to print.', 'error')
      return
    }

    const didOpen = printRecipesAsPdf(selectedRecipes)
    if (didOpen) {
      closeExportPreview()
      showMessage(
        `Opened print view for ${selectedRecipes.length} recipe${selectedRecipes.length !== 1 ? 's' : ''}. Choose "Save as PDF" in the print dialog.`,
        'success',
      )
    }
  }

  function openShoppingListBuilder() {
    const candidates = recipes
      .filter((recipe) => Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0)
      .map((recipe) => ({
        previewId: `shop-${recipe.id}`,
        recipe,
        selected: true,
      }))

    if (candidates.length === 0) {
      showMessage('Add recipes with ingredients to build a shopping list.', 'info')
      return
    }

    setShoppingCandidates(candidates)
    setShoppingChecklist({})
    setShoppingMergeSelection({})
    setShoppingManualGroups([])
    setShoppingManualText('')
    setIsShoppingListOpen(true)
  }

  function closeShoppingListBuilder() {
    setIsShoppingListOpen(false)
    setShoppingCandidates([])
    setShoppingChecklist({})
    setShoppingMergeSelection({})
    setShoppingManualGroups([])
    setShoppingManualText('')
    setShoppingManualEditingKey('')
    setShoppingManualEditDraft('')
  }

  function toggleShoppingCandidate(previewId) {
    setShoppingCandidates((prev) =>
      prev.map((candidate) =>
        candidate.previewId === previewId ? { ...candidate, selected: !candidate.selected } : candidate,
      ),
    )
  }

  function setAllShoppingCandidates(selected) {
    setShoppingCandidates((prev) => prev.map((candidate) => ({ ...candidate, selected })))
  }

  function toggleShoppingItemChecked(itemKey) {
    setShoppingChecklist((prev) => ({
      ...prev,
      [itemKey]: !prev[itemKey],
    }))
  }

  function clearShoppingChecklist() {
    setShoppingChecklist({})
  }

  function toggleShoppingMergeSelection(itemKey) {
    if (hiddenUnresolvedKeys.has(itemKey)) {
      return
    }
    setShoppingMergeSelection((prev) => ({
      ...prev,
      [itemKey]: !prev[itemKey],
    }))
  }

  function createManualMergeGroup() {
    const selectedKeys = visibleUnresolvedItems
      .map((item) => item.key)
      .filter((key) => Boolean(shoppingMergeSelection[key]))

    if (selectedKeys.length < 2) {
      showMessage('Select at least two Needs Review items to merge.', 'error')
      return
    }

    const defaultLabel = selectedKeys
      .map((key) => unresolvedByKey[key]?.text)
      .filter(Boolean)
      .join(' + ')

    const normalizedCustom = shoppingManualText.trim()
    const label = normalizedCustom || defaultLabel

    if (!label) {
      showMessage('Please provide a label for the merged item.', 'error')
      return
    }

    const group = {
      key: `manual:${Date.now()}:${Math.random().toString(16).slice(2)}`,
      text: label,
      sourceKeys: selectedKeys,
      count: selectedKeys.reduce((sum, key) => sum + (unresolvedByKey[key]?.count || 1), 0),
    }

    setShoppingManualGroups((prev) => [...prev, group])
    setShoppingMergeSelection((prev) => {
      const next = { ...prev }
      selectedKeys.forEach((key) => {
        delete next[key]
      })
      return next
    })
    setShoppingManualText('')
    showMessage('Merged selected items into a manual shopping entry.', 'success')
  }

  function splitManualMergeGroup(groupKey) {
    setShoppingManualGroups((prev) => prev.filter((group) => group.key !== groupKey))
    setShoppingChecklist((prev) => {
      const next = { ...prev }
      delete next[groupKey]
      return next
    })
    if (shoppingManualEditingKey === groupKey) {
      setShoppingManualEditingKey('')
      setShoppingManualEditDraft('')
    }
    showMessage('Manual merged item was split back into original entries.', 'info')
  }

  function startEditingManualMergeGroup(group) {
    setShoppingManualEditingKey(group.key)
    setShoppingManualEditDraft(group.text)
  }

  function cancelEditingManualMergeGroup() {
    setShoppingManualEditingKey('')
    setShoppingManualEditDraft('')
  }

  function saveEditingManualMergeGroup(groupKey) {
    setShoppingManualGroups((prev) =>
      prev.map((group) => {
        if (group.key !== groupKey) {
          return group
        }

        const normalized = shoppingManualEditDraft.trim()
        if (normalized) {
          return { ...group, text: normalized }
        }

        const fallback =
          group.sourceKeys
            .map((key) => unresolvedByKey[key]?.text)
            .filter(Boolean)
            .join(' + ') || 'Merged item'

        return { ...group, text: fallback }
      }),
    )

    setShoppingManualEditingKey('')
    setShoppingManualEditDraft('')
  }

  function exportShoppingListText() {
    const selectedRecipes = shoppingCandidates.filter((candidate) => candidate.selected)
    if (selectedRecipes.length === 0) {
      showMessage('Select at least one recipe before exporting a shopping list.', 'error')
      return
    }

    const lines = []
    lines.push('Dish Depot Shopping List')
    lines.push(`Generated: ${new Date().toLocaleString()}`)
    lines.push('')
    lines.push('Selected Recipes:')
    selectedRecipes.forEach((candidate) => lines.push(`- ${candidate.recipe.name}`))
    lines.push('')
    lines.push('Combined Totals:')

    combinedShoppingItems.forEach((item) => {
      const mark = shoppingChecklist[item.key] ? '[x]' : '[ ]'
      lines.push(`${mark} ${item.amountLabel}`)
    })

    if (visibleUnresolvedItems.length > 0) {
      lines.push('')
      lines.push('Needs Review (not safely totaled):')
      visibleUnresolvedItems.forEach((item) => {
        const mark = shoppingChecklist[item.key] ? '[x]' : '[ ]'
        lines.push(`${mark} ${item.text}${item.count > 1 ? ` (${item.count} recipes)` : ''}`)
      })
    }

    if (shoppingManualGroups.length > 0) {
      lines.push('')
      lines.push('Manual Merge Items:')
      shoppingManualGroups.forEach((group) => {
        const mark = shoppingChecklist[group.key] ? '[x]' : '[ ]'
        lines.push(`${mark} ${group.text}${group.count > 1 ? ` (${group.count} lines)` : ''}`)
      })
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const downloadUrl = URL.createObjectURL(blob)
    const fileName = `shopping-list-${new Date().toISOString().split('T')[0]}.txt`
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(downloadUrl)

    showMessage('Shopping list exported.', 'success')
  }

  function filterImportedRecipes(newRecipes) {
    const existingIds = new Set(recipes.map((recipe) => recipe.id))

    return newRecipes
      .filter((recipe) => !recipe.url || !recipes.find((current) => current.url === recipe.url))
      .map((recipe) => {
        const normalized = {
          ...recipe,
          categories: recipe.categories || (recipe.category ? [recipe.category] : []),
          pinned: Boolean(recipe.pinned),
        }
        if (normalized.id == null || existingIds.has(normalized.id)) {
          normalized.id = makeRecipeId(existingIds)
        }
        existingIds.add(normalized.id)
        return normalized
      })
  }

  function toggleImportCandidate(previewId) {
    setImportCandidates((prev) =>
      prev.map((candidate) =>
        candidate.previewId === previewId ? { ...candidate, selected: !candidate.selected } : candidate,
      ),
    )
  }

  function removeImportCandidate(previewId) {
    setImportCandidates((prev) => prev.filter((candidate) => candidate.previewId !== previewId))
  }

  function setAllImportCandidates(selected) {
    setImportCandidates((prev) => prev.map((candidate) => ({ ...candidate, selected })))
  }

  async function confirmImportSelection() {
    const selectedRecipes = importCandidates
      .filter((candidate) => candidate.selected)
      .map((candidate) => candidate.recipe)

    if (selectedRecipes.length === 0) {
      showMessage('Select at least one recipe to import.', 'error')
      return
    }

    setRecipes((prev) => [...selectedRecipes, ...prev])

    if (canSyncToCloud()) {
      for (const recipe of selectedRecipes) {
        if (isUuidLike(recipe.id)) {
          await updateRecipeInCloud(recipe.id, recipe)
        } else {
          await insertRecipeToCloud(recipe, recipe.id)
        }
      }
    }

    closeImportPreview()
    showMessage(
      `Successfully imported ${selectedRecipes.length} recipe${selectedRecipes.length !== 1 ? 's' : ''}!`,
      'success',
    )
  }

  async function handleImportFile(event) {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    if (!file.name.endsWith('.json')) {
      showMessage('Please select a JSON file', 'error')
      event.target.value = ''
      return
    }

    try {
      const text = await file.text()
      const data = JSON.parse(text)
      if (!Array.isArray(data.recipes)) {
        throw new Error('Invalid recipe file format')
      }

      const validRecipes = data.recipes.filter((recipe) => {
        const hasCategories =
          (Array.isArray(recipe.categories) && recipe.categories.length > 0) || Boolean(recipe.category)

        if (!recipe.name || !hasCategories) {
          return false
        }

        if (recipe.url) {
          return true
        }

        return (
          Array.isArray(recipe.ingredients) &&
          recipe.ingredients.length > 0 &&
          Array.isArray(recipe.directions) &&
          recipe.directions.length > 0
        )
      })

      if (validRecipes.length === 0) {
        throw new Error('No valid recipes found in file')
      }

      const importedRecipes = filterImportedRecipes(validRecipes)
      if (importedRecipes.length === 0) {
        showMessage('No new recipes to import (all duplicates).', 'info')
        event.target.value = ''
        return
      }

      const invalidCount = data.recipes.length - validRecipes.length
      const duplicateCount = validRecipes.length - importedRecipes.length

      setImportSummary({
        totalInFile: data.recipes.length,
        validCount: validRecipes.length,
        duplicateCount,
        invalidCount,
      })

      setImportCandidates(
        importedRecipes.map((recipe, index) => ({
          previewId: `${Date.now()}-${index}-${Math.random().toString(16).slice(2)}`,
          recipe,
          selected: true,
        })),
      )
      setIsImportPreviewOpen(true)

      if (invalidCount > 0 || duplicateCount > 0) {
        showMessage(
          `${invalidCount > 0 ? `${invalidCount} invalid skipped. ` : ''}${duplicateCount > 0 ? `${duplicateCount} duplicates skipped.` : ''}`,
          'info',
        )
      }
    } catch (error) {
      showMessage(`Import failed: ${error.message}`, 'error')
    } finally {
      event.target.value = ''
    }
  }

  async function deleteAllRecipes() {
    if (recipes.length === 0) {
      showMessage('You have no recipes to delete.', 'info')
      return
    }

    const sure = window.confirm(
      `Are you sure you want to permanently delete all ${recipes.length} recipe${recipes.length !== 1 ? 's' : ''}?`,
    )
    if (!sure) {
      return
    }

    const exported = window.confirm(
      'Have you exported your recipes? Press OK to delete all recipes, or Cancel to abort.',
    )
    if (!exported) {
      showMessage('Deletion cancelled. Please export your recipes before deleting.', 'info')
      return
    }

    const cloudIds = recipes.filter((recipe) => isUuidLike(recipe.id)).map((recipe) => recipe.id)

    setRecipes([])
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]))

    if (canSyncToCloud() && cloudIds.length > 0) {
      const { error } = await supabase
        .from('recipes')
        .update({ deleted_at: new Date().toISOString() })
        .eq('owner_id', authUser.id)
        .in('id', cloudIds)

      if (error) {
        showMessage(`Cloud sync failed: ${error.message}`, 'info')
      }
    }

    showMessage('All recipes have been deleted.', 'success')
  }

  async function handleInstallClick() {
    if (!deferredPrompt) {
      return
    }

    deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setDeferredPrompt(null)
    setShowInstallBtn(false)
  }

  function triggerSwUpdate() {
    const reg = swRegistrationRef.current
    if (reg?.waiting) {
      reg.waiting.postMessage({ type: 'SKIP_WAITING' })
    }
    setShowSwUpdateBanner(false)
  }

  return (
    <>
      {messages.length > 0 ? (
        <div className="message-stack" aria-live="polite" aria-atomic="true">
          {messages.map((message) => (
            <div key={message.id} className={`message-pill message-pill-${message.type}`}>
              {message.text}
            </div>
          ))}
        </div>
      ) : null}

      <header className="header">
        <div className="container">
          <div className="header-content">
            <h1 className="logo">
              <img className="logo-mark" src={dishDepotLogo} alt="Dish Depot logo" />
              Dish Depot
            </h1>
            <p className="tagline">Save. Organize. Cook.</p>
          </div>
        </div>
      </header>

      <main className="main">
        <div className="container">
          <section className="controls">
            <div className="controls-nav-row">
              <div className="view-toggle-group" role="tablist" aria-label="App view">
                <button
                  className={`btn btn-small ${activeView === 'recipes' ? 'btn-primary' : 'btn-secondary'}`}
                  type="button"
                  onClick={() => setActiveView('recipes')}
                >
                  <i className="fas fa-th-large" />
                  Recipes
                </button>
                <button
                  className={`btn btn-small ${activeView === 'planner' ? 'btn-primary' : 'btn-secondary'}`}
                  type="button"
                  onClick={() => setActiveView('planner')}
                >
                  <i className="fas fa-calendar-alt" />
                  Meal Planner
                </button>
              </div>

              <div className="controls-nav-right">
                <div className="controls-theme-sync-row">
                  <label className="theme-switch" aria-label="Toggle dark mode">
                    <input type="checkbox" checked={theme === 'dark'} onChange={toggleTheme} />
                    <span className="theme-switch-track">
                      <span className="theme-switch-knob">
                        <i className={`fas ${theme === 'dark' ? 'fa-moon' : 'fa-sun'}`} />
                      </span>
                    </span>
                    <span className="theme-switch-label">{theme === 'dark' ? 'Dark' : 'Light'}</span>
                  </label>

                  <div className="controls-account-row">
                    {hasSupabaseConfig && authUser ? (
                      <span className="auth-sync-pill" aria-label="Cloud sync enabled">
                        <i className="fas fa-cloud" />
                        Sync On
                      </span>
                    ) : null}

                    {hasSupabaseConfig ? (
                      <button className="auth-user-email auth-user-link" type="button" title="Open account" onClick={openProfileModal}>
                        {authUser && profileAvatarUrl ? (
                          <img className="auth-user-avatar" src={profileAvatarUrl} alt="Profile avatar" />
                        ) : (
                          <>
                            <i className="fas fa-user" />
                            {authUser?.email || 'Account'}
                          </>
                        )}
                      </button>
                    ) : (
                      <span className="auth-config-note">Cloud sync disabled</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {activeView === 'recipes' ? (
              <>
                <div className="controls-search-row">
                  <div className="search-box search-box-prominent">
                    <input
                      type="text"
                      placeholder="Search recipes, ingredients, or notes..."
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                    />
                    <i className="fas fa-search" />
                  </div>
                </div>

                <div className="controls-filter-row">
                  <div className="controls-filter-group">
                    <div className="category-filter">
                      <select
                        className="category-select"
                        value={categoryFilter}
                        onChange={(event) => setCategoryFilter(event.target.value)}
                      >
                        <option value="">All Categories</option>
                        {CATEGORY_OPTIONS.map((category) => (
                          <option key={category} value={category}>
                            {formatCategory(category)}
                          </option>
                        ))}
                      </select>
                      <i className="fas fa-filter" />
                    </div>
                    <div className="results-count" aria-live="polite">
                      {filteredRecipes.length} recipe{filteredRecipes.length === 1 ? '' : 's'}
                    </div>

                    {hasSupabaseConfig && authUser ? (
                      <div className="recipe-scope-toggle" role="group" aria-label="Recipe scope">
                        <button
                          className={`btn btn-small ${recipeScope === 'mine' ? 'btn-primary' : 'btn-secondary'}`}
                          type="button"
                          onClick={() => setRecipeScope('mine')}
                        >
                          My Recipes
                        </button>
                        <button
                          className={`btn btn-small ${recipeScope === 'shared' ? 'btn-primary' : 'btn-secondary'}`}
                          type="button"
                          onClick={() => setRecipeScope('shared')}
                        >
                          Shared With Me
                        </button>
                      </div>
                    ) : null}
                  </div>

                  <div className="controls-main-actions">
                    <button className="btn btn-primary btn-add-inline" type="button" onClick={() => openModal()}>
                      <i className="fas fa-plus" />
                      Add Recipe
                    </button>
                    <button className="btn btn-secondary" type="button" onClick={randomizeRecipe}>
                      <i className="fas fa-dice" />
                      Random Recipe
                    </button>
                    <button
                      className={`btn ${showPinnedOnly ? 'btn-pin-active' : 'btn-pin'}`}
                      type="button"
                      onClick={() => setShowPinnedOnly((prev) => !prev)}
                    >
                      <i className={`fas ${showPinnedOnly ? 'fa-star' : 'fa-star-half-alt'}`} />
                      {showPinnedOnly ? 'Pinned Only' : 'All + Pinned'}
                    </button>
                  </div>
                </div>

                <div className="controls-utility-row">
                  <div className="controls-tools-row">
                    <details className="tools-menu">
                      <summary
                        className="btn btn-secondary btn-tools"
                        aria-label="Open tools menu"
                        aria-haspopup="menu"
                        aria-controls="tools-menu-panel"
                      >
                        <i className="fas fa-screwdriver-wrench" />
                        Tools
                      </summary>
                      <div id="tools-menu-panel" className="tools-menu-panel" role="menu" aria-label="Recipe tools">
                        <button
                          className="btn btn-secondary"
                          type="button"
                          role="menuitem"
                          onClick={() => void uploadLocalRecipesToCloud()}
                          disabled={!hasSupabaseConfig || isBulkUploading}
                        >
                          <i className="fas fa-cloud-arrow-up" />
                          {isBulkUploading ? 'Uploading...' : 'Upload Local to Cloud'}
                        </button>
                        <button className="btn btn-secondary" type="button" role="menuitem" onClick={openShoppingListBuilder}>
                          <i className="fas fa-cart-shopping" />
                          Shopping List
                        </button>
                        <button className="btn btn-secondary" type="button" role="menuitem" onClick={exportRecipes}>
                          <i className="fas fa-download" />
                          Export
                        </button>
                        <button
                          className="btn btn-secondary"
                          type="button"
                          role="menuitem"
                          onClick={() => importInputRef.current?.click()}
                        >
                          <i className="fas fa-upload" />
                          Import
                        </button>
                        <button className="btn btn-danger" type="button" role="menuitem" onClick={deleteAllRecipes}>
                          <i className="fas fa-trash-alt" />
                          Delete All Recipes
                        </button>
                        <input
                          ref={importInputRef}
                          type="file"
                          accept=".json"
                          style={{ display: 'none' }}
                          onChange={handleImportFile}
                        />
                      </div>
                    </details>
                  </div>
                </div>
              </>
            ) : null}

            {!isInstalledPwa ? (
              <details className="ios-install-help">
                <summary>
                  <i className="fas fa-mobile-screen-button" />
                  iPhone App Install Tips
                </summary>
                <p>
                  Recommended: Use Brave as your default browser to help block ads and popups.
                </p>
                <ol>
                  <li>When you want to install this app, open this website in Safari on your iPhone.</li>
                  <li>Tap the button with three dots on the bottom right.</li>
                  <li>Tap 'Share' (square with the up arrow).</li>
                  <li>Tap 'More'.</li>
                  <li>Select Add to Home Screen.</li>
                  <li>Tap Add to finish.</li>
                </ol>
              </details>
            ) : null}
          </section>

          {activeView === 'recipes' ? (
            filteredRecipes.length > 0 ? (
              <section className="recipe-grid">
                {filteredRecipes.map((recipe) => {
                  const categories = recipe.categories || (recipe.category ? [recipe.category] : [])
                  const hasIngredients = Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0
                  const hasDirections = Array.isArray(recipe.directions) && recipe.directions.length > 0
                  const hasDetailedRecipe = hasIngredients || hasDirections
                  const canManage = canManageRecipe(recipe)

                  return (
                    <article
                      key={recipe.id}
                      className={`recipe-card recipe-card-clickable ${highlightedId === recipe.id ? 'highlighted' : ''}`}
                      data-recipe-id={recipe.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => openFocusedRecipe(recipe)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          openFocusedRecipe(recipe)
                        }
                      }}
                    >
                      <div className="recipe-header">
                        <h3 className="recipe-title">{recipe.name}</h3>
                        <div className="recipe-categories">
                          {categories.map((cat, categoryIndex) => {
                            const info = CATEGORIES[cat] || CATEGORIES.other
                            return (
                              <span key={`${recipe.id}-cat-${cat}-${categoryIndex}`} className="recipe-category" style={{ backgroundColor: info.color }}>
                                <i className={`fas ${info.icon}`} />
                                {cat}
                              </span>
                            )
                          })}
                        </div>
                      </div>

                      <div className="recipe-body">
                        {recipe.image ? <img src={recipe.image} alt={recipe.name} className="recipe-image" /> : null}

                        {recipe.notes ? <p className="recipe-notes">{recipe.notes}</p> : null}

                        {hasDetailedRecipe ? (
                          <>
                            {hasIngredients ? (
                              <div className="recipe-section">
                                <h4 className="recipe-section-title">
                                  <i className="fas fa-list" />
                                  Ingredients
                                </h4>
                                <ul className="recipe-list">
                                  {(recipe.ingredients || []).map((item, ingredientIndex) => (
                                    <li key={`${recipe.id}-ingredient-${ingredientIndex}`}>{item}</li>
                                  ))}
                                </ul>
                              </div>
                            ) : null}

                            {hasDirections ? (
                              <div className="recipe-section">
                                <h4 className="recipe-section-title">
                                  <i className="fas fa-directions" />
                                  Directions
                                </h4>
                                <ol className="recipe-list">
                                  {(recipe.directions || []).map((step, directionIndex) => (
                                    <li key={`${recipe.id}-direction-${directionIndex}`}>{step}</li>
                                  ))}
                                </ol>
                              </div>
                            ) : null}
                          </>
                        ) : null}

                        <div className="recipe-actions">
                          {recipe.url ? (
                            <>
                              <button
                                className="btn btn-small btn-visit"
                                type="button"
                                aria-label="Visit recipe"
                                title="Visit recipe"
                                onClick={(event) => {
                                  event.stopPropagation()
                                  visitRecipe(recipe.url)
                                }}
                              >
                                <i className="fas fa-external-link-alt" />
                                <span className="visually-hidden">Visit</span>
                              </button>
                              <button
                                className="btn btn-small btn-copy"
                                type="button"
                                aria-label="Copy recipe URL"
                                title="Copy recipe URL"
                                onClick={(event) => {
                                  event.stopPropagation()
                                  copyRecipeUrl(recipe.url)
                                }}
                              >
                                <i className="fas fa-copy" />
                                <span className="visually-hidden">Copy URL</span>
                              </button>
                            </>
                          ) : null}
                          <button
                            className="btn btn-small btn-print"
                            type="button"
                            aria-label="Print recipe"
                            title="Print recipe"
                            onClick={(event) => {
                              event.stopPropagation()
                              printRecipesAsPdf([recipe])
                            }}
                          >
                            <i className="fas fa-print" />
                            <span className="visually-hidden">Print</span>
                          </button>
                          {canManage ? (
                            <>
                              <button
                                className={`btn btn-small ${recipe.pinned ? 'btn-pin-active' : 'btn-pin'}`}
                                type="button"
                                aria-label={recipe.pinned ? 'Unpin recipe' : 'Pin recipe'}
                                title={recipe.pinned ? 'Unpin recipe' : 'Pin recipe'}
                                onClick={(event) => {
                                  event.stopPropagation()
                                  void togglePinnedRecipe(recipe.id)
                                }}
                              >
                                <i className={`fas ${recipe.pinned ? 'fa-star' : 'fa-star-half-alt'}`} />
                                <span className="visually-hidden">{recipe.pinned ? 'Pinned' : 'Pin'}</span>
                              </button>
                              <button
                                className="btn btn-small btn-primary"
                                type="button"
                                aria-label="Edit recipe"
                                title="Edit recipe"
                                onClick={(event) => {
                                  event.stopPropagation()
                                  openModal(recipe)
                                }}
                              >
                                <i className="fas fa-edit" />
                                <span className="visually-hidden">Edit</span>
                              </button>
                              <button
                                className="btn btn-small btn-danger"
                                type="button"
                                aria-label="Delete recipe"
                                title="Delete recipe"
                                onClick={(event) => {
                                  event.stopPropagation()
                                  void handleDeleteRecipe(recipe.id)
                                }}
                              >
                                <i className="fas fa-trash" />
                                <span className="visually-hidden">Delete</span>
                              </button>
                            </>
                          ) : (
                            <span className="shared-readonly-pill">
                              <i className="fas fa-user-group" />
                              Shared recipe
                            </span>
                          )}
                        </div>
                      </div>
                    </article>
                  )
                })}
              </section>
            ) : (
              <section className="no-recipes">
                <i className="fas fa-cookie-bite" />
                <h2>
                  {recipeScope === 'shared'
                    ? 'No shared recipes yet'
                    : recipes.length > 0
                      ? 'No recipes found'
                      : 'No recipes yet!'}
                </h2>
                <p>
                  {recipeScope === 'shared'
                    ? 'No one has shared a recipe with you yet. Shared recipes will appear here.'
                    : recipes.length > 0
                      ? 'Try adjusting your search terms.'
                      : 'Start building your collection by adding your favorite recipe websites.'}
                </p>
                {recipeScope !== 'shared' && recipes.length === 0 ? (
                  <button className="btn btn-primary" type="button" onClick={() => openModal()}>
                    <i className="fas fa-plus" />
                    Add Your First Recipe
                  </button>
                ) : null}
              </section>
            )
          ) : (
            <section className="meal-planner">
              <div className="meal-planner-header">
                <h2>Weekly Meal Planner</h2>
              <button className="btn btn-small btn-secondary" type="button" onClick={() => void clearMealPlan()}>
                  <i className="fas fa-eraser" />
                  Clear Week
                </button>
              </div>
              {plannerRecipes.length === 0 ? (
                <p className="meal-planner-empty">Add at least one recipe before building your meal plan.</p>
              ) : null}
              <div className="meal-planner-grid">
                {MEAL_DAYS.map((day) => (
                  <article key={day} className="meal-day-card">
                    <h3>{day}</h3>
                    {MEAL_SLOTS.map((slot) => (
                      <label key={`${day}-${slot}`} className="meal-slot">
                        <span>{slot}</span>
                        <select
                          className="meal-slot-select"
                          value={mealPlan[day]?.[slot] || ''}
                          onChange={(event) => void updateMealPlan(day, slot, event.target.value)}
                        >
                          <option value="">No recipe selected</option>
                          {plannerRecipes.map((recipe) => (
                            <option key={`${day}-${slot}-${recipe.id}`} value={String(recipe.id)}>
                              {recipe.pinned ? '★ ' : ''}
                              {recipe.name}
                            </option>
                          ))}
                        </select>
                        {mealPlan[day]?.[slot] ? (
                          <small className="meal-slot-selected">
                            {recipeNameById.get(String(mealPlan[day][slot])) || 'Recipe not found'}
                          </small>
                        ) : null}
                      </label>
                    ))}
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      {focusedRecipe ? (
        <div className="focused-recipe-overlay" role="dialog" aria-modal="true" onClick={closeFocusedRecipe}>
          <article className="focused-recipe-panel" onClick={(event) => event.stopPropagation()}>
            <button className="focused-recipe-close" type="button" onClick={closeFocusedRecipe}>
              <i className="fas fa-times" />
              Close
            </button>

            <header className="focused-recipe-header">
              <h2>{focusedRecipe.name}</h2>
              <div className="recipe-categories">
                {(focusedRecipe.categories || (focusedRecipe.category ? [focusedRecipe.category] : [])).map((cat, categoryIndex) => {
                  const info = CATEGORIES[cat] || CATEGORIES.other
                  return (
                    <span
                      key={`focused-${focusedRecipe.id}-${cat}-${categoryIndex}`}
                      className="recipe-category"
                      style={{ backgroundColor: info.color }}
                    >
                      <i className={`fas ${info.icon}`} />
                      {cat}
                    </span>
                  )
                })}
              </div>
            </header>

            {focusedRecipe.image ? (
              <div className="focused-recipe-image-wrap">
                <img src={focusedRecipe.image} alt={focusedRecipe.name} className="focused-recipe-image" />
              </div>
            ) : null}

            {focusedRecipe.notes ? <p className="recipe-notes">{focusedRecipe.notes}</p> : null}

            {Array.isArray(focusedRecipe.ingredients) && focusedRecipe.ingredients.length > 0 ? (
              <section className="focused-recipe-section">
                <h3 className="recipe-section-title">
                  <i className="fas fa-list" />
                  Ingredients
                </h3>
                <ul className="recipe-list">
                  {focusedRecipe.ingredients.map((item, ingredientIndex) => (
                    <li key={`focused-ing-${focusedRecipe.id}-${ingredientIndex}`}>{item}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            {Array.isArray(focusedRecipe.directions) && focusedRecipe.directions.length > 0 ? (
              <section className="focused-recipe-section">
                <h3 className="recipe-section-title">
                  <i className="fas fa-directions" />
                  Directions
                </h3>
                <ol className="recipe-list">
                  {focusedRecipe.directions.map((step, directionIndex) => (
                    <li key={`focused-step-${focusedRecipe.id}-${directionIndex}`}>{step}</li>
                  ))}
                </ol>
              </section>
            ) : null}

            <div className="focused-recipe-actions">
              {canShareRecipe(focusedRecipe) && hasSupabaseConfig && authUser ? (
                <button className="btn btn-secondary" type="button" onClick={() => openShareModal(focusedRecipe)}>
                  <i className="fas fa-share-nodes" />
                  Share
                </button>
              ) : null}
              {focusedRecipe.url ? (
                <>
                  <button className="btn btn-visit" type="button" onClick={() => visitRecipe(focusedRecipe.url)}>
                    <i className="fas fa-external-link-alt" />
                    Visit
                  </button>
                  <button className="btn btn-copy" type="button" onClick={() => copyRecipeUrl(focusedRecipe.url)}>
                    <i className="fas fa-copy" />
                    Copy URL
                  </button>
                </>
              ) : null}
              <button className="btn btn-print" type="button" onClick={() => printRecipesAsPdf([focusedRecipe])}>
                <i className="fas fa-print" />
                Print / Save PDF
              </button>
              {canManageRecipe(focusedRecipe) ? (
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={() => {
                    openModal(focusedRecipe)
                    closeFocusedRecipe()
                  }}
                >
                  <i className="fas fa-edit" />
                  Edit Recipe
                </button>
              ) : null}
            </div>
          </article>
        </div>
      ) : null}

      {isModalOpen ? (
        <div className="modal show" role="dialog" aria-modal="true" onClick={closeModal}>
          <div className="modal-content" onClick={(event) => event.stopPropagation()}>
            <span className="close" onClick={closeModal}>
              &times;
            </span>
            <h2>{currentEditingId ? 'Edit Recipe' : 'Add New Recipe'}</h2>

            <div className="form-group recipe-type-toggle">
              <label>Recipe Type</label>
              <div className="toggle-buttons">
                <button
                  type="button"
                  className={`toggle-btn ${currentRecipeType === 'url' ? 'toggle-btn-active' : ''}`}
                  onClick={() => setCurrentRecipeType('url')}
                >
                  <i className="fas fa-link" />
                  Recipe from URL
                </button>
                <button
                  type="button"
                  className={`toggle-btn ${currentRecipeType === 'custom' ? 'toggle-btn-active' : ''}`}
                  onClick={() => setCurrentRecipeType('custom')}
                >
                  <i className="fas fa-pencil-alt" />
                  Your Recipe
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="recipeName">Recipe Name</label>
                <input
                  id="recipeName"
                  type="text"
                  required
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                />
              </div>

              {currentRecipeType === 'url' ? (
                <>
                  <div className="form-group">
                    <label htmlFor="recipeUrl">Recipe URL</label>
                    <input
                      id="recipeUrl"
                      type="url"
                      required
                      value={form.url}
                      onChange={(event) => setForm((prev) => ({ ...prev, url: event.target.value }))}
                    />
                  </div>

                  <div className="extract-actions">
                    <button
                      className="btn btn-secondary"
                      type="button"
                      onClick={handleExtractFromUrl}
                      disabled={isExtracting}
                    >
                      <i className={`fas ${isExtracting ? 'fa-spinner fa-spin' : 'fa-wand-magic-sparkles'}`} />
                      {isExtracting ? 'Extracting...' : isOnline ? 'Extract Details from URL' : 'Extraction Unavailable Offline'}
                    </button>
                    <p className="extract-notice">
                      {isOnline
                        ? 'First extract can take 30 - 50 seconds while the API wakes up. After that, extracts are usually much faster.'
                        : 'You are offline. URL extraction needs internet, but your saved recipes, planner, and cached pages still work.'}
                    </p>
                  </div>

                  {extractCandidate ? (
                    <div className="extract-preview-card">
                      <div className="extract-preview-header">
                        <strong>{extractCandidate.data.name || 'Unnamed recipe'}</strong>
                        {extractCandidate.meta ? (
                          <span className="extract-meta">
                            Source: {extractCandidate.meta.source} ({extractCandidate.meta.domain})
                          </span>
                        ) : null}
                      </div>
                      <div className="extract-preview-stats">
                        <span>Ingredients: {(extractCandidate.data.ingredients || []).length}</span>
                        <span>Directions: {(extractCandidate.data.directions || []).length}</span>
                        <span>Categories: {(extractCandidate.data.categories || []).length}</span>
                      </div>

                      {extractWarnings.length > 0 ? (
                        <div className="extract-warning-box">
                          {extractWarnings.map((warning, warningIndex) => (
                            <p key={`extract-warning-${warningIndex}`}>{warning}</p>
                          ))}
                        </div>
                      ) : null}

                      {extractCandidate.data.image ? (
                        <div className="extract-image-preview">
                          <img src={extractCandidate.data.image} alt="Extracted recipe" />
                        </div>
                      ) : null}

                      <div className="extract-preview-actions">
                        <button className="btn btn-primary btn-small" type="button" onClick={applyExtractCandidate}>
                          Apply Extracted Fields
                        </button>
                        <button className="btn btn-secondary btn-small" type="button" onClick={discardExtractCandidate}>
                          Discard
                        </button>
                      </div>
                    </div>
                  ) : null}

                  <div className="form-group">
                    <label htmlFor="recipeIngredients">Ingredients (optional / extracted)</label>
                    <textarea
                      id="recipeIngredients"
                      rows="4"
                      placeholder="Extracted ingredients will appear here"
                      value={form.ingredients}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          ingredients: event.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="recipeDirections">Directions (optional / extracted)</label>
                    <textarea
                      id="recipeDirections"
                      rows="4"
                      placeholder="Extracted directions will appear here"
                      value={form.directions}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          directions: event.target.value,
                        }))
                      }
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="form-group">
                    <label htmlFor="recipeIngredients">Ingredients</label>
                    <textarea
                      id="recipeIngredients"
                      rows="4"
                      placeholder="Enter ingredients, one per line"
                      value={form.ingredients}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          ingredients: event.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="recipeDirections">Directions</label>
                    <textarea
                      id="recipeDirections"
                      rows="4"
                      placeholder="Enter directions, one step per line"
                      value={form.directions}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          directions: event.target.value,
                        }))
                      }
                    />
                  </div>
                </>
              )}

              <div className="form-group">
                <label htmlFor="recipeImage">Recipe Image URL (optional)</label>
                <input
                  id="recipeImage"
                  type="url"
                  placeholder="https://example.com/recipe-image.jpg"
                  value={form.image}
                  onChange={(event) => setForm((prev) => ({ ...prev, image: event.target.value }))}
                />
              </div>

              {form.image ? (
                <div className="recipe-image-editor">
                  <div className="extract-image-preview">
                    <img src={form.image} alt="Recipe preview" />
                  </div>
                  <button
                    className="btn btn-secondary btn-small"
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, image: '' }))}
                  >
                    <i className="fas fa-image" />
                    Remove Image
                  </button>
                </div>
              ) : null}

              <div className="form-group">
                <label>Categories (select at least one)</label>
                <div className="category-checkboxes">
                  {CATEGORY_OPTIONS.map((category) => (
                    <div key={category} className="checkbox-item">
                      <input
                        id={`cat-${category}`}
                        type="checkbox"
                        checked={form.categories.includes(category)}
                        onChange={() => toggleCategory(category)}
                      />
                      <label htmlFor={`cat-${category}`}>{formatCategory(category)}</label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="recipeNotes">Notes (optional)</label>
                <textarea
                  id="recipeNotes"
                  rows="3"
                  value={form.notes}
                  onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
                />
              </div>

              {hasSupabaseConfig ? (
                <div className="form-group">
                  <label htmlFor="recipeVisibility">Visibility</label>
                  <select
                    id="recipeVisibility"
                    value={form.visibility || 'private'}
                    onChange={(event) => setForm((prev) => ({ ...prev, visibility: event.target.value }))}
                  >
                    <option value="private">Private</option>
                    <option value="shared">Shared</option>
                    <option value="public">Public</option>
                  </select>
                </div>
              ) : null}

              <button className="btn btn-primary" type="submit">
                {currentEditingId ? 'Update Recipe' : 'Add Recipe'}
              </button>
            </form>
          </div>
        </div>
      ) : null}

      {isProfileModalOpen ? (
        <div className="modal show profile-modal-overlay" role="dialog" aria-modal="true" onClick={closeProfileModal}>
          <div className="modal-content profile-modal" onClick={(event) => event.stopPropagation()}>
            <span className="close" onClick={closeProfileModal}>
              &times;
            </span>
            <h2>Profile</h2>
            {authUser ? (
              <>
                <p className="profile-modal-subtitle">Update how other Dish Depot users find and recognize you.</p>

                <form className="profile-form" onSubmit={handleProfileSave}>
                  <div className="profile-avatar-row">
                    <button
                      ref={profileAvatarEditBtnRef}
                      className="profile-avatar-edit-btn"
                      type="button"
                      onClick={handleAvatarEditClick}
                      disabled={profileUploading}
                      aria-label="Edit profile picture"
                      aria-expanded={isAvatarActionMenuOpen}
                      aria-controls="profile-avatar-actions-menu"
                    >
                      <i className="fas fa-pen" />
                    </button>
                    <img
                      className="profile-avatar-preview"
                      src={profileAvatarUrl || dishDepotLogo}
                      alt="Profile avatar preview"
                    />
                    <input
                      ref={profileAvatarInputRef}
                      id="profileAvatarUpload"
                      className="profile-avatar-input"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      disabled={profileUploading}
                    />

                    {isAvatarActionMenuOpen ? (
                      <div
                        ref={profileAvatarMenuRef}
                        id="profile-avatar-actions-menu"
                        className="profile-avatar-actions-menu"
                        role="menu"
                        aria-label="Profile photo actions"
                      >
                        <button className="btn btn-secondary" type="button" role="menuitem" onClick={handleSelectAvatarPhoto}>
                          <i className="fas fa-image" />
                          Select Photo
                        </button>
                        <button
                          className="btn btn-secondary"
                          type="button"
                          role="menuitem"
                          onClick={handleRemoveAvatarPhoto}
                          disabled={!profileAvatarValue && !profileAvatarUrl}
                        >
                          <i className="fas fa-trash" />
                          Remove Photo
                        </button>
                      </div>
                    ) : null}
                  </div>

                  <div className="form-group">
                    <label htmlFor="profileDisplayName">Display Name</label>
                    <input
                      id="profileDisplayName"
                      type="text"
                      value={profileDisplayName}
                      onChange={(event) => setProfileDisplayName(event.target.value)}
                      placeholder="How your name appears"
                      autoComplete="name"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="profileUsername">Username</label>
                    <input
                      id="profileUsername"
                      type="text"
                      required
                      minLength={3}
                      value={profileUsername}
                      onChange={(event) => setProfileUsername(event.target.value.toLowerCase())}
                      placeholder="username"
                      autoComplete="username"
                    />
                  </div>

                  <div className="profile-form-actions">
                    <button className="btn btn-secondary" type="button" onClick={handleSignOut}>
                      <i className="fas fa-right-from-bracket" />
                      Sign Out
                    </button>
                    <button className="btn btn-primary" type="submit" disabled={profileBusy || profileUploading}>
                      {profileBusy ? 'Saving...' : 'Save Profile'}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <p className="profile-modal-subtitle">Sign in to sync recipes, sharing, and your account profile.</p>

                <form className="profile-auth-form" onSubmit={handleAuthSubmit}>
                  <div className="auth-mode-toggle" role="group" aria-label="Authentication mode">
                    <button
                      className={`btn btn-small ${authMode === 'signin' ? 'btn-primary' : 'btn-secondary'}`}
                      type="button"
                      onClick={() => setAuthMode('signin')}
                    >
                      Sign In
                    </button>
                    <button
                      className={`btn btn-small ${authMode === 'signup' ? 'btn-primary' : 'btn-secondary'}`}
                      type="button"
                      onClick={() => setAuthMode('signup')}
                    >
                      Sign Up
                    </button>
                  </div>

                  <div className="auth-input-row profile-auth-fields">
                    {authMode === 'signup' ? (
                      <>
                        <input
                          type="text"
                          value={authDisplayName}
                          onChange={(event) => setAuthDisplayName(event.target.value)}
                          placeholder="Display name (optional)"
                          autoComplete="name"
                        />
                        <input
                          type="text"
                          value={authUsername}
                          onChange={(event) => setAuthUsername(event.target.value.toLowerCase())}
                          placeholder="Username"
                          autoComplete="username"
                          minLength={3}
                          required
                        />
                      </>
                    ) : null}

                    <input
                      type="email"
                      value={authEmail}
                      onChange={(event) => setAuthEmail(event.target.value)}
                      placeholder="Email"
                      autoComplete="email"
                      required
                    />
                    <input
                      type="password"
                      value={authPassword}
                      onChange={(event) => setAuthPassword(event.target.value)}
                      placeholder="Password"
                      autoComplete={authMode === 'signin' ? 'current-password' : 'new-password'}
                      minLength={6}
                      required
                    />
                  </div>

                  <div className="profile-form-actions">
                    <button className="btn btn-primary" type="submit" disabled={authBusy}>
                      {authBusy ? 'Please wait...' : authMode === 'signup' ? 'Create Account' : 'Sign In'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      ) : null}

      {isShareModalOpen && shareTargetRecipe ? (
        <div className="modal show share-modal-overlay" role="dialog" aria-modal="true" onClick={closeShareModal}>
          <div className="modal-content share-modal" onClick={(event) => event.stopPropagation()}>
            <span className="close" onClick={closeShareModal}>
              &times;
            </span>
            <h2>Share Recipe</h2>
            <p className="share-modal-subtitle">
              Share <strong>{shareTargetRecipe.name}</strong> with another Dish Depot user.
            </p>
            <p className="share-helper-note">Search by username. Recipient must already have an account.</p>

            <form className="share-form" onSubmit={searchShareCandidates}>
              <div className="form-group">
                <label htmlFor="shareRecipientLookup">Recipient Username</label>
                <div className="share-lookup-row">
                  <input
                    id="shareRecipientLookup"
                    type="text"
                    required
                    value={shareLookupText}
                    onChange={(event) => setShareLookupText(event.target.value.toLowerCase())}
                    placeholder="chefmaria"
                    autoComplete="off"
                  />
                  <button className="btn btn-secondary" type="submit" disabled={shareBusy}>
                    {shareBusy ? 'Searching...' : 'Find User'}
                  </button>
                </div>
              </div>

              <label className="share-edit-toggle">
                <input
                  type="checkbox"
                  checked={shareCanEdit}
                  onChange={(event) => setShareCanEdit(event.target.checked)}
                />
                Allow recipient to edit this recipe
              </label>

              {shareResults.length > 0 ? (
                <div className="share-results" aria-label="Share search results">
                  {shareResults.map((result) => (
                    <div key={result.id} className="share-result-item">
                      <div>
                        <strong>@{result.username || 'user'}</strong>
                        <small>{result.displayName || 'Dish Depot user'}</small>
                      </div>
                      <button
                        className="btn btn-primary btn-small"
                        type="button"
                        onClick={() => void shareRecipeWithUser(result)}
                        disabled={shareBusy}
                      >
                        Share
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}

              <section className="share-existing" aria-label="Current shares">
                <h3>Currently Shared With</h3>

                {shareRecipientsLoading ? <p className="share-empty">Loading shares...</p> : null}

                {!shareRecipientsLoading && shareRecipients.length === 0 ? (
                  <p className="share-empty">No recipients yet.</p>
                ) : null}

                {!shareRecipientsLoading && shareRecipients.length > 0 ? (
                  <div className="share-existing-list">
                    {shareRecipients.map((recipient) => (
                      <div key={recipient.userId} className="share-existing-item">
                        <div>
                          <strong>{recipient.username ? `@${recipient.username}` : 'Shared user'}</strong>
                          <small>{recipient.displayName || recipient.userId}</small>
                        </div>

                        <div className="share-existing-actions">
                          <button
                            className="btn btn-secondary btn-small"
                            type="button"
                            onClick={() => void updateSharePermission(recipient, !recipient.canEdit)}
                            disabled={shareBusy}
                          >
                            {recipient.canEdit ? 'Set View Only' : 'Allow Edit'}
                          </button>
                          <button
                            className="btn btn-danger btn-small"
                            type="button"
                            onClick={() => void revokeShare(recipient)}
                            disabled={shareBusy}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </section>

              <div className="share-form-actions">
                <button className="btn btn-secondary" type="button" onClick={closeShareModal}>
                  Close
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {isImportPreviewOpen ? (
        <div className="modal show" role="dialog" aria-modal="true" onClick={closeImportPreview}>
          <div className="modal-content import-preview-modal" onClick={(event) => event.stopPropagation()}>
            <span className="close" onClick={closeImportPreview}>
              &times;
            </span>
            <h2>Review Import</h2>
            <p className="import-preview-subtitle">
              Select which recipes to import. You can uncheck or remove any recipe before importing.
            </p>

            {importSummary ? (
              <div className="import-summary">
                <span className="import-summary-chip">File: {importSummary.totalInFile}</span>
                <span className="import-summary-chip">Valid: {importSummary.validCount}</span>
                <span className="import-summary-chip">Duplicates skipped: {importSummary.duplicateCount}</span>
                <span className="import-summary-chip">Invalid skipped: {importSummary.invalidCount}</span>
              </div>
            ) : null}

            <div className="import-preview-actions">
              <button className="btn btn-secondary btn-small" type="button" onClick={() => setAllImportCandidates(true)}>
                Select All
              </button>
              <button className="btn btn-secondary btn-small" type="button" onClick={() => setAllImportCandidates(false)}>
                Clear All
              </button>
            </div>

            <div className="import-preview-list">
              {importCandidates.map((candidate) => {
                const { recipe, previewId, selected } = candidate
                const categories = recipe.categories || []
                const recipeType = recipe.type === 'custom' || !recipe.url ? 'Custom recipe' : 'URL recipe'

                return (
                  <article key={previewId} className="import-preview-item">
                    <label className="import-preview-check">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleImportCandidate(previewId)}
                      />
                      <span>Include</span>
                    </label>
                    <div className="import-preview-content">
                      <h3>{recipe.name}</h3>
                      <p>{recipeType}</p>
                      {recipe.url ? <a href={recipe.url}>{recipe.url}</a> : null}
                      {categories.length > 0 ? (
                        <div className="import-preview-categories">
                          {categories.map((cat, categoryIndex) => (
                            <span key={`${previewId}-${cat}-${categoryIndex}`}>{formatCategory(cat)}</span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    <button
                      className="btn btn-danger btn-small"
                      type="button"
                      onClick={() => removeImportCandidate(previewId)}
                    >
                      Remove
                    </button>
                  </article>
                )
              })}
            </div>

            <div className="import-preview-footer">
              <button className="btn btn-secondary" type="button" onClick={closeImportPreview}>
                Cancel
              </button>
              <button className="btn btn-primary" type="button" onClick={confirmImportSelection}>
                Import Selected ({selectedImportCount})
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isExportPreviewOpen ? (
        <div className="modal show" role="dialog" aria-modal="true" onClick={closeExportPreview}>
          <div className="modal-content export-preview-modal" onClick={(event) => event.stopPropagation()}>
            <span className="close" onClick={closeExportPreview}>
              &times;
            </span>
            <h2>Review Export</h2>
            <p className="import-preview-subtitle">
              Select which recipes to export. All recipes are selected by default.
            </p>

            <div className="import-preview-actions">
              <button className="btn btn-secondary btn-small" type="button" onClick={() => setAllExportCandidates(true)}>
                Select All
              </button>
              <button className="btn btn-secondary btn-small" type="button" onClick={() => setAllExportCandidates(false)}>
                Clear All
              </button>
            </div>

            <div className="export-preview-list">
              {exportCandidates.map((candidate) => {
                const { recipe, previewId, selected } = candidate
                const categories = recipe.categories || []

                return (
                  <article key={previewId} className="export-preview-item">
                    <label className="import-preview-check">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleExportCandidate(previewId)}
                      />
                      <span>Include</span>
                    </label>
                    <div className="export-preview-content">
                      <h3>
                        {recipe.pinned ? <i className="fas fa-star" aria-hidden="true" /> : null}
                        {recipe.name}
                      </h3>
                      {recipe.url ? <a href={recipe.url}>{recipe.url}</a> : <p>Custom recipe</p>}
                      {categories.length > 0 ? (
                        <div className="import-preview-categories">
                          {categories.map((cat, categoryIndex) => (
                            <span key={`${previewId}-${cat}-${categoryIndex}`}>{formatCategory(cat)}</span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </article>
                )
              })}
            </div>

            <div className="import-preview-footer">
              <button className="btn btn-secondary" type="button" onClick={closeExportPreview}>
                Cancel
              </button>
              <button className="btn btn-print" type="button" onClick={confirmPrintSelection}>
                Print / Save PDF ({selectedExportCount})
              </button>
              <button className="btn btn-primary" type="button" onClick={confirmExportSelection}>
                Export Selected ({selectedExportCount})
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isShoppingListOpen ? (
        <div className="modal show" role="dialog" aria-modal="true" onClick={closeShoppingListBuilder}>
          <div className="modal-content shopping-list-modal" onClick={(event) => event.stopPropagation()}>
            <span className="close" onClick={closeShoppingListBuilder}>
              &times;
            </span>
            <h2>Shopping List Builder</h2>
            <p className="import-preview-subtitle">
              Select recipes and get safe combined totals by parsed quantity and unit. Ambiguous entries appear in
              the Needs Review section.
            </p>

            <div className="import-preview-actions">
              <button className="btn btn-secondary btn-small" type="button" onClick={() => setAllShoppingCandidates(true)}>
                Select All Recipes
              </button>
              <button className="btn btn-secondary btn-small" type="button" onClick={() => setAllShoppingCandidates(false)}>
                Clear All Recipes
              </button>
              <button className="btn btn-secondary btn-small" type="button" onClick={clearShoppingChecklist}>
                Uncheck All Ingredients
              </button>
              <button className="btn btn-secondary btn-small" type="button" onClick={exportShoppingListText}>
                Export List
              </button>
              <span className="shopping-list-count">Recipes selected: {selectedShoppingCount}</span>
            </div>

            <div className="shopping-unit-toggle" role="group" aria-label="Preferred units">
              <button
                type="button"
                className={`btn btn-small ${shoppingUnitSystem === 'us' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setShoppingUnitSystem('us')}
              >
                US Units
              </button>
              <button
                type="button"
                className={`btn btn-small ${shoppingUnitSystem === 'metric' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setShoppingUnitSystem('metric')}
              >
                Metric Units
              </button>
            </div>

            <div className="shopping-list-layout">
              <section className="shopping-list-recipes">
                <h3>Recipes</h3>
                <div className="shopping-list-recipe-items">
                  {shoppingCandidates.map((candidate) => (
                    <label key={candidate.previewId} className="shopping-list-recipe-item">
                      <input
                        type="checkbox"
                        checked={candidate.selected}
                        onChange={() => toggleShoppingCandidate(candidate.previewId)}
                      />
                      <span>
                        {candidate.recipe.name}
                        <small>{(candidate.recipe.ingredients || []).length} ingredients</small>
                      </span>
                    </label>
                  ))}
                </div>
              </section>

              <section className="shopping-list-ingredients">
                <h3>Combined Totals ({combinedShoppingItems.length})</h3>
                {combinedShoppingItems.length > 0 ? (
                  <div className="shopping-list-ingredient-items">
                    {combinedShoppingItems.map((item) => (
                      <label key={item.key} className="shopping-list-ingredient-item">
                        <input
                          type="checkbox"
                          checked={Boolean(shoppingChecklist[item.key])}
                          onChange={() => toggleShoppingItemChecked(item.key)}
                        />
                        <span className={shoppingChecklist[item.key] ? 'shopping-list-item-checked' : ''}>
                          {item.amountLabel}
                          {item.sourceCount > 1 ? ` (${item.sourceCount} lines)` : ''}
                        </span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="shopping-list-empty">Select at least one recipe with parseable ingredients.</p>
                )}

                {visibleUnresolvedItems.length > 0 ? (
                  <>
                    <h3 className="shopping-list-subtitle">Needs Review ({visibleUnresolvedItems.length})</h3>
                    <p className="shopping-merge-legend">
                      <span>
                        <strong>Left checkbox:</strong> Cross item off checklist.
                      </span>
                      <span>
                        <strong>Right checkbox:</strong> You can select multiple items and click "Merge Selected" to combine them into a single checklist entry. This is useful for manually merging similar items that couldn't be automatically combined.
                      </span>
                    </p>
                    <div className="shopping-manual-tools">
                      <input
                        type="text"
                        className="shopping-manual-input"
                        placeholder="Add you own label for merged items"
                        value={shoppingManualText}
                        onChange={(event) => setShoppingManualText(event.target.value)}
                      />
                      <button className="btn btn-secondary btn-small" type="button" onClick={createManualMergeGroup}>
                        Merge Selected
                      </button>
                    </div>
                    <div className="shopping-list-ingredient-items">
                      {visibleUnresolvedItems.map((item) => (
                        <label key={item.key} className="shopping-list-ingredient-item shopping-list-unresolved-item">
                          <input
                            type="checkbox"
                            checked={Boolean(shoppingChecklist[item.key])}
                            onChange={() => toggleShoppingItemChecked(item.key)}
                            title="Checklist done"
                          />
                          <input
                            type="checkbox"
                            className="shopping-merge-check"
                            checked={Boolean(shoppingMergeSelection[item.key])}
                            onChange={() => toggleShoppingMergeSelection(item.key)}
                            title="Select for manual merge"
                          />
                          <span className={shoppingChecklist[item.key] ? 'shopping-list-item-checked' : ''}>
                            {item.text}
                            {item.count > 1 ? ` (${item.count} recipes)` : ''}
                          </span>
                        </label>
                      ))}
                    </div>
                  </>
                ) : null}

                {shoppingManualGroups.length > 0 ? (
                  <>
                    <h3 className="shopping-list-subtitle">Manual Merge Items ({shoppingManualGroups.length})</h3>
                    <div className="shopping-list-ingredient-items">
                      {shoppingManualGroups.map((group) => (
                        <div key={group.key} className="shopping-list-ingredient-item shopping-list-manual-item">
                          <input
                            type="checkbox"
                            checked={Boolean(shoppingChecklist[group.key])}
                            onChange={() => toggleShoppingItemChecked(group.key)}
                          />
                          {shoppingManualEditingKey === group.key ? (
                            <input
                              type="text"
                              className={`shopping-manual-item-input ${shoppingChecklist[group.key] ? 'shopping-list-item-checked' : ''}`}
                              value={shoppingManualEditDraft}
                              onChange={(event) => setShoppingManualEditDraft(event.target.value)}
                            />
                          ) : (
                            <span className={`shopping-manual-item-text ${shoppingChecklist[group.key] ? 'shopping-list-item-checked' : ''}`}>
                              {group.text}
                            </span>
                          )}
                          <span className="shopping-manual-item-count">
                            {group.count > 1 ? `${group.count} lines` : '1 line'}
                          </span>
                          <div className="shopping-manual-actions">
                            {shoppingManualEditingKey === group.key ? (
                              <>
                                <button
                                  className="btn btn-small btn-primary"
                                  type="button"
                                  onClick={() => saveEditingManualMergeGroup(group.key)}
                                >
                                  Save
                                </button>
                                <button className="btn btn-small btn-secondary" type="button" onClick={cancelEditingManualMergeGroup}>
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <button
                                className="btn btn-small btn-secondary"
                                type="button"
                                onClick={() => startEditingManualMergeGroup(group)}
                              >
                                Edit
                              </button>
                            )}
                            <button
                              className="btn btn-small btn-secondary"
                              type="button"
                              onClick={() => splitManualMergeGroup(group.key)}
                            >
                              Split
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : null}
              </section>
            </div>

            <div className="import-preview-footer">
              <button className="btn btn-secondary" type="button" onClick={closeShoppingListBuilder}>
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <footer className="footer">
        <div className="container">
          <p>
            <img className="footer-logo" src={dishDepotLogoBadge} alt="Dish Depot logo mark" />
            &copy; 2026 Dish Depot.<i className="fas fa-cross" />Made with <i className="fas fa-heart" /> for Quinci.
          </p>
        </div>
      </footer>

      <FloatingControls
        canShowFloating={
          !isModalOpen &&
          !isImportPreviewOpen &&
          !isExportPreviewOpen &&
          !isShoppingListOpen &&
          !focusedRecipe &&
          !isProfileModalOpen
        }
        showAddRecipeFab={activeView === 'recipes'}
        showInstallBtn={showInstallBtn}
        showSwUpdateBanner={showSwUpdateBanner}
        onInstallClick={handleInstallClick}
        onDismissInstall={() => setShowInstallBtn(false)}
        onTriggerSwUpdate={triggerSwUpdate}
        onDismissSwUpdate={() => setShowSwUpdateBanner(false)}
        onAddRecipe={() => openModal()}
      />
    </>
  )
}

export default App

import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import dishDepotLogo from './assets/dishdepot-no-background-674x674.png'
import dishDepotLogoBadge from './assets/dishdepot-674x674.png'
import { hasSupabaseConfig, supabase } from './lib/supabaseClient'
import AppErrorBoundary from './components/AppErrorBoundary.jsx'

const AddRecipeModal = lazy(() => import('./components/AddRecipeModal'))
const FocusedRecipeModal = lazy(() => import('./components/FocusedRecipeModal'))

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

function ToolbarMenuSection({ title, danger = false, children }) {
  return (
    <section className={`tools-menu-section${danger ? ' tools-menu-section-danger' : ''}`} aria-label={title}>
      <h3 className="tools-menu-heading">{title}</h3>
      <div className="tools-menu-items">{children}</div>
    </section>
  )
}

function ModalLoadingFallback() {
  return (
    <div className="modal show" role="dialog" aria-modal="true">
      <div className="modal-content">
        <p className="modal-loading-copy">Loading…</p>
      </div>
    </div>
  )
}

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
const CARD_VIEW_COMPACT_KEY = 'recipeCardViewCompact'
const WELCOME_DISMISSED_KEY = 'dishDepotWelcomeDismissed'
const FALLBACK_API_BASE =
  import.meta.env.PROD && window.location.hostname.endsWith('coloradomesa.edu')
    ? 'https://recipes-zmky.onrender.com/api'
    : '/api'
const API_BASE = (import.meta.env.VITE_API_BASE || FALLBACK_API_BASE).replace(/\/$/, '')
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
const EXTRACT_ENDPOINT = `${API_BASE}/recipes/extract`
const EXTRACT_CARD_ENDPOINT = `${API_BASE}/recipes/extract-card`
const PROFILE_SELECT_FIELDS = 'display_name,username,avatar_url'
const GROUP_ROLE_ORDER = {
  viewer: 1,
  contributor: 2,
  editor: 3,
  admin: 4,
}
const GROUP_ROLE_OPTIONS = ['viewer', 'contributor', 'editor', 'admin']
const GROUP_ROLE_LABELS = {
  viewer: 'Viewer',
  contributor: 'Contributor',
  editor: 'Editor',
  admin: 'Admin',
}
const GROUP_ROLE_DESCRIPTIONS = {
  viewer: 'view only',
  contributor: 'add recipes',
  editor: 'edit + remove recipes',
  admin: 'full group management',
}

function getAuthRedirectUrl() {
  const redirectUrl = new URL(import.meta.env.BASE_URL || '/', window.location.origin)
  redirectUrl.searchParams.set('auth', 'confirmed')
  return redirectUrl.toString()
}

function getPasswordResetRedirectUrl() {
  const redirectUrl = new URL(import.meta.env.BASE_URL || '/', window.location.origin)
  redirectUrl.searchParams.set('auth', 'recovery')
  return redirectUrl.toString()
}

function hasGroupRoleOrHigher(role, minimum) {
  return (GROUP_ROLE_ORDER[role] || 0) >= (GROUP_ROLE_ORDER[minimum] || 0)
}

function formatInviteTimestamp(value) {
  if (!value) {
    return 'Unknown time'
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return 'Unknown time'
  }

  return parsed.toLocaleString()
}

function formatInviteExpiry(expiresAt) {
  if (!expiresAt) {
    return 'No expiration set'
  }

  const parsed = new Date(expiresAt)
  if (Number.isNaN(parsed.getTime())) {
    return 'No expiration set'
  }

  const diffMs = parsed.getTime() - Date.now()
  if (diffMs <= 0) {
    return 'Expired'
  }

  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  if (days === 1) {
    return 'Expires in 1 day'
  }
  return `Expires in ${days} days`
}

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
const AVATAR_FALLBACK_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp', 'gif']
const SHOPPING_LIST_DRAFT_KEY = 'dishdepot-shopping-list-draft-v1'
const SHOPPING_LIST_HISTORY_KEY = 'dishdepot-shopping-list-history-v1'
const CARD_SCAN_MAX_DIMENSION = 1800
const CARD_SCAN_MIN_COMPRESSION_BYTES = 2.5 * 1024 * 1024

const SHOPPING_SECTION_RULES = [
  { name: 'Produce', pattern: /(apple|banana|berry|berries|broccoli|carrot|celery|cilantro|cucumber|garlic|ginger|greens|jalapeño|jalapeno|kale|lemon|lettuce|lime|mushroom|onion|orange|parsley|pepper|potato|romaine|spinach|tomato|zucchini|avocado|cabbage)/i },
  { name: 'Dairy & Eggs', pattern: /(butter|cheese|cream|half and half|milk|yogurt|egg|eggs|sour cream)/i },
  { name: 'Meat & Seafood', pattern: /(beef|bacon|chicken|ham|pork|sausage|shrimp|salmon|turkey|tuna|fish)/i },
  { name: 'Bakery & Bread', pattern: /(bagel|bread|bun|buns|croissant|muffin|pita|roll|tortilla|wrap)/i },
  { name: 'Frozen', pattern: /(frozen|ice cream|hash brown)/i },
  { name: 'Canned & Jarred', pattern: /(beans|broth|stock|canned|jar|salsa|sauce|tomato paste|tomatoes|coconut milk)/i },
  { name: 'Dry Goods', pattern: /(baking powder|baking soda|beans|brown sugar|flour|lentils|noodle|oats|pasta|rice|salt|sugar|breadcrumb|cornstarch|powdered sugar|quinoa)/i },
  { name: 'Spices & Oils', pattern: /(basil|cinnamon|cumin|oil|oregano|paprika|pepper|red pepper|rosemary|spice|thyme|turmeric|vanilla|vinegar)/i },
  { name: 'Drinks', pattern: /(coffee|juice|soda|sparkling water|tea|water)/i },
]

function inferShoppingSection(label) {
  const normalized = String(label || '').trim()
  if (!normalized) {
    return 'Other'
  }

  const matched = SHOPPING_SECTION_RULES.find((rule) => rule.pattern.test(normalized))
  return matched?.name || 'Other'
}

function groupShoppingItemsBySection(items, getLabel) {
  const groups = new Map()

  items.forEach((item) => {
    const section = inferShoppingSection(getLabel(item))
    if (!groups.has(section)) {
      groups.set(section, [])
    }
    groups.get(section).push(item)
  })

  return [...groups.entries()]
    .map(([section, sectionItems]) => ({
      section,
      items: sectionItems,
    }))
    .sort((a, b) => a.section.localeCompare(b.section))
}

function extractAvatarStoragePath(value) {
  if (typeof value !== 'string') {
    return ''
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return ''
  }

  if (!/^https?:\/\//i.test(trimmed)) {
    const normalized = decodeURIComponent(trimmed).replace(/^\/+/, '')
    if (normalized.startsWith('avatars/')) {
      return normalized.slice('avatars/'.length)
    }
    return normalized
  }

  try {
    const parsed = new URL(trimmed)
    const marker = '/avatars/'
    const decodedPathname = decodeURIComponent(parsed.pathname)
    const markerIndex = decodedPathname.indexOf(marker)
    if (markerIndex === -1) {
      return ''
    }
    return decodedPathname.slice(markerIndex + marker.length)
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

async function resolveAvatarDisplayUrlForUserId(userId) {
  if (!isUuidLike(userId) || !hasSupabaseConfig || !supabase) {
    return ''
  }

  for (const extension of AVATAR_FALLBACK_EXTENSIONS) {
    const storagePath = `${userId}/avatar.${extension}`
    const { data, error } = await supabase.storage.from('avatars').createSignedUrl(storagePath, AVATAR_SIGNED_URL_TTL_SECONDS)
    if (!error && data?.signedUrl) {
      return data.signedUrl
    }
  }

  return ''
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

function normalizeReviewText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

function detectSuspiciousExtractLine(line, kind) {
  const normalized = normalizeReviewText(line)
  if (!normalized) {
    return { flagged: true, reason: 'Blank line detected' }
  }

  const letterCount = (normalized.match(/[a-z]/gi) || []).length

  if (/[|{}<>_=~]{2,}/.test(normalized) || /(?:\?\?\?)+/.test(normalized)) {
    return { flagged: true, reason: 'Contains OCR-looking symbols' }
  }

  if (kind === 'ingredient') {
    if (/^(ingredients?|directions?|instructions?|notes?)[:.]?$/i.test(normalized)) {
      return { flagged: true, reason: 'Looks like a section heading, not an ingredient' }
    }

    if (letterCount < 3) {
      return { flagged: true, reason: 'Very little readable text' }
    }

    if (normalized.length > 120) {
      return { flagged: true, reason: 'Unusually long ingredient line' }
    }
  }

  if (kind === 'direction') {
    if (letterCount < 6) {
      return { flagged: true, reason: 'Step may be incomplete' }
    }

    if (normalized.length < 10) {
      return { flagged: true, reason: 'Very short step' }
    }

    if (/^(ingredients?|directions?|instructions?|notes?)[:.]?$/i.test(normalized)) {
      return { flagged: true, reason: 'Looks like a section heading, not a direction' }
    }
  }

  if (/^[\d\W]+$/.test(normalized)) {
    return { flagged: true, reason: 'Mostly symbols or numbers' }
  }

  if (/[Il|]{4,}/.test(normalized)) {
    return { flagged: true, reason: 'Looks like OCR confusion between letters' }
  }

  return { flagged: false, reason: '' }
}

function buildExtractFieldReview(extractCandidate, extractWarnings) {
  if (!extractCandidate?.data) {
    return null
  }

  const data = extractCandidate.data
  const warnings = Array.isArray(extractWarnings) ? extractWarnings : []
  const warningText = warnings.join(' ').toLowerCase()
  const ingredients = Array.isArray(data.ingredients) ? data.ingredients : []
  const directions = Array.isArray(data.directions) ? data.directions : []
  const categories = Array.isArray(data.categories) ? data.categories : []

  const suspiciousIngredients = ingredients
    .map((line, index) => ({ index, text: line, ...detectSuspiciousExtractLine(line, 'ingredient') }))
    .filter((item) => item.flagged)

  const suspiciousDirections = directions
    .map((line, index) => ({ index, text: line, ...detectSuspiciousExtractLine(line, 'direction') }))
    .filter((item) => item.flagged)

  const buildStatus = ({ hasValue, warningMatch = '', suspiciousCount = 0 }) => {
    if (!hasValue) {
      return 'missing'
    }
    if ((warningMatch && warningText.includes(warningMatch)) || suspiciousCount > 0) {
      return 'review'
    }
    return 'strong'
  }

  const fields = {
    name: {
      label: 'Title',
      value: data.name || '',
      status: buildStatus({ hasValue: Boolean(normalizeReviewText(data.name)), warningMatch: 'title' }),
      detail: !normalizeReviewText(data.name)
        ? 'No title was captured.'
        : normalizeReviewText(data.name).length < 4
          ? 'Short title — worth a quick check.'
          : 'Looks ready to use.',
    },
    ingredients: {
      label: 'Ingredients',
      items: ingredients,
      suspiciousItems: suspiciousIngredients,
      status: buildStatus({ hasValue: ingredients.length > 0, warningMatch: 'ingredient', suspiciousCount: suspiciousIngredients.length }),
      detail:
        ingredients.length === 0
          ? 'No ingredients were captured.'
          : suspiciousIngredients.length > 0
            ? `${suspiciousIngredients.length} ingredient line${suspiciousIngredients.length === 1 ? ' looks' : 's look'} suspicious.`
            : 'Ingredient list looks consistent.',
    },
    directions: {
      label: 'Directions',
      items: directions,
      suspiciousItems: suspiciousDirections,
      status: buildStatus({ hasValue: directions.length > 0, warningMatch: 'direction', suspiciousCount: suspiciousDirections.length }),
      detail:
        directions.length === 0
          ? 'No directions were captured.'
          : suspiciousDirections.length > 0
            ? `${suspiciousDirections.length} direction step${suspiciousDirections.length === 1 ? ' looks' : 's look'} suspicious.`
            : 'Direction steps look usable.',
    },
    categories: {
      label: 'Categories',
      items: categories,
      status: categories.length === 0 ? 'review' : 'strong',
      detail: categories.length === 0 ? 'No category was suggested.' : `${categories.length} categor${categories.length === 1 ? 'y' : 'ies'} suggested.`,
    },
    image: {
      label: 'Image',
      value: data.image || '',
      status: data.image ? 'strong' : 'review',
      detail: data.image ? 'Image preview is available.' : 'No image was captured from the source.',
    },
  }

  const sectionsNeedingReview = Object.entries(fields)
    .filter(([, field]) => field.status !== 'strong')
    .map(([key, field]) => ({ key, label: field.label, status: field.status }))

  return {
    fields,
    suspiciousIngredients,
    suspiciousDirections,
    sectionsNeedingReview,
  }
}

function buildIdentityInitials(...parts) {
  const source = parts
    .filter(Boolean)
    .join(' ')
    .replace(/[@_-]+/g, ' ')
    .trim()

  if (!source) {
    return 'DD'
  }

  const words = source.split(/\s+/).filter(Boolean)
  const initials = words.slice(0, 2).map((word) => word[0]?.toUpperCase() || '').join('')
  return initials || source.slice(0, 2).toUpperCase()
}

function IdentityAvatar({ displayName = '', username = '', fallback = '', tone = 'default', avatarUrl = '' }) {
  const initials = buildIdentityInitials(displayName, username, fallback)

  return (
    <span className={`identity-avatar identity-avatar-${tone}`} aria-hidden="true">
      {avatarUrl ? <img className="identity-avatar-image" src={avatarUrl} alt="" /> : initials}
    </span>
  )
}

function IdentityBlock({
  displayName = '',
  username = '',
  fallback = 'Dish Depot user',
  meta = '',
  tone = 'default',
  avatarUrl = '',
  compact = false,
}) {
  const hasDisplayName = Boolean(displayName)
  const hasUsername = Boolean(username)
  const primary = hasDisplayName ? displayName : hasUsername ? `@${username}` : fallback
  const secondaryParts = []

  if (hasDisplayName && hasUsername) {
    secondaryParts.push(`@${username}`)
  } else if (!hasDisplayName && !hasUsername && fallback) {
    secondaryParts.push(fallback)
  } else if (!hasDisplayName && hasUsername) {
    secondaryParts.push('Dish Depot member')
  }

  if (meta) {
    secondaryParts.push(meta)
  }

  return (
    <div className={`identity-block${compact ? ' identity-block-compact' : ''}`}>
      <IdentityAvatar displayName={displayName} username={username} fallback={fallback} tone={tone} avatarUrl={avatarUrl} />
      <div className="identity-copy">
        <strong>{primary}</strong>
        {secondaryParts.length > 0 ? <small>{secondaryParts.join(' · ')}</small> : null}
      </div>
    </div>
  )
}

function EmptyStateCard({ icon, title, description, action = null, compact = false }) {
  return (
    <div className={`empty-state-card${compact ? ' empty-state-card-compact' : ''}`}>
      <div className="empty-state-icon" aria-hidden="true">
        <i className={`fas ${icon}`} />
      </div>
      <div className="empty-state-copy">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      {action ? <div className="empty-state-actions">{action}</div> : null}
    </div>
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
  const [isCompactCardView, setIsCompactCardView] = useState(() => localStorage.getItem(CARD_VIEW_COMPACT_KEY) === '1')
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false)
  const [isInlineAddRecipeVisible, setIsInlineAddRecipeVisible] = useState(true)
  const [activeView, setActiveView] = useState('recipes')
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [focusedRecipe, setFocusedRecipe] = useState(null)
  const [currentEditingId, setCurrentEditingId] = useState(null)
  const [currentRecipeType, setCurrentRecipeType] = useState('url')
  const [form, setForm] = useState(emptyForm)
  const [highlightedId, setHighlightedId] = useState(null)
  const [messages, setMessages] = useState([])
  const [authReturnNotice, setAuthReturnNotice] = useState(null)
  const [pendingGroupInviteToken, setPendingGroupInviteToken] = useState('')
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showInstallBtn, setShowInstallBtn] = useState(false)
  const [showSwUpdateBanner, setShowSwUpdateBanner] = useState(false)
  const [isOnline, setIsOnline] = useState(() => navigator.onLine)
  const [isApiReachable, setIsApiReachable] = useState(true)
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
  const [resetPasswordBusy, setResetPasswordBusy] = useState(false)
  const [isResetFlowActive, setIsResetFlowActive] = useState(false)
  const [resetPasswordDraft, setResetPasswordDraft] = useState('')
  const [resetPasswordConfirm, setResetPasswordConfirm] = useState('')
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
  const [groupRecipes, setGroupRecipes] = useState([])
  const [groups, setGroups] = useState([])
  const [groupMemberships, setGroupMemberships] = useState([])
  const [selectedGroupId, setSelectedGroupId] = useState('')
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false)
  const [groupNameDraft, setGroupNameDraft] = useState('')
  const [groupBusy, setGroupBusy] = useState(false)
  const [groupInviteLookup, setGroupInviteLookup] = useState('')
  const [groupInviteResults, setGroupInviteResults] = useState([])
  const [groupInviteRole, setGroupInviteRole] = useState('viewer')
  const [groupMembers, setGroupMembers] = useState([])
  const [groupMembersLoading, setGroupMembersLoading] = useState(false)
  const [groupActivity, setGroupActivity] = useState([])
  const [groupActivityLoading, setGroupActivityLoading] = useState(false)
  const [groupPendingInvites, setGroupPendingInvites] = useState([])
  const [pendingGroupInvites, setPendingGroupInvites] = useState([])
  const [groupInvitesLoading, setGroupInvitesLoading] = useState(false)
  const [isGroupRecipesRefreshing, setIsGroupRecipesRefreshing] = useState(false)
  const [groupRefreshNotice, setGroupRefreshNotice] = useState('')
  const [profileSummaries, setProfileSummaries] = useState({})
  const [isGroupInvitesModalOpen, setIsGroupInvitesModalOpen] = useState(false)
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
  const [shoppingPantry, setShoppingPantry] = useState({})
  const [hidePantryItems, setHidePantryItems] = useState(false)
  const [shoppingUnitSystem, setShoppingUnitSystem] = useState('us')
  const [shoppingMergeSelection, setShoppingMergeSelection] = useState({})
  const [shoppingManualGroups, setShoppingManualGroups] = useState([])
  const [shoppingManualText, setShoppingManualText] = useState('')
  const [shoppingManualEditingKey, setShoppingManualEditingKey] = useState('')
  const [shoppingManualEditDraft, setShoppingManualEditDraft] = useState('')
  const [hasSavedShoppingDraft, setHasSavedShoppingDraft] = useState(() => {
    try {
      return Boolean(localStorage.getItem(SHOPPING_LIST_DRAFT_KEY))
    } catch {
      return false
    }
  })
  const [shoppingHistory, setShoppingHistory] = useState(() => {
    try {
      const raw = localStorage.getItem(SHOPPING_LIST_HISTORY_KEY)
      const parsed = raw ? JSON.parse(raw) : []
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  })
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractWarnings, setExtractWarnings] = useState([])
  const [extractCandidate, setExtractCandidate] = useState(null)
  const [cardScanFile, setCardScanFile] = useState(null)
  const [cardScanPreviewUrl, setCardScanPreviewUrl] = useState('')
  const [isPreparingCardScan, setIsPreparingCardScan] = useState(false)
  const [cardScanPreparationNote, setCardScanPreparationNote] = useState('')
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
  const cardScanInputRef = useRef(null)
  const inlineAddRecipeButtonRef = useRef(null)
  const toolsMenuRef = useRef(null)
  const profileAvatarInputRef = useRef(null)
  const profileAvatarEditBtnRef = useRef(null)
  const profileAvatarMenuRef = useRef(null)
  const networkStatusRef = useRef(navigator.onLine)
  const cloudSyncUserRef = useRef('')
  const cloudMealPlanUserRef = useRef('')
  const latestGroupRecipeIdsRef = useRef(new Set())
  const groupRefreshNoticeTimeoutRef = useRef(0)

  const selectedGroup = useMemo(() => groups.find((group) => group.id === selectedGroupId) || null, [groups, selectedGroupId])

  const selectedGroupRole = useMemo(() => {
    const membership = groupMemberships.find((item) => item.groupId === selectedGroupId)
    return membership?.role || ''
  }, [groupMemberships, selectedGroupId])

  const canContributeToSelectedGroup = hasGroupRoleOrHigher(selectedGroupRole, 'contributor')
  const canAdminSelectedGroup = hasGroupRoleOrHigher(selectedGroupRole, 'admin')

  const groupStatusText = useMemo(() => {
    if (recipeScope !== 'group' || !isUuidLike(selectedGroupId)) {
      return ''
    }
    if (isGroupRecipesRefreshing) {
      return 'Refreshing group recipes…'
    }
    return groupRefreshNotice || 'Live updates on'
  }, [groupRefreshNotice, isGroupRecipesRefreshing, recipeScope, selectedGroupId])

  function getActivityDisplayName({ username = '', displayName = '', userId = '' }) {
    if (displayName) {
      return displayName
    }
    if (username) {
      return `@${username}`
    }
    return userId ? 'A group member' : 'Someone'
  }

  function getUserSummary(userId) {
    if (!userId) {
      return null
    }

    if (authUser?.id && userId === authUser.id) {
      return {
        username: profileUsername,
        displayName: profileDisplayName,
        avatarUrl: profileAvatarUrl,
      }
    }

    return profileSummaries[userId] || null
  }

  function getIdentityProps({ userId = '', displayName = '', username = '', avatarUrl = '', fallback = 'Dish Depot user' } = {}) {
    const summary = userId ? getUserSummary(userId) : null

    return {
      displayName: displayName || summary?.displayName || '',
      username: username || summary?.username || '',
      avatarUrl: avatarUrl || summary?.avatarUrl || '',
      fallback,
    }
  }

  function getCollaboratorLabel(userId, fallback = 'A member') {
    if (!userId) {
      return fallback
    }
    if (authUser?.id && userId === authUser.id) {
      return 'You'
    }

    const summary = getUserSummary(userId)
    if (!summary) {
      return fallback
    }

    return getActivityDisplayName({
      username: summary?.username || '',
      displayName: summary?.displayName || '',
      userId,
    })
  }

  function formatRelativeTime(timestamp) {
    if (!timestamp) {
      return 'Just now'
    }

    const occurredAt = new Date(timestamp)
    if (Number.isNaN(occurredAt.getTime())) {
      return 'Just now'
    }

    const diffMs = occurredAt.getTime() - Date.now()
    const diffMinutes = Math.round(diffMs / (1000 * 60))
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

    if (Math.abs(diffMinutes) < 60) {
      return rtf.format(diffMinutes, 'minute')
    }

    const diffHours = Math.round(diffMinutes / 60)
    if (Math.abs(diffHours) < 24) {
      return rtf.format(diffHours, 'hour')
    }

    const diffDays = Math.round(diffHours / 24)
    return rtf.format(diffDays, 'day')
  }

  function describeGroupActivityItem(item) {
    const actorName = getActivityDisplayName({
      username: item.actorUsername,
      displayName: item.actorDisplayName,
      userId: item.actorUserId,
    })
    const subjectName = getActivityDisplayName({
      username: item.subjectUsername,
      displayName: item.subjectDisplayName,
      userId: item.subjectUserId,
    })

    switch (item.activityType) {
      case 'recipe_added':
        return {
          icon: 'fa-utensils',
          title: `${actorName} added ${item.recipeName || 'a recipe'}`,
          detail: 'Recipe added to this group',
        }
      case 'recipe_removed':
        return {
          icon: 'fa-trash-can',
          title: `${actorName} removed ${item.recipeName || 'a recipe'}`,
          detail: 'Recipe removed from this group',
        }
      case 'member_joined':
        return {
          icon: 'fa-user-plus',
          title: `${subjectName} joined the group`,
          detail: item.role ? `${GROUP_ROLE_LABELS[item.role] || item.role} access` : 'Member joined',
        }
      case 'invite_sent':
        return {
          icon: 'fa-paper-plane',
          title: `${actorName} invited ${subjectName}`,
          detail: item.role ? `${GROUP_ROLE_LABELS[item.role] || item.role} invite sent` : 'Invite sent',
        }
      case 'invite_accepted':
        return {
          icon: 'fa-circle-check',
          title: `${subjectName} accepted an invite`,
          detail: item.role ? `${GROUP_ROLE_LABELS[item.role] || item.role} access confirmed` : 'Invite accepted',
        }
      default:
        return {
          icon: 'fa-clock-rotate-left',
          title: 'Group activity updated',
          detail: 'Recent group activity',
        }
    }
  }

  const scopedRecipes = useMemo(() => {
    if (recipeScope === 'shared') {
      return sharedRecipes
    }
    if (recipeScope === 'group') {
      return groupRecipes
    }
    return recipes
  }, [recipeScope, sharedRecipes, groupRecipes, recipes])

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
  const groupedCombinedShoppingItems = useMemo(
    () => groupShoppingItemsBySection(combinedShoppingItems, (item) => item.amountLabel),
    [combinedShoppingItems],
  )
  const groupedVisibleUnresolvedItems = useMemo(
    () => groupShoppingItemsBySection(visibleUnresolvedItems, (item) => item.text),
    [visibleUnresolvedItems],
  )
  const groupedManualShoppingItems = useMemo(
    () => groupShoppingItemsBySection(shoppingManualGroups, (item) => item.text),
    [shoppingManualGroups],
  )
  const visibleCombinedShoppingItems = useMemo(
    () => combinedShoppingItems.filter((item) => !hidePantryItems || !shoppingPantry[item.key]),
    [combinedShoppingItems, hidePantryItems, shoppingPantry],
  )
  const visibleGroupedCombinedShoppingItems = useMemo(
    () => groupShoppingItemsBySection(visibleCombinedShoppingItems, (item) => item.amountLabel),
    [visibleCombinedShoppingItems],
  )
  const filteredVisibleUnresolvedItems = useMemo(
    () => visibleUnresolvedItems.filter((item) => !hidePantryItems || !shoppingPantry[item.key]),
    [hidePantryItems, shoppingPantry, visibleUnresolvedItems],
  )
  const filteredGroupedVisibleUnresolvedItems = useMemo(
    () => groupShoppingItemsBySection(filteredVisibleUnresolvedItems, (item) => item.text),
    [filteredVisibleUnresolvedItems],
  )
  const visibleManualShoppingGroups = useMemo(
    () => shoppingManualGroups.filter((group) => !hidePantryItems || !shoppingPantry[group.key]),
    [hidePantryItems, shoppingManualGroups, shoppingPantry],
  )
  const visibleGroupedManualShoppingItems = useMemo(
    () => groupShoppingItemsBySection(visibleManualShoppingGroups, (item) => item.text),
    [visibleManualShoppingGroups],
  )
  const pantryItemCount = useMemo(
    () => Object.values(shoppingPantry).filter(Boolean).length,
    [shoppingPantry],
  )
  const pantryEntries = useMemo(() => {
    const combinedEntries = combinedShoppingItems
      .filter((item) => shoppingPantry[item.key])
      .map((item) => ({
        key: item.key,
        label: item.amountLabel,
        detail: item.sourceCount > 1 ? `${item.sourceCount} ingredient lines combined` : 'Combined total',
        section: item.section || 'Pantry',
        kind: 'combined',
      }))

    const unresolvedEntries = visibleUnresolvedItems
      .filter((item) => shoppingPantry[item.key])
      .map((item) => ({
        key: item.key,
        label: item.text,
        detail: item.count > 1 ? `${item.count} recipes need review` : 'Needs review item',
        section: item.section || 'Needs Review',
        kind: 'unresolved',
      }))

    const manualEntries = shoppingManualGroups
      .filter((group) => shoppingPantry[group.key])
      .map((group) => ({
        key: group.key,
        label: group.text,
        detail: group.count > 1 ? `${group.count} lines merged` : 'Manual pantry item',
        section: 'Manual Merge Items',
        kind: 'manual',
      }))

    return [...combinedEntries, ...unresolvedEntries, ...manualEntries]
      .sort((a, b) => a.section.localeCompare(b.section) || a.label.localeCompare(b.label))
  }, [combinedShoppingItems, shoppingManualGroups, shoppingPantry, visibleUnresolvedItems])
  const accountIdentityLabel = useMemo(() => {
    const displayName = profileDisplayName.trim()
    if (displayName) {
      return displayName
    }
    const username = profileUsername.trim()
    if (username) {
      return `@${username}`
    }
    return authUser?.email || 'Account'
  }, [profileDisplayName, profileUsername, authUser?.email])

  const extractReviewSummary = useMemo(() => {
    if (!extractCandidate) {
      return null
    }

    const ingredientsCount = Array.isArray(extractCandidate.data?.ingredients) ? extractCandidate.data.ingredients.length : 0
    const directionsCount = Array.isArray(extractCandidate.data?.directions) ? extractCandidate.data.directions.length : 0
    const warningCount = extractWarnings.length
    const missingSections = []

    if (!extractCandidate.data?.name) {
      missingSections.push('title')
    }
    if (ingredientsCount === 0) {
      missingSections.push('ingredients')
    }
    if (directionsCount === 0) {
      missingSections.push('directions')
    }

    const status = warningCount > 0 || missingSections.length > 0 ? 'review' : 'strong'
    const headline =
      status === 'strong'
        ? 'Ready to apply'
        : missingSections.length > 0
          ? 'Review missing sections before applying'
          : 'Review highlighted details before applying'

    const detail =
      status === 'strong'
        ? 'Dish Depot captured the main recipe sections. You can still tweak anything after applying.'
        : missingSections.length > 0
          ? `Check ${missingSections.join(', ')} carefully before applying the scan results.`
          : 'The scan found usable recipe details, but a few lines still need a quick human review.'

    return {
      status,
      headline,
      detail,
      warningCount,
      ingredientsCount,
      directionsCount,
    }
  }, [extractCandidate, extractWarnings])

  const extractFieldReview = useMemo(
    () => buildExtractFieldReview(extractCandidate, extractWarnings),
    [extractCandidate, extractWarnings],
  )

  const groupSourceContext = useMemo(() => {
    if (recipeScope !== 'group' || !selectedGroup) {
      return null
    }
    return {
      label: `In ${selectedGroup.name}`,
      recipeScope: 'group',
    }
  }, [recipeScope, selectedGroup])

  const loadProfileSummaries = useCallback(async (userIds) => {
    if (!hasSupabaseConfig || !supabase) {
      return {}
    }

    const requestedIds = [...new Set((userIds || []).filter((id) => isUuidLike(id)))]
    const cachedEntries = Object.fromEntries(
      requestedIds
        .filter((id) => profileSummaries[id])
        .map((id) => [id, profileSummaries[id]]),
    )

    const ids = requestedIds.filter((id) => !profileSummaries[id])
    if (ids.length === 0) {
      return cachedEntries
    }

    let data = null
    let error = null

    const primaryResult = await supabase.rpc('get_profile_summaries', {
      target_user_ids: ids,
    })

    data = primaryResult.data
    error = primaryResult.error || null

    if (error) {
      const directResult = await supabase
        .from('profiles')
        .select(`id,${PROFILE_SELECT_FIELDS}`)
        .in('id', ids)

      data = directResult.data
      error = directResult.error || null
    }

    if (error && String(error.message || '').toLowerCase().includes('avatar_url')) {
      const fallbackResult = await supabase
        .from('profiles')
        .select('id,display_name,username')
        .in('id', ids)

      data = fallbackResult.data
      error = fallbackResult.error || null
    }

    if (error) {
      const fallbackProfiles = await Promise.all(
        ids.map(async (id) => ({
          id,
          username: cachedEntries[id]?.username || '',
          displayName: cachedEntries[id]?.displayName || '',
          avatarUrl: await resolveAvatarDisplayUrlForUserId(id),
        })),
      )

      const validFallbackProfiles = fallbackProfiles.filter((profile) => profile.avatarUrl)
      if (validFallbackProfiles.length === 0) {
        return cachedEntries
      }

      setProfileSummaries((prev) => {
        const next = { ...prev }
        validFallbackProfiles.forEach((profile) => {
          next[profile.id] = {
            username: profile.username || next[profile.id]?.username || '',
            displayName: profile.displayName || next[profile.id]?.displayName || '',
            avatarUrl: profile.avatarUrl,
          }
        })
        return next
      })

      return {
        ...cachedEntries,
        ...Object.fromEntries(
          validFallbackProfiles.map((profile) => [profile.id, {
            username: profile.username || cachedEntries[profile.id]?.username || '',
            displayName: profile.displayName || cachedEntries[profile.id]?.displayName || '',
            avatarUrl: profile.avatarUrl,
          }]),
        ),
      }
    }

    if (Array.isArray(data) && data.length > 0) {
      const resolvedProfiles = await Promise.all(
        data
          .filter((row) => row?.id)
          .map(async (row) => ({
            id: row.id,
            username: row.username || '',
            displayName: row.display_name || '',
            avatarUrl: (await resolveAvatarDisplayUrl(row.avatar_url || '')) || (await resolveAvatarDisplayUrlForUserId(row.id)),
          })),
      )

      const unresolvedIds = ids.filter((id) => !resolvedProfiles.some((profile) => profile.id === id))
      const probedProfiles = await Promise.all(
        unresolvedIds.map(async (id) => ({
          id,
          username: '',
          displayName: '',
          avatarUrl: await resolveAvatarDisplayUrlForUserId(id),
        })),
      )

      const allResolvedProfiles = [...resolvedProfiles, ...probedProfiles.filter((profile) => profile.avatarUrl)]

      setProfileSummaries((prev) => {
        const next = { ...prev }
        allResolvedProfiles.forEach((profile) => {
          next[profile.id] = {
            username: profile.username || next[profile.id]?.username || '',
            displayName: profile.displayName || next[profile.id]?.displayName || '',
            avatarUrl: profile.avatarUrl,
          }
        })
        return next
      })

      return {
        ...cachedEntries,
        ...Object.fromEntries(
          allResolvedProfiles.map((profile) => [profile.id, {
            username: profile.username || cachedEntries[profile.id]?.username || '',
            displayName: profile.displayName || cachedEntries[profile.id]?.displayName || '',
            avatarUrl: profile.avatarUrl,
          }]),
        ),
      }
    }

    return cachedEntries
  }, [profileSummaries, profileAvatarUrl, profileDisplayName, profileUsername])

  function getRecipeOriginBadges(recipe) {
    const badges = []

    if (recipeScope === 'shared') {
      badges.push({ tone: 'shared', icon: 'fa-share-nodes', label: 'Shared with me' })
      badges.push({ tone: recipe.sharedReadOnly ? 'readonly' : 'editable', icon: recipe.sharedReadOnly ? 'fa-eye' : 'fa-pen-to-square', label: recipe.sharedReadOnly ? 'View only' : 'Can edit' })
      if (recipe.ownerId) {
        badges.push({ tone: 'meta', icon: recipe.ownerId === authUser?.id ? 'fa-user-check' : 'fa-user', label: `Owner: ${getCollaboratorLabel(recipe.ownerId, 'Unknown owner')}` })
      }
      return badges
    }

    if (recipeScope === 'group') {
      badges.push({ tone: 'group', icon: 'fa-users', label: groupSourceContext?.label || 'Group recipe' })
      badges.push({ tone: recipe.sharedReadOnly ? 'readonly' : 'editable', icon: recipe.sharedReadOnly ? 'fa-eye' : 'fa-pen-to-square', label: recipe.sharedReadOnly ? 'View only' : 'Can edit' })
      if (recipe.groupAddedBy) {
        badges.push({ tone: 'meta', icon: recipe.groupAddedBy === authUser?.id ? 'fa-user-check' : 'fa-user-plus', label: `Added by ${getCollaboratorLabel(recipe.groupAddedBy, 'a member')}` })
      }
      if (recipe.ownerId) {
        badges.push({ tone: 'meta', icon: recipe.ownerId === authUser?.id ? 'fa-user-check' : 'fa-user', label: `Owner: ${getCollaboratorLabel(recipe.ownerId, 'Unknown owner')}` })
      }
      return badges
    }

    if (recipe.ownerId && authUser?.id && recipe.ownerId === authUser.id) {
      badges.push({ tone: 'mine', icon: 'fa-utensils', label: 'My recipe' })
    }

    return badges
  }

  function getRecipeProvenanceEntries(recipe) {
    const entries = []

    if (recipeScope === 'shared' && recipe.ownerId) {
      entries.push({
        key: `owner-${recipe.ownerId}`,
        label: recipe.ownerId === authUser?.id ? 'Owned by you' : 'Recipe owner',
        meta: recipe.ownerId === authUser?.id ? 'Shared from your library' : 'Shared from their library',
        tone: recipe.ownerId === authUser?.id ? 'self' : 'default',
        ...getIdentityProps({ userId: recipe.ownerId, fallback: 'Unknown owner' }),
      })
    }

    if (recipeScope === 'group') {
      if (recipe.groupAddedBy) {
        entries.push({
          key: `added-${recipe.groupAddedBy}`,
          label: recipe.groupAddedBy === authUser?.id ? 'Added by you' : 'Added to this group by',
          meta: selectedGroup?.name ? `Shared in ${selectedGroup.name}` : 'Shared in this group',
          tone: recipe.groupAddedBy === authUser?.id ? 'self' : 'member',
          ...getIdentityProps({ userId: recipe.groupAddedBy, fallback: 'Group contributor' }),
        })
      }

      if (recipe.ownerId && recipe.ownerId !== recipe.groupAddedBy) {
        entries.push({
          key: `owner-${recipe.ownerId}`,
          label: recipe.ownerId === authUser?.id ? 'Owned by you' : 'Recipe owner',
          meta: 'Original recipe owner',
          tone: recipe.ownerId === authUser?.id ? 'self' : 'default',
          ...getIdentityProps({ userId: recipe.ownerId, fallback: 'Unknown owner' }),
        })
      }
    }

    return entries
  }

  async function applyProfileState(profile) {
    setProfileDisplayName(profile?.display_name || '')
    setProfileUsername(profile?.username || '')
    const avatarValue = profile?.avatar_url || ''
    setProfileAvatarValue(avatarValue)
    const avatarDisplayUrl = await resolveAvatarDisplayUrl(avatarValue)
    setProfileAvatarUrl(avatarDisplayUrl)
  }

  async function fetchFreshProfileRow(userId) {
    if (!hasSupabaseConfig || !supabase || !userId || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return null
    }

    const {
      data: { session },
    } = await supabase.auth.getSession()

    const profileUrl = new URL(`${SUPABASE_URL}/rest/v1/profiles`)
    profileUrl.searchParams.set('select', PROFILE_SELECT_FIELDS)
    profileUrl.searchParams.set('id', `eq.${userId}`)

    const response = await fetch(profileUrl.toString(), {
      method: 'GET',
      cache: 'no-store',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${session?.access_token || SUPABASE_ANON_KEY}`,
        Accept: 'application/vnd.pgrst.object+json',
        'Cache-Control': 'no-cache, no-store, max-age=0',
        Pragma: 'no-cache',
      },
    })

    if (response.status === 404 || response.status === 406) {
      return null
    }

    if (!response.ok) {
      throw new Error((await response.text()) || `Profile request failed with ${response.status}`)
    }

    return response.json()
  }

  function clearCardScanSelection() {
    setCardScanFile(null)
    setCardScanPreparationNote('')
    if (cardScanInputRef.current) {
      cardScanInputRef.current.value = ''
    }
  }

  async function optimizeCardScanFile(file) {
    if (!file || !file.type.startsWith('image/')) {
      return { file, note: file?.type === 'application/pdf' ? 'PDF kept as-is for Azure scanning.' : '' }
    }

    const objectUrl = URL.createObjectURL(file)

    try {
      const image = await new Promise((resolve, reject) => {
        const nextImage = new Image()
        nextImage.onload = () => resolve(nextImage)
        nextImage.onerror = () => reject(new Error('Could not read that image. Try a different photo.'))
        nextImage.src = objectUrl
      })

      const sourceWidth = image.naturalWidth || image.width
      const sourceHeight = image.naturalHeight || image.height
      const maxDimension = Math.max(sourceWidth, sourceHeight)
      const scale = maxDimension > CARD_SCAN_MAX_DIMENSION ? CARD_SCAN_MAX_DIMENSION / maxDimension : 1
      const needsOptimization = scale < 1 || file.size > CARD_SCAN_MIN_COMPRESSION_BYTES

      if (!needsOptimization) {
        return { file, note: `Image looks ready for scanning (${sourceWidth}×${sourceHeight}).` }
      }

      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(sourceWidth * scale))
      canvas.height = Math.max(1, Math.round(sourceHeight * scale))
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        return { file, note: `Original image kept (${sourceWidth}×${sourceHeight}).` }
      }

      ctx.filter = 'grayscale(100%) contrast(115%) brightness(108%)'
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height)

      const optimizedBlob = await new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob)
            return
          }
          reject(new Error('Could not optimize that image. Try a different file.'))
        }, 'image/jpeg', 0.92)
      })

      const baseName = file.name.replace(/\.[^.]+$/, '') || 'recipe-card-scan'
      const optimizedFile = new File([optimizedBlob], `${baseName}.jpg`, {
        type: 'image/jpeg',
        lastModified: Date.now(),
      })

      return {
        file: optimizedFile,
        note: `Image optimized for scanning (${canvas.width}×${canvas.height}).`,
      }
    } finally {
      URL.revokeObjectURL(objectUrl)
    }
  }

  function setRecipeCreationMode(nextType) {
    setCurrentRecipeType(nextType)
    setExtractWarnings([])
    setExtractCandidate(null)
    if (nextType !== 'card') {
      clearCardScanSelection()
    }
  }

  function cleanMultilineField(value, options = {}) {
    const { splitCommas = false, numberSteps = false } = options

    const baseLines = String(value || '')
      .split('\n')
      .flatMap((line) => (splitCommas ? line.split(',') : [line]))
      .map((line) => line.replace(/^\s*(?:[-*•]+|\d+[.)-]?)\s*/, '').trim())
      .filter(Boolean)

    if (numberSteps) {
      return baseLines.map((line, index) => `${index + 1}. ${line}`).join('\n')
    }

    return baseLines.join('\n')
  }

  function updateRecipeFormField(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value ?? '',
    }))
  }

  function applyRecipeFieldCleanup(field, options = {}) {
    setForm((prev) => ({
      ...prev,
      [field]: cleanMultilineField(prev[field], options),
    }))
  }

  function updateGroupRefreshNotice(text) {
    setGroupRefreshNotice(text)
    if (groupRefreshNoticeTimeoutRef.current) {
      window.clearTimeout(groupRefreshNoticeTimeoutRef.current)
    }
    if (!text || text === 'Live updates on') {
      return
    }
    groupRefreshNoticeTimeoutRef.current = window.setTimeout(() => {
      setGroupRefreshNotice('Live updates on')
      groupRefreshNoticeTimeoutRef.current = 0
    }, 5000)
  }

  const loadGroups = useCallback(async () => {
    if (!hasSupabaseConfig || !supabase || !authUser?.id) {
      setGroups([])
      setGroupMemberships([])
      setGroupRecipes([])
      setSelectedGroupId('')
      return
    }

    const { data: membershipRows, error: membershipError } = await supabase.rpc('get_my_group_memberships')

    if (membershipError) {
      showMessage(`Could not load groups: ${membershipError.message}`, 'info')
      return
    }

    const memberships = Array.isArray(membershipRows)
      ? membershipRows.map((row) => ({
          groupId: row.group_id,
          role: row.role || 'viewer',
        }))
      : []

    setGroupMemberships(memberships)

    const groupIds = memberships.map((row) => row.groupId).filter((id) => isUuidLike(id))
    if (groupIds.length === 0) {
      setGroups([])
      setSelectedGroupId('')
      setGroupRecipes([])
      return
    }

    const { data: groupRows, error: groupError } = await supabase
      .from('groups')
      .select('id,name,created_by,created_at')
      .in('id', groupIds)
      .order('name', { ascending: true })

    if (groupError) {
      showMessage(`Could not load groups: ${groupError.message}`, 'info')
      return
    }

    const mappedGroups = Array.isArray(groupRows) ? groupRows : []
    setGroups(mappedGroups)
    setSelectedGroupId((prev) => {
      if (prev && mappedGroups.some((group) => group.id === prev)) {
        return prev
      }
      return mappedGroups[0]?.id || ''
    })
  }, [authUser?.id])

  const loadGroupRecipes = useCallback(async (groupId = selectedGroupId, groupRole = selectedGroupRole, options = {}) => {
    const { reason = 'manual', quiet = false } = options

    if (!hasSupabaseConfig || !supabase || !authUser?.id || !isUuidLike(groupId)) {
      setGroupRecipes([])
      latestGroupRecipeIdsRef.current = new Set()
      return
    }

    setIsGroupRecipesRefreshing(true)

    const { data: recipeRows, error: recipeError } = await supabase.rpc('get_group_recipes', {
      target_group_id: groupId,
    })

    setIsGroupRecipesRefreshing(false)

    if (recipeError) {
      if (!quiet) {
        showMessage(`Could not load group recipes: ${recipeError.message}`, 'info')
      }
      setGroupRecipes([])
      return
    }

    const nextRows = Array.isArray(recipeRows) ? recipeRows : []
    await loadProfileSummaries(nextRows.flatMap((row) => [row.owner_id, row.added_by]))
    const nextRecipeIds = new Set(nextRows.map((row) => row.id).filter((id) => isUuidLike(id)))
    const previousRecipeIds = latestGroupRecipeIdsRef.current
    const newlyVisibleCount = [...nextRecipeIds].filter((id) => !previousRecipeIds.has(id)).length

    const canEditGroupRecipes = hasGroupRoleOrHigher(groupRole, 'editor')
    const mapped = migrateRecipes(
      nextRows.map((row) => ({
        ...mapSupabaseRecipeToApp(row),
        groupAddedBy: row.added_by || null,
        groupAddedAt: row.added_at || null,
        sharedReadOnly: !(canEditGroupRecipes || row.owner_id === authUser.id),
      })),
    )

    latestGroupRecipeIdsRef.current = nextRecipeIds
    setGroupRecipes(mapped)

    if (reason === 'realtime' && newlyVisibleCount > 0) {
      updateGroupRefreshNotice(newlyVisibleCount === 1 ? '1 new recipe just arrived' : `${newlyVisibleCount} new recipes just arrived`)
      showMessage(newlyVisibleCount === 1 ? 'A new recipe was added to this group.' : `${newlyVisibleCount} new recipes were added to this group.`, 'success')
      return
    }

    if (reason === 'focus' || reason === 'member-change') {
      updateGroupRefreshNotice('Group recipes refreshed')
      return
    }

    updateGroupRefreshNotice('Live updates on')
  }, [authUser?.id, loadProfileSummaries, selectedGroupId, selectedGroupRole])

  useEffect(() => {
    try {
      if (localStorage.getItem(WELCOME_DISMISSED_KEY) !== '1') {
        setIsWelcomeModalOpen(true)
      }
    } catch {
      setIsWelcomeModalOpen(true)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes))
  }, [recipes])

  useEffect(() => {
    localStorage.setItem(MEAL_PLAN_KEY, JSON.stringify(mealPlan))
  }, [mealPlan])

  useEffect(() => {
    localStorage.setItem(CARD_VIEW_COMPACT_KEY, isCompactCardView ? '1' : '0')
  }, [isCompactCardView])

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
    if (!isProfileModalOpen) {
      return undefined
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isProfileModalOpen])

  useEffect(() => {
    if (!isModalOpen) {
      return undefined
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isModalOpen])

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
    } = supabase.auth.onAuthStateChange((event, session) => {
      setAuthUser(session?.user || null)

      if (event === 'PASSWORD_RECOVERY') {
        setIsResetFlowActive(true)
        setIsProfileModalOpen(true)
        setAuthReturnNotice({ type: 'info', text: 'Choose a new password to finish resetting your account.' })
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    const readParams = (raw) => {
      const params = new URLSearchParams(raw)
      return {
        auth: params.get('auth') || '',
        type: params.get('type') || '',
        code: params.get('code') || '',
        groupInvite: params.get('groupInvite') || '',
        error: params.get('error') || '',
        errorDescription: params.get('error_description') || '',
      }
    }

    const fromQuery = readParams(window.location.search)
    const fromHash = window.location.hash.startsWith('#') ? readParams(window.location.hash.slice(1)) : null

    const authValue = fromQuery.auth || fromHash?.auth || ''
    const authType = fromQuery.type || fromHash?.type || ''
    const authCode = fromQuery.code || fromHash?.code || ''
    const groupInviteToken = fromQuery.groupInvite || fromHash?.groupInvite || ''
    const authError = fromQuery.error || fromHash?.error || ''
    const authErrorDescription = fromQuery.errorDescription || fromHash?.errorDescription || ''

    if (authError || authErrorDescription) {
      const decoded = decodeURIComponent(authErrorDescription || authError || 'Authentication link failed.')
      setAuthReturnNotice({ type: 'error', text: decoded })
    } else if (authValue === 'recovery' || authType === 'recovery') {
      setIsResetFlowActive(true)
      setIsProfileModalOpen(true)
      setAuthReturnNotice({ type: 'info', text: 'Choose a new password to finish resetting your account.' })
    } else if (authValue === 'confirmed' || authType === 'signup' || authCode) {
      setAuthReturnNotice({
        type: 'success',
        text: 'Your email was confirmed. You can now sign in and sync your Dish Depot account.',
      })
    }

    if (groupInviteToken) {
      setPendingGroupInviteToken(groupInviteToken)
      if (!authUser?.id) {
        setIsProfileModalOpen(true)
        setAuthReturnNotice({ type: 'info', text: 'Sign in to accept your group invite.' })
      }
    }

    const params = new URLSearchParams(window.location.search)
    const keysToRemove = ['auth', 'type', 'code', 'groupInvite', 'error', 'error_description']
    let changed = false

    keysToRemove.forEach((key) => {
      if (params.has(key)) {
        params.delete(key)
        changed = true
      }
    })

    if (changed || window.location.hash) {
      const nextSearch = params.toString()
      const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}`
      window.history.replaceState({}, '', nextUrl)
    }
  }, [authUser?.id])

  useEffect(() => {
    if (!pendingGroupInviteToken || !hasSupabaseConfig || !supabase || !authUser?.id) {
      return
    }

    let cancelled = false

    const acceptInvite = async () => {
      const { data, error } = await supabase.rpc('accept_group_invite', {
        invite_token: pendingGroupInviteToken,
      })

      if (cancelled) {
        return
      }

      if (error) {
        showMessage(error.message || 'Could not accept group invite.', 'error')
        setPendingGroupInviteToken('')
        return
      }

      const accepted = Array.isArray(data) ? data[0] : data
      await loadGroups()

      if (accepted?.group_id) {
        setSelectedGroupId(accepted.group_id)
        setRecipeScope('group')
        await loadGroupRecipes(accepted.group_id, accepted.role || 'viewer', { reason: 'member-change' })
      }

      showMessage(`Joined ${accepted?.group_name || 'group'} successfully.`, 'success')
      setPendingGroupInviteToken('')
    }

    void acceptInvite()

    return () => {
      cancelled = true
    }
  }, [authUser?.id, pendingGroupInviteToken, loadGroupRecipes, loadGroups])

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
      let data = null
      let error = null

      try {
        data = await fetchFreshProfileRow(authUser.id)
      } catch (freshError) {
        error = freshError
      }

      if (!data) {
        const profileResult = await supabase
          .from('profiles')
          .select(PROFILE_SELECT_FIELDS)
          .eq('id', authUser.id)
          .maybeSingle()

        data = profileResult.data
        error = profileResult.error || null
      }

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

        await applyProfileState(fallbackData)
        return
      }

      await applyProfileState(data)
      if (cancelled) {
        return
      }
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

      await loadProfileSummaries((sharedRows || []).map((row) => row.owner_id))

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
  }, [authUser?.id, isOnline, loadProfileSummaries, recipeScope])

  useEffect(() => {
    void loadGroups().catch(() => undefined)
  }, [loadGroups])

  useEffect(() => {
    if (!hasSupabaseConfig || !supabase || !authUser?.id) {
      setPendingGroupInvites([])
      return
    }

    let cancelled = false

    const loadPendingInvites = async () => {
      setGroupInvitesLoading(true)

      try {
        const { data, error } = await supabase.rpc('get_pending_group_invites')

        if (cancelled) {
          return
        }

        if (error) {
          showMessage(`Could not load group invites: ${error.message}`, 'info')
          setPendingGroupInvites([])
          return
        }

      const invites = Array.isArray(data)
          ? data.map((row) => ({
              id: row.id,
              groupId: row.group_id,
              role: row.role || 'viewer',
              token: row.token || '',
              invitedBy: row.invited_by || '',
              inviterUsername: row.inviter_username || '',
              inviterDisplayName: row.inviter_display_name || '',
              createdAt: row.created_at || '',
              expiresAt: row.expires_at || '',
              groupName: row.group_name || 'Group',
            }))
          : []

        await loadProfileSummaries(invites.map((invite) => invite.invitedBy))

        setPendingGroupInvites(invites)
      } finally {
        if (!cancelled) {
          setGroupInvitesLoading(false)
        }
      }
    }

    void loadPendingInvites()

    return () => {
      cancelled = true
    }
  }, [authUser?.id])

  useEffect(() => {
    void loadGroupRecipes(selectedGroupId, selectedGroupRole, { quiet: true }).catch(() => undefined)
  }, [loadGroupRecipes, selectedGroupId, selectedGroupRole])

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

    const onOnline = () => {
      setIsApiReachable(true)
      void verifyConnectivity({ notify: true })
    }
    const onOffline = () => setOnlineStatus(false, true)

    const verifyConnectivity = async ({ notify = false } = {}) => {
      if (!navigator.onLine) {
        setOnlineStatus(false, notify)
        return
      }

      const controller = new AbortController()
      const timeoutId = window.setTimeout(() => controller.abort(), 3200)
      const probeUrl = new URL(`${import.meta.env.BASE_URL}online-check.txt?_=${Date.now()}`, window.location.origin).toString()

      try {
        const response = await fetch(probeUrl, {
          method: 'GET',
          cache: 'no-store',
          headers: { pragma: 'no-cache', 'cache-control': 'no-cache' },
          signal: controller.signal,
        })
        setOnlineStatus(response.ok, notify)
      } catch {
        setOnlineStatus(false, notify)
      } finally {
        window.clearTimeout(timeoutId)
      }
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void verifyConnectivity()
      }
    }

    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    window.addEventListener('focus', onVisibilityChange)
    window.addEventListener('pageshow', onVisibilityChange)
    document.addEventListener('visibilitychange', onVisibilityChange)

    networkStatusRef.current = navigator.onLine
    setIsOnline(navigator.onLine)
    void verifyConnectivity()

    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
      window.removeEventListener('focus', onVisibilityChange)
      window.removeEventListener('pageshow', onVisibilityChange)
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
        setIsWelcomeModalOpen(false)
        setIsModalOpen(false)
        setIsGroupModalOpen(false)
        setIsGroupInvitesModalOpen(false)
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
    const lockBackgroundScroll = isGroupModalOpen || isGroupInvitesModalOpen || isShareModalOpen
    if (!lockBackgroundScroll) {
      return undefined
    }

    const previousBodyOverflow = document.body.style.overflow
    const previousBodyOverscroll = document.body.style.overscrollBehavior
    const previousHtmlOverflow = document.documentElement.style.overflow
    const previousHtmlOverscroll = document.documentElement.style.overscrollBehavior

    document.body.style.overflow = 'hidden'
    document.body.style.overscrollBehavior = 'none'
    document.documentElement.style.overflow = 'hidden'
    document.documentElement.style.overscrollBehavior = 'none'

    return () => {
      document.body.style.overflow = previousBodyOverflow
      document.body.style.overscrollBehavior = previousBodyOverscroll
      document.documentElement.style.overflow = previousHtmlOverflow
      document.documentElement.style.overscrollBehavior = previousHtmlOverscroll
    }
  }, [isGroupModalOpen, isGroupInvitesModalOpen, isShareModalOpen])

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
    if (!isToolsMenuOpen) {
      return undefined
    }

    const handleOutsideToolsMenuClick = (event) => {
      if (!(event.target instanceof Node)) {
        return
      }

      if (toolsMenuRef.current?.contains(event.target)) {
        return
      }

      setIsToolsMenuOpen(false)
    }

    const handleToolsMenuEscape = (event) => {
      if (event.key === 'Escape') {
        setIsToolsMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideToolsMenuClick)
    document.addEventListener('touchstart', handleOutsideToolsMenuClick)
    document.addEventListener('keydown', handleToolsMenuEscape)

    return () => {
      document.removeEventListener('mousedown', handleOutsideToolsMenuClick)
      document.removeEventListener('touchstart', handleOutsideToolsMenuClick)
      document.removeEventListener('keydown', handleToolsMenuEscape)
    }
  }, [isToolsMenuOpen])

  useEffect(() => {
    const button = inlineAddRecipeButtonRef.current

    if (!button || activeView !== 'recipes' || recipeScope === 'shared') {
      setIsInlineAddRecipeVisible(false)
      return undefined
    }

    if (typeof IntersectionObserver !== 'function') {
      setIsInlineAddRecipeVisible(true)
      return undefined
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInlineAddRecipeVisible(entry.isIntersecting)
      },
      {
        threshold: 0.35,
      },
    )

    observer.observe(button)

    return () => {
      observer.disconnect()
    }
  }, [activeView, recipeScope])

  useEffect(() => {
    if (!cardScanFile) {
      setCardScanPreviewUrl('')
      return undefined
    }

    const objectUrl = URL.createObjectURL(cardScanFile)
    setCardScanPreviewUrl(objectUrl)

    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [cardScanFile])

  useEffect(() => {
    return () => {
      if (groupRefreshNoticeTimeoutRef.current) {
        window.clearTimeout(groupRefreshNoticeTimeoutRef.current)
      }
    }
  }, [])

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

    setShoppingPantry((prev) => {
      const next = {}
      Object.entries(prev).forEach(([key, value]) => {
        if (validKeys.has(key)) {
          next[key] = value
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

  function canRemoveRecipeFromSelectedGroup(recipe) {
    if (!isUuidLike(selectedGroupId)) {
      return false
    }

    if (hasGroupRoleOrHigher(selectedGroupRole, 'editor')) {
      return true
    }

    return Boolean(authUser?.id && recipe?.groupAddedBy && recipe.groupAddedBy === authUser.id)
  }

  async function addRecipeToSelectedGroup(recipe) {
    if (!hasSupabaseConfig || !supabase || !authUser?.id) {
      showMessage('Sign in to share recipes to a group.', 'info')
      return
    }

    if (!isUuidLike(selectedGroupId)) {
      showMessage('Choose a group first.', 'info')
      return
    }

    if (!canContributeToSelectedGroup) {
      showMessage('You do not have permission to contribute to this group.', 'info')
      return
    }

    if (!isUuidLike(recipe?.id)) {
      showMessage('Save this recipe to cloud first, then add it to a group.', 'info')
      return
    }

    const { error } = await supabase.from('group_recipes').upsert(
      {
        group_id: selectedGroupId,
        recipe_id: recipe.id,
        added_by: authUser.id,
      },
      { onConflict: 'group_id,recipe_id' },
    )

    if (error) {
      showMessage(`Could not add recipe to group: ${error.message}`, 'error')
      return
    }

    showMessage(`Added recipe to ${selectedGroup?.name || 'group'}.`, 'success')

    if (recipeScope === 'group') {
      setGroupRecipes((prev) => {
        if (prev.some((item) => item.id === recipe.id)) {
          return prev
        }
        const canEditGroupRecipes = hasGroupRoleOrHigher(selectedGroupRole, 'editor')
        const normalizedRecipe = migrateRecipes([
          {
            ...recipe,
            groupAddedBy: authUser.id,
            groupAddedAt: new Date().toISOString(),
            sharedReadOnly: !(canEditGroupRecipes || recipe.ownerId === authUser.id),
          },
        ])[0]
        return [normalizedRecipe, ...prev]
      })
    }

    if (isGroupModalOpen) {
      void loadSelectedGroupActivity(selectedGroupId)
    }
  }

  async function removeRecipeFromSelectedGroup(recipe) {
    if (!hasSupabaseConfig || !supabase || !authUser?.id) {
      showMessage('Sign in to manage group recipes.', 'info')
      return
    }

    if (!isUuidLike(selectedGroupId) || !isUuidLike(recipe?.id)) {
      showMessage('Choose a group and recipe first.', 'info')
      return
    }

    if (!canRemoveRecipeFromSelectedGroup(recipe)) {
      showMessage('You do not have permission to remove this recipe from the group.', 'info')
      return
    }

    const { error } = await supabase
      .from('group_recipes')
      .delete()
      .eq('group_id', selectedGroupId)
      .eq('recipe_id', recipe.id)

    if (error) {
      showMessage(`Could not remove recipe from group: ${error.message}`, 'error')
      return
    }

    setGroupRecipes((prev) => prev.filter((item) => item.id !== recipe.id))
    if (isGroupModalOpen) {
      void loadSelectedGroupActivity(selectedGroupId)
    }
    showMessage(`Removed recipe from ${selectedGroup?.name || 'group'}.`, 'success')
  }

  const loadSelectedGroupMembers = useCallback(async (groupId = selectedGroupId) => {
    if (!hasSupabaseConfig || !supabase || !authUser?.id || !isUuidLike(groupId)) {
      setGroupMembers([])
      return
    }

    setGroupMembersLoading(true)

    try {
      const { data: memberProfiles, error } = await supabase.rpc('get_group_member_profiles', {
        target_group_id: groupId,
      })

      if (error) {
        showMessage(`Could not load group members: ${error.message}`, 'info')
        setGroupMembers([])
        return
      }

      const mappedMembers = Array.isArray(memberProfiles)
        ? memberProfiles
            .filter((row) => isUuidLike(row?.user_id))
            .map((row) => ({
              userId: row.user_id,
              role: row.role || 'viewer',
              username: row.username || '',
              displayName: row.display_name || '',
            }))
        : []

      await loadProfileSummaries(mappedMembers.map((member) => member.userId))

      setGroupMembers(mappedMembers)
    } finally {
      setGroupMembersLoading(false)
    }
  }, [authUser?.id, selectedGroupId])

  const loadSelectedGroupPendingInvites = useCallback(async (groupId = selectedGroupId) => {
    if (!hasSupabaseConfig || !supabase || !authUser?.id || !isUuidLike(groupId)) {
      setGroupPendingInvites([])
      return
    }

    setGroupInvitesLoading(true)

    try {
      const { data, error } = await supabase.rpc('get_group_pending_invites', {
        target_group_id: groupId,
      })

      if (error) {
        showMessage(`Could not load pending invites: ${error.message}`, 'info')
        setGroupPendingInvites([])
        return
      }

      const invites = Array.isArray(data)
        ? data.map((row) => ({
            id: row.id,
            invitedUserId: row.invited_user_id || '',
            role: row.role || 'viewer',
            token: row.token || '',
            createdAt: row.created_at || '',
            expiresAt: row.expires_at || '',
            invitedUsername: row.invited_username || '',
            invitedDisplayName: row.invited_display_name || '',
          }))
        : []

      await loadProfileSummaries(invites.map((invite) => invite.invitedUserId))

      setGroupPendingInvites(invites)
    } finally {
      setGroupInvitesLoading(false)
    }
  }, [authUser?.id, selectedGroupId])

  const loadSelectedGroupActivity = useCallback(async (groupId = selectedGroupId) => {
    if (!hasSupabaseConfig || !supabase || !authUser?.id || !isUuidLike(groupId)) {
      setGroupActivity([])
      return
    }

    setGroupActivityLoading(true)

    try {
      const { data, error } = await supabase.rpc('get_group_activity', {
        target_group_id: groupId,
        limit_count: 20,
      })

      if (error) {
        showMessage(`Could not load group activity: ${error.message}`, 'info')
        setGroupActivity([])
        return
      }

      const activity = Array.isArray(data)
        ? data.map((row, index) => ({
            id: `${row.activity_type || 'activity'}-${row.occurred_at || index}-${row.recipe_id || row.subject_user_id || row.actor_user_id || index}`,
            activityType: row.activity_type || 'activity',
            occurredAt: row.occurred_at || '',
            actorUserId: row.actor_user_id || '',
            actorUsername: row.actor_username || '',
            actorDisplayName: row.actor_display_name || '',
            subjectUserId: row.subject_user_id || '',
            subjectUsername: row.subject_username || '',
            subjectDisplayName: row.subject_display_name || '',
            recipeId: row.recipe_id || '',
            recipeName: row.recipe_name || '',
            role: row.role || '',
          }))
        : []

      await loadProfileSummaries(activity.flatMap((item) => [item.actorUserId, item.subjectUserId]))

      setGroupActivity(activity)
    } finally {
      setGroupActivityLoading(false)
    }
  }, [authUser?.id, selectedGroupId])

  useEffect(() => {
    if (!hasSupabaseConfig || !supabase || !authUser?.id) {
      return undefined
    }

    const refreshGroupState = () => {
      void loadGroups()
      if (isUuidLike(selectedGroupId)) {
        void loadGroupRecipes(selectedGroupId, selectedGroupRole, { reason: 'focus', quiet: true })
        if (isGroupModalOpen) {
          void loadSelectedGroupActivity(selectedGroupId)
        }
      }
    }

    const onVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        refreshGroupState()
      }
    }

    window.addEventListener('focus', onVisibilityOrFocus)
    document.addEventListener('visibilitychange', onVisibilityOrFocus)

    const channel = supabase.channel(`group-recipes-${authUser.id}-${selectedGroupId || 'none'}`)

    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'group_members', filter: `user_id=eq.${authUser.id}` }, () => {
      refreshGroupState()
    })

    if (isUuidLike(selectedGroupId)) {
      channel.on('postgres_changes', { event: '*', schema: 'public', table: 'group_recipes', filter: `group_id=eq.${selectedGroupId}` }, () => {
        void loadGroupRecipes(selectedGroupId, selectedGroupRole, { reason: 'realtime', quiet: true })
        if (isGroupModalOpen) {
          void loadSelectedGroupActivity(selectedGroupId)
        }
      })

      channel.on('postgres_changes', { event: '*', schema: 'public', table: 'group_invites', filter: `group_id=eq.${selectedGroupId}` }, () => {
        if (isGroupModalOpen) {
          void loadSelectedGroupPendingInvites(selectedGroupId)
          void loadSelectedGroupActivity(selectedGroupId)
        }
      })
    }

    channel.subscribe()

    return () => {
      window.removeEventListener('focus', onVisibilityOrFocus)
      document.removeEventListener('visibilitychange', onVisibilityOrFocus)
      void supabase.removeChannel(channel)
    }
  }, [authUser?.id, isGroupModalOpen, loadGroupRecipes, loadGroups, loadSelectedGroupActivity, loadSelectedGroupPendingInvites, recipeScope, selectedGroupId, selectedGroupRole])

  async function openGroupModal() {
    setIsGroupModalOpen(true)
    setGroupInviteLookup('')
    setGroupInviteResults([])
    await loadSelectedGroupMembers()
    await loadSelectedGroupPendingInvites()
    await loadSelectedGroupActivity()
  }

  function closeGroupModal() {
    setIsGroupModalOpen(false)
    setGroupInviteLookup('')
    setGroupInviteResults([])
    setGroupPendingInvites([])
  }

  async function handleCreateGroup(event) {
    event.preventDefault()

    if (!hasSupabaseConfig || !supabase || !authUser?.id) {
      showMessage('Sign in to create a group.', 'info')
      return
    }

    const name = groupNameDraft.trim()
    if (!name) {
      showMessage('Enter a group name first.', 'error')
      return
    }

    setGroupBusy(true)

    try {
      const { data: groupRow, error: groupError } = await supabase
        .from('groups')
        .insert({ name, created_by: authUser.id })
        .select('id,name,created_by,created_at')
        .single()

      if (groupError || !groupRow?.id) {
        showMessage(`Could not create group: ${groupError?.message || 'Unknown error'}`, 'error')
        return
      }

      const { error: membershipError } = await supabase.from('group_members').insert({
        group_id: groupRow.id,
        user_id: authUser.id,
        role: 'admin',
        added_by: authUser.id,
      })

      if (membershipError) {
        showMessage(`Group created, but membership setup failed: ${membershipError.message}`, 'info')
        return
      }

      setGroups((prev) => [...prev, groupRow].sort((a, b) => a.name.localeCompare(b.name)))
      setGroupMemberships((prev) => [...prev, { groupId: groupRow.id, role: 'admin' }])
      setSelectedGroupId(groupRow.id)
      setRecipeScope('group')
      setGroupNameDraft('')
      showMessage(`Group "${groupRow.name}" created. Invite members or add a recipe to get started.`, 'success')
    } finally {
      setGroupBusy(false)
    }
  }

  async function searchGroupInviteCandidates(event) {
    event.preventDefault()

    if (!hasSupabaseConfig || !supabase || !authUser?.id || !isUuidLike(selectedGroupId)) {
      showMessage('Select a group first.', 'info')
      return
    }

    const query = groupInviteLookup.trim().toLowerCase()
    if (!query) {
      showMessage('Enter a username to search.', 'error')
      return
    }

    setGroupBusy(true)

    try {
      const { data, error } = await supabase.rpc('search_profiles_for_sharing', {
        query_text: query,
        limit_count: 8,
      })

      if (error) {
        showMessage(`Could not search users: ${error.message}`, 'error')
        return
      }

      const existingIds = new Set(groupMembers.map((member) => member.userId))
      const normalized = Array.isArray(data)
        ? data
            .filter((row) => isUuidLike(row?.id) && !existingIds.has(row.id))
            .map((row) => ({
              id: row.id,
              username: (row.username || '').trim(),
              displayName: (row.display_name || '').trim(),
            }))
        : []

      const summaries = await loadProfileSummaries(normalized.map((row) => row.id))

      setGroupInviteResults(
        normalized.map((row) => ({
          ...row,
          avatarUrl: summaries[row.id]?.avatarUrl || '',
        })),
      )

      if (normalized.length === 0) {
        showMessage('No new users found for that username.', 'info')
      }
    } finally {
      setGroupBusy(false)
    }
  }

  async function addUserToSelectedGroup(recipient) {
    if (!hasSupabaseConfig || !supabase || !authUser?.id || !isUuidLike(selectedGroupId)) {
      return
    }

    if (!canAdminSelectedGroup) {
      showMessage('Only group admins can manage members.', 'info')
      return
    }

    setGroupBusy(true)

    try {
      const { data: existingInvites, error: existingError } = await supabase
        .from('group_invites')
        .select('id')
        .eq('group_id', selectedGroupId)
        .eq('invited_user_id', recipient.id)
        .is('accepted_at', null)
        .limit(1)

      if (existingError) {
        showMessage(`Could not check pending invites: ${existingError.message}`, 'error')
        return
      }

      if (Array.isArray(existingInvites) && existingInvites.length > 0) {
        showMessage('This user already has a pending invite for the group.', 'info')
        return
      }

      const { error } = await supabase.from('group_invites').insert({
        group_id: selectedGroupId,
        invited_user_id: recipient.id,
        role: groupInviteRole,
        invited_by: authUser.id,
      })

      if (error) {
        showMessage(`Could not send invite: ${error.message}`, 'error')
        return
      }

      setGroupInviteLookup('')
      setGroupInviteResults((prev) => prev.filter((row) => row.id !== recipient.id))
      await loadSelectedGroupPendingInvites(selectedGroupId)
      await loadSelectedGroupActivity(selectedGroupId)
      showMessage('Invite sent. They can join from their invite list after signing in.', 'success')
    } finally {
      setGroupBusy(false)
    }
  }

  async function resendGroupInvite(invite) {
    if (!hasSupabaseConfig || !supabase || !authUser?.id || !isUuidLike(selectedGroupId)) {
      return
    }

    if (!canAdminSelectedGroup) {
      showMessage('Only group admins can resend invites.', 'info')
      return
    }

    setGroupBusy(true)

    try {
      const { error } = await supabase
        .from('group_invites')
        .update({
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString(),
        })
        .eq('id', invite.id)
        .eq('group_id', selectedGroupId)

      if (error) {
        showMessage(`Could not resend invite: ${error.message}`, 'error')
        return
      }

      await loadSelectedGroupPendingInvites(selectedGroupId)
      await loadSelectedGroupActivity(selectedGroupId)
      showMessage('Invite refreshed and resent.', 'success')
    } finally {
      setGroupBusy(false)
    }
  }

  async function cancelGroupInvite(invite) {
    if (!hasSupabaseConfig || !supabase || !authUser?.id || !isUuidLike(selectedGroupId)) {
      return
    }

    if (!canAdminSelectedGroup) {
      showMessage('Only group admins can cancel invites.', 'info')
      return
    }

    setGroupBusy(true)

    try {
      const { error } = await supabase.from('group_invites').delete().eq('id', invite.id).eq('group_id', selectedGroupId)

      if (error) {
        showMessage(`Could not cancel invite: ${error.message}`, 'error')
        return
      }

      setGroupPendingInvites((prev) => prev.filter((item) => item.id !== invite.id))
      await loadSelectedGroupActivity(selectedGroupId)
      showMessage('Invite canceled.', 'success')
    } finally {
      setGroupBusy(false)
    }
  }

  async function deleteSelectedGroup() {
    if (!hasSupabaseConfig || !supabase || !authUser?.id || !isUuidLike(selectedGroupId)) {
      return
    }

    if (!canAdminSelectedGroup) {
      showMessage('Only group admins can delete groups.', 'info')
      return
    }

    const groupName = selectedGroup?.name || 'this group'
    const confirmed = window.confirm(`Delete ${groupName}? This removes the group, invites, and group recipe links for all members.`)
    if (!confirmed) {
      return
    }

    setGroupBusy(true)

    try {
      const { error } = await supabase.from('groups').delete().eq('id', selectedGroupId)

      if (error) {
        showMessage(`Could not delete group: ${error.message}`, 'error')
        return
      }

      setGroups((prev) => prev.filter((group) => group.id !== selectedGroupId))
      setGroupMemberships((prev) => prev.filter((item) => item.groupId !== selectedGroupId))
      setGroupMembers([])
      setGroupPendingInvites([])
      setGroupRecipes([])
      setSelectedGroupId('')
      setRecipeScope('mine')
      closeGroupModal()
      showMessage(`${groupName} deleted.`, 'success')
    } finally {
      setGroupBusy(false)
    }
  }

  async function updateGroupMemberRole(member, nextRole) {
    if (!hasSupabaseConfig || !supabase || !authUser?.id || !isUuidLike(selectedGroupId)) {
      return
    }

    if (!canAdminSelectedGroup) {
      showMessage('Only group admins can change roles.', 'info')
      return
    }

    setGroupBusy(true)

    try {
      const { error } = await supabase
        .from('group_members')
        .update({ role: nextRole })
        .eq('group_id', selectedGroupId)
        .eq('user_id', member.userId)

      if (error) {
        showMessage(`Could not update role: ${error.message}`, 'error')
        return
      }

      setGroupMembers((prev) => prev.map((item) => (item.userId === member.userId ? { ...item, role: nextRole } : item)))
      if (member.userId === authUser.id) {
        setGroupMemberships((prev) => prev.map((item) => (item.groupId === selectedGroupId ? { ...item, role: nextRole } : item)))
      }
      await loadSelectedGroupActivity(selectedGroupId)
      showMessage('Member role updated.', 'success')
    } finally {
      setGroupBusy(false)
    }
  }

  async function removeUserFromSelectedGroup(member) {
    if (!hasSupabaseConfig || !supabase || !authUser?.id || !isUuidLike(selectedGroupId)) {
      return
    }

    if (!canAdminSelectedGroup && member.userId !== authUser.id) {
      showMessage('Only group admins can remove other members.', 'info')
      return
    }

    if (member.userId === authUser.id && groupMembers.length === 1) {
      showMessage('You are the only member. Delete the group instead of leaving it.', 'info')
      return
    }

    const { error } = await supabase.rpc('remove_group_member', {
      target_group_id: selectedGroupId,
      target_user_id: member.userId,
    })

    if (error) {
      showMessage(`Could not remove member: ${error.message}`, 'error')
      return
    }

    setGroupMembers((prev) => prev.filter((item) => item.userId !== member.userId))

    if (member.userId === authUser.id) {
      setGroupMemberships((prev) => prev.filter((item) => item.groupId !== selectedGroupId))
      setGroups((prev) => prev.filter((group) => group.id !== selectedGroupId))
      setSelectedGroupId((prev) => (prev === selectedGroupId ? '' : prev))
      if (recipeScope === 'group') {
        setRecipeScope('mine')
      }
      closeGroupModal()
      showMessage('You left the group.', 'info')
      return
    }

    showMessage('Member removed from group.', 'success')
    if (isGroupModalOpen) {
      await loadSelectedGroupActivity(selectedGroupId)
    }
  }

  function openGroupInvitesModal() {
    setIsGroupInvitesModalOpen(true)
  }

  function closeGroupInvitesModal() {
    setIsGroupInvitesModalOpen(false)
  }

  async function acceptPendingGroupInvite(invite) {
    if (!hasSupabaseConfig || !supabase || !authUser?.id) {
      return
    }

    if (!invite?.token) {
      showMessage('This invite is missing a valid token.', 'error')
      return
    }

    setGroupInvitesLoading(true)

    try {
      const { data, error } = await supabase.rpc('accept_group_invite', {
        invite_token: invite.token,
      })

      if (error) {
        showMessage(error.message || 'Could not accept invite.', 'error')
        return
      }

      const accepted = Array.isArray(data) ? data[0] : data
      const acceptedGroupId = accepted?.group_id || invite.groupId
      const acceptedGroupName = accepted?.group_name || invite.groupName || 'Group'
      const acceptedRole = accepted?.role || invite.role || 'viewer'

      setPendingGroupInvites((prev) => prev.filter((item) => item.id !== invite.id))
      setGroups((prev) => {
        if (prev.some((group) => group.id === acceptedGroupId)) {
          return prev
        }

        const placeholder = {
          id: acceptedGroupId,
          name: acceptedGroupName,
          created_by: '',
          created_at: new Date().toISOString(),
        }
        return [...prev, placeholder].sort((a, b) => a.name.localeCompare(b.name))
      })
      setGroupMemberships((prev) => {
        if (prev.some((item) => item.groupId === acceptedGroupId)) {
          return prev
        }
        return [...prev, { groupId: acceptedGroupId, role: acceptedRole }]
      })
      setSelectedGroupId(acceptedGroupId)
      setRecipeScope('group')

      showMessage(`Joined ${acceptedGroupName}. You can now browse or add group recipes.`, 'success')
    } finally {
      setGroupInvitesLoading(false)
    }
  }

  async function declinePendingGroupInvite(invite) {
    if (!hasSupabaseConfig || !supabase || !authUser?.id) {
      return
    }

    setGroupInvitesLoading(true)

    try {
      const { error } = await supabase.from('group_invites').delete().eq('id', invite.id).eq('invited_user_id', authUser.id)

      if (error) {
        showMessage(error.message || 'Could not decline invite.', 'error')
        return
      }

      setPendingGroupInvites((prev) => prev.filter((item) => item.id !== invite.id))
      showMessage(`Declined invite to ${invite.groupName || 'group'}.`, 'info')
    } finally {
      setGroupInvitesLoading(false)
    }
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

      const profileMap = ids.length > 0 ? await loadProfileSummaries(ids) : {}

      const normalized = rows
        .map((row) => {
          const profile = profileMap[row.shared_with_user_id]
          return {
            userId: row.shared_with_user_id,
            canEdit: Boolean(row.can_edit),
            username: profile?.username || '',
            displayName: profile?.displayName || '',
            avatarUrl: profile?.avatarUrl || '',
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

      const summaries = await loadProfileSummaries(normalized.map((row) => row.id))

      setShareResults(
        normalized.map((row) => ({
          ...row,
          avatarUrl: summaries[row.id]?.avatarUrl || '',
        })),
      )

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
      showMessage(`Recipe shared with ${targetLabel}. They will see it in Shared With Me.`, 'success')
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
            emailRedirectTo: getAuthRedirectUrl(),
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
          showMessage('Account created. Check your inbox to confirm your email, then return to sign in.', 'info')
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

  async function handleRequestPasswordReset() {
    if (!hasSupabaseConfig || !supabase) {
      showMessage('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.', 'info')
      return
    }

    const email = authEmail.trim()
    if (!email) {
      showMessage('Enter your email first, then click Forgot Password.', 'info')
      return
    }

    setAuthBusy(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: getPasswordResetRedirectUrl(),
      })

      if (error) {
        showMessage(error.message, 'error')
        return
      }

      showMessage('Password reset email sent. Check your inbox and open the reset link.', 'info')
    } finally {
      setAuthBusy(false)
    }
  }

  async function handleCompletePasswordReset(event) {
    event.preventDefault()

    if (!hasSupabaseConfig || !supabase) {
      showMessage('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.', 'info')
      return
    }

    if (!authUser) {
      showMessage('Reset session missing. Open the password reset link from your email again.', 'error')
      return
    }

    const nextPassword = resetPasswordDraft.trim()
    const confirmPassword = resetPasswordConfirm.trim()

    if (nextPassword.length < 6) {
      showMessage('Use a password with at least 6 characters.', 'error')
      return
    }

    if (nextPassword !== confirmPassword) {
      showMessage('Passwords do not match.', 'error')
      return
    }

    setResetPasswordBusy(true)

    try {
      const { error } = await supabase.auth.updateUser({ password: nextPassword })

      if (error) {
        showMessage(error.message, 'error')
        return
      }

      setIsResetFlowActive(false)
      setResetPasswordDraft('')
      setResetPasswordConfirm('')
      setAuthMode('signin')
      setAuthReturnNotice({ type: 'success', text: 'Password updated. You can continue using Dish Depot.' })
      showMessage('Password updated successfully.', 'success')
    } finally {
      setResetPasswordBusy(false)
    }
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

      const refreshedProfile = await fetchFreshProfileRow(authUser.id).catch(() => null)
      if (refreshedProfile) {
        await applyProfileState(refreshedProfile)
      } else {
        await applyProfileState({
          display_name: profileDisplayName.trim() || '',
          username,
          avatar_url: profileAvatarValue.trim() || '',
        })
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
    clearCardScanSelection()

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
    clearCardScanSelection()
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
      return false
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

    return true
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
      setIsApiReachable(true)
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
        setIsApiReachable(false)
        if (!navigator.onLine) {
          networkStatusRef.current = false
          setIsOnline(false)
          showMessage('You are offline. URL extraction is unavailable right now.', 'info')
        } else {
          showMessage('The extraction service is currently unreachable. Please try again in a moment.', 'info')
        }
      } else {
        showMessage(failedMessage, 'error')
      }
      setExtractWarnings([])
      setExtractCandidate(null)
    } finally {
      setIsExtracting(false)
    }
  }

  async function handleCardScanFileChange(event) {
    const nextFile = event.target.files?.[0] || null
    setExtractWarnings([])
    setExtractCandidate(null)

    if (!nextFile) {
      clearCardScanSelection()
      return
    }

    try {
      setIsPreparingCardScan(true)
      const prepared = await optimizeCardScanFile(nextFile)
      setCardScanFile(prepared.file)
      setCardScanPreparationNote(prepared.note)
    } catch (error) {
      clearCardScanSelection()
      showMessage(error?.message || 'Could not prepare that recipe card image.', 'error')
    } finally {
      setIsPreparingCardScan(false)
    }
  }

  async function handleExtractFromCard() {
    if (!cardScanFile) {
      showMessage('Choose a recipe card image first.', 'error')
      return
    }

    if (!requireOnline('Recipe card scanning')) {
      return
    }

    try {
      setIsExtracting(true)
      setExtractWarnings([])
      setExtractCandidate(null)

      const body = new FormData()
      body.append('file', cardScanFile)

      const response = await fetch(EXTRACT_CARD_ENDPOINT, {
        method: 'POST',
        body,
      })

      const payload = await response.json().catch(() => null)
      if (!response.ok || !payload?.ok) {
        const message = payload?.error?.message || 'Could not read this recipe card'
        throw new Error(message)
      }

      const warnings = payload.meta?.warnings || []

      setExtractWarnings(warnings)
      setIsApiReachable(true)
      setExtractCandidate({
        data: payload.data,
        meta: payload.meta || null,
        warnings,
      })
      showMessage('Recipe card scanned. Review and apply.', 'success')
    } catch (error) {
      const failedMessage = error?.message || 'Recipe card scanning failed'
      const isNetworkFailure =
        error?.name === 'AbortError' ||
        failedMessage === 'Failed to fetch' ||
        failedMessage.toLowerCase().includes('network')

      if (isNetworkFailure) {
        setIsApiReachable(false)
        if (!navigator.onLine) {
          networkStatusRef.current = false
          setIsOnline(false)
          showMessage('You are offline. Recipe card scanning is unavailable right now.', 'info')
        } else {
          showMessage('The recipe scanning service is currently unreachable. Please try again in a moment.', 'info')
        }
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
    if (restoreShoppingDraft()) {
      return
    }

    const candidates = recipes
      .filter((recipe) => Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0)
      .map((recipe) => ({
        previewId: `shop-${recipe.id}`,
        recipe,
        selected: false,
      }))

    if (candidates.length === 0) {
      showMessage('Add recipes with ingredients to build a shopping list.', 'info')
      return
    }

    setShoppingCandidates(candidates)
    setShoppingChecklist({})
    setShoppingPantry({})
    setHidePantryItems(false)
    setShoppingMergeSelection({})
    setShoppingManualGroups([])
    setShoppingManualText('')
    setIsShoppingListOpen(true)
  }

  function closeShoppingListBuilder(options = {}) {
    const { preserveDraft = true } = options

    if (!preserveDraft) {
      clearSavedShoppingDraft()
    }

    setIsShoppingListOpen(false)
    setShoppingCandidates([])
    setShoppingChecklist({})
    setShoppingPantry({})
    setHidePantryItems(false)
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

  function toggleShoppingPantryItem(itemKey) {
    setShoppingPantry((prev) => ({
      ...prev,
      [itemKey]: !prev[itemKey],
    }))
  }

  function clearShoppingChecklist() {
    setShoppingChecklist({})
  }

  function clearShoppingPantry() {
    setShoppingPantry({})
    setHidePantryItems(false)
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
    setShoppingPantry((prev) => {
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
      if (hidePantryItems && shoppingPantry[item.key]) {
        return
      }
      const mark = shoppingChecklist[item.key] ? '[x]' : '[ ]'
      const pantryLabel = shoppingPantry[item.key] ? ' [pantry]' : ''
      lines.push(`${mark} ${item.amountLabel}${pantryLabel}`)
    })

    if (filteredVisibleUnresolvedItems.length > 0) {
      lines.push('')
      lines.push('Needs Review (not safely totaled):')
      filteredVisibleUnresolvedItems.forEach((item) => {
        const mark = shoppingChecklist[item.key] ? '[x]' : '[ ]'
        const pantryLabel = shoppingPantry[item.key] ? ' [pantry]' : ''
        lines.push(`${mark} ${item.text}${item.count > 1 ? ` (${item.count} recipes)` : ''}${pantryLabel}`)
      })
    }

    if (visibleManualShoppingGroups.length > 0) {
      lines.push('')
      lines.push('Manual Merge Items:')
      visibleManualShoppingGroups.forEach((group) => {
        const mark = shoppingChecklist[group.key] ? '[x]' : '[ ]'
        const pantryLabel = shoppingPantry[group.key] ? ' [pantry]' : ''
        lines.push(`${mark} ${group.text}${group.count > 1 ? ` (${group.count} lines)` : ''}${pantryLabel}`)
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

  function saveShoppingDraft() {
    try {
      localStorage.setItem(SHOPPING_LIST_DRAFT_KEY, JSON.stringify(buildShoppingDraftSnapshot(shoppingCandidates)))
      setHasSavedShoppingDraft(true)
      showMessage('Shopping list draft saved.', 'success')
    } catch {
      showMessage('Could not save this shopping list draft on this device.', 'info')
    }
  }

  function buildShoppingHistoryLabel(candidates) {
    const selectedNames = candidates
      .filter((candidate) => candidate.selected)
      .map((candidate) => candidate.recipe.name)

    if (selectedNames.length === 0) {
      return 'Untitled shopping list'
    }

    if (selectedNames.length === 1) {
      return selectedNames[0]
    }

    if (selectedNames.length === 2) {
      return `${selectedNames[0]} + ${selectedNames[1]}`
    }

    return `${selectedNames[0]} + ${selectedNames.length - 1} more`
  }

  function saveShoppingListToHistory() {
    const selectedCount = shoppingCandidates.filter((candidate) => candidate.selected).length
    if (selectedCount === 0) {
      showMessage('Select at least one recipe before saving a shopping list.', 'error')
      return
    }

    const snapshot = buildShoppingDraftSnapshot(shoppingCandidates)
    const entry = {
      id: `history:${Date.now()}:${Math.random().toString(16).slice(2)}`,
      label: buildShoppingHistoryLabel(shoppingCandidates),
      recipeCount: selectedCount,
      totalCount: combinedShoppingItems.length,
      unresolvedCount: visibleUnresolvedItems.length,
      pantryCount: pantryItemCount,
      snapshot,
      savedAt: new Date().toISOString(),
    }

    setShoppingHistory((prev) => {
      const next = [entry, ...prev].slice(0, 8)
      try {
        localStorage.setItem(SHOPPING_LIST_HISTORY_KEY, JSON.stringify(next))
      } catch {
        showMessage('Could not save shopping list history on this device.', 'info')
        return prev
      }
      showMessage('Shopping list saved to history.', 'success')
      return next
    })
  }

  function applyShoppingSnapshot(snapshot) {
    const selectedIds = new Set(Array.isArray(snapshot?.recipeIds) ? snapshot.recipeIds : [])
    const candidates = recipes
      .filter((recipe) => Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0)
      .map((recipe) => ({
        previewId: `shop-${recipe.id}`,
        recipe,
        selected: selectedIds.size === 0 ? false : selectedIds.has(recipe.id),
      }))

    if (candidates.length === 0) {
      return false
    }

    setShoppingCandidates(candidates)
    setShoppingChecklist(snapshot?.checklist && typeof snapshot.checklist === 'object' ? snapshot.checklist : {})
    setShoppingPantry(snapshot?.pantry && typeof snapshot.pantry === 'object' ? snapshot.pantry : {})
    setHidePantryItems(Boolean(snapshot?.hidePantryItems))
    setShoppingUnitSystem(snapshot?.unitSystem === 'metric' ? 'metric' : 'us')
    setShoppingMergeSelection(snapshot?.mergeSelection && typeof snapshot.mergeSelection === 'object' ? snapshot.mergeSelection : {})
    setShoppingManualGroups(Array.isArray(snapshot?.manualGroups) ? snapshot.manualGroups : [])
    setShoppingManualText(typeof snapshot?.manualText === 'string' ? snapshot.manualText : '')
    setShoppingManualEditingKey(typeof snapshot?.manualEditingKey === 'string' ? snapshot.manualEditingKey : '')
    setShoppingManualEditDraft(typeof snapshot?.manualEditDraft === 'string' ? snapshot.manualEditDraft : '')
    setIsShoppingListOpen(true)
    return true
  }

  function restoreShoppingHistoryEntry(entry) {
    const didRestore = applyShoppingSnapshot(entry?.snapshot)
    if (didRestore) {
      showMessage(`Restored ${entry.label || 'saved shopping list'}.`, 'success')
    }
  }

  function deleteShoppingHistoryEntry(entryId) {
    setShoppingHistory((prev) => {
      const next = prev.filter((entry) => entry.id !== entryId)
      try {
        localStorage.setItem(SHOPPING_LIST_HISTORY_KEY, JSON.stringify(next))
      } catch {
        showMessage('Could not update shopping list history on this device.', 'info')
        return prev
      }
      return next
    })
  }

  function clearSavedShoppingDraft({ closeBuilder = false } = {}) {
    try {
      localStorage.removeItem(SHOPPING_LIST_DRAFT_KEY)
      setHasSavedShoppingDraft(false)
    } catch {
      setHasSavedShoppingDraft(false)
    }

    if (closeBuilder) {
      closeShoppingListBuilder({ preserveDraft: false })
    }
  }

  const buildShoppingDraftSnapshot = useCallback((candidates) => ({
    recipeIds: candidates.filter((candidate) => candidate.selected).map((candidate) => candidate.recipe.id),
    checklist: shoppingChecklist,
    pantry: shoppingPantry,
    hidePantryItems,
    unitSystem: shoppingUnitSystem,
    mergeSelection: shoppingMergeSelection,
    manualGroups: shoppingManualGroups,
    manualText: shoppingManualText,
    manualEditingKey: shoppingManualEditingKey,
    manualEditDraft: shoppingManualEditDraft,
    savedAt: new Date().toISOString(),
  }), [hidePantryItems, shoppingChecklist, shoppingManualEditDraft, shoppingManualEditingKey, shoppingManualGroups, shoppingManualText, shoppingMergeSelection, shoppingPantry, shoppingUnitSystem])

  function restoreShoppingDraft() {
    try {
      const raw = localStorage.getItem(SHOPPING_LIST_DRAFT_KEY)
      if (!raw) {
        return false
      }

      const parsed = JSON.parse(raw)
      const didRestore = applyShoppingSnapshot(parsed)
      if (!didRestore) {
        return false
      }
      showMessage('Restored your last shopping list draft.', 'success')
      return true
    } catch {
      return false
    }
  }

  useEffect(() => {
    if (!isShoppingListOpen) {
      return
    }

    try {
      localStorage.setItem(SHOPPING_LIST_DRAFT_KEY, JSON.stringify(buildShoppingDraftSnapshot(shoppingCandidates)))
      setHasSavedShoppingDraft(true)
    } catch {
      setHasSavedShoppingDraft(false)
    }
  }, [buildShoppingDraftSnapshot, isShoppingListOpen, shoppingCandidates])

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

  function closeWelcomeModal() {
    setIsWelcomeModalOpen(false)
    try {
      localStorage.setItem(WELCOME_DISMISSED_KEY, '1')
    } catch (error) {
      console.warn('Could not persist welcome modal state', error)
    }
  }

  function closeToolsMenu() {
    setIsToolsMenuOpen(false)
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

      {isWelcomeModalOpen ? (
        <div className="modal show" role="dialog" aria-modal="true" aria-labelledby="welcome-modal-title" onClick={closeWelcomeModal}>
          <div className="modal-content welcome-modal" onClick={(event) => event.stopPropagation()}>
            <span className="close" onClick={closeWelcomeModal}>
              &times;
            </span>
            <h2 id="welcome-modal-title">Welcome to Dish Depot</h2>
            <p className="welcome-modal-subtitle">
              Dish Depot is your personal recipe home for collecting favorites, organizing meals, and planning what to cook next.
            </p>
            <ul className="welcome-modal-list">
              <li>Save recipe links or add custom recipes with your own ingredients and steps.</li>
              <li>Pin favorites, search quickly, and keep everything organized by category.</li>
              <li>Create Groups to share saved recipes with family, friends or event groups.</li>
              <li>Build a weekly meal plan and generate a shopping list from selected recipes.</li>
              <li>To <b>install</b> this app on your <b>iPhone</b>, click the 'Tools' button for more information.</li>
            </ul>
            <div className="welcome-modal-actions">
              <button className="btn btn-primary" type="button" onClick={closeWelcomeModal}>
                Get Started
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <header className="header">
        <div className="container header-container">
          <div className="header-content">
            <div className="header-brand">
              <img className="header-logo" src={dishDepotLogo} alt="Dish Depot logo" />
              <div className="header-title-block">
                <h1 className="header-title">Dish Depot</h1>
                <p className="header-tagline">Save. Organize. Cook.</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {authReturnNotice ? (
        <div className={`auth-return-banner auth-return-banner-${authReturnNotice.type}`} role="status" aria-live="polite">
          <div className="container auth-return-banner-inner">
            <span>{authReturnNotice.text}</span>
            <button className="auth-return-close" type="button" onClick={() => setAuthReturnNotice(null)} aria-label="Dismiss message">
              <i className="fas fa-times" />
            </button>
          </div>
        </div>
      ) : null}

      {!isOnline ? (
        <div className="app-offline-banner" role="status" aria-live="polite">
          <div className="container">You are offline. Cloud sync and URL extraction are temporarily unavailable.</div>
        </div>
      ) : null}

      <main className="main">
        <div className="container">
          <section className="controls">
            <div className="controls-row controls-row-primary">
              <div className="view-toggle-group" role="group" aria-label="App view">
                <button
                  className={`btn btn-small toolbar-tab ${activeView === 'recipes' ? 'btn-primary' : 'btn-secondary'}`}
                  type="button"
                  aria-pressed={activeView === 'recipes'}
                  onClick={() => setActiveView('recipes')}
                >
                  <i className="fas fa-th-large" />
                  Recipes
                </button>
                <button
                  className={`btn btn-small toolbar-tab ${activeView === 'planner' ? 'btn-primary' : 'btn-secondary'}`}
                  type="button"
                  aria-pressed={activeView === 'planner'}
                  onClick={() => setActiveView('planner')}
                >
                  <i className="fas fa-calendar-alt" />
                  Meal Planner
                </button>
              </div>

              <div className="controls-status-cluster">
                {hasSupabaseConfig && authUser ? (
                  <span
                    className={`auth-sync-pill ${isOnline ? 'auth-sync-pill-online' : 'auth-sync-pill-offline'}`}
                    aria-label={isOnline ? 'Cloud sync enabled' : 'Cloud sync unavailable while offline'}
                  >
                    <i className={`fas ${isOnline ? 'fa-cloud' : 'fa-cloud-slash'}`} />
                    <span className="auth-sync-label">{isOnline ? 'Sync On' : 'Sync Off'}</span>
                  </span>
                ) : null}

                {hasSupabaseConfig && authUser ? (
                  <button className="btn btn-secondary btn-small group-invites-pill toolbar-ghost-button" type="button" onClick={openGroupInvitesModal}>
                    <i className="fas fa-envelope-open-text" />
                    <span className="group-invites-label">Invites</span>
                    {pendingGroupInvites.length > 0 ? <span className="group-invites-count">{pendingGroupInvites.length}</span> : null}
                  </button>
                ) : null}

                {hasSupabaseConfig ? (
                  <button
                    className="auth-user-email auth-user-link"
                    type="button"
                    title={`Open account (${accountIdentityLabel})`}
                    onClick={openProfileModal}
                  >
                    {authUser && profileAvatarUrl ? (
                      <>
                        <img className="auth-user-avatar" src={profileAvatarUrl} alt="Profile avatar" />
                        {isOnline ? <span className="auth-user-label">{accountIdentityLabel}</span> : null}
                      </>
                    ) : (
                      <>
                        <i className="fas fa-user" />
                        {isOnline ? <span className="auth-user-label">{accountIdentityLabel}</span> : null}
                      </>
                    )}
                  </button>
                ) : (
                  <span className="auth-config-note">Cloud sync disabled</span>
                )}
              </div>
            </div>

            {activeView === 'recipes' ? (
              <>
                <div className="controls-row controls-row-search">
                  <div className="controls-search-wrap">
                    <div className="search-box search-box-prominent toolbar-search-box">
                      <label htmlFor="recipeSearchInput" className="visually-hidden">
                        Search recipes, ingredients, or notes
                      </label>
                      <input
                        id="recipeSearchInput"
                        type="text"
                        placeholder="Search recipes, ingredients, or notes..."
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                      />
                      <i className="fas fa-search" />
                    </div>
                  </div>

                  <div className="controls-primary-action">
                    {recipeScope !== 'shared' ? (
                      <button ref={inlineAddRecipeButtonRef} className="btn btn-primary btn-add-inline toolbar-primary-cta" type="button" onClick={() => openModal()}>
                        <i className="fas fa-plus" />
                        Add Recipe
                      </button>
                    ) : null}
                  </div>
                </div>

                <div className="controls-row controls-row-filters">
                  <div className="controls-filter-stack">
                    <div className="category-filter toolbar-select-field">
                      <label htmlFor="categoryFilterSelect" className="visually-hidden">
                        Filter by category
                      </label>
                      <select id="categoryFilterSelect" className="category-select" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
                        <option value="">All Categories</option>
                        {CATEGORY_OPTIONS.map((category) => (
                          <option key={category} value={category}>
                            {formatCategory(category)}
                          </option>
                        ))}
                      </select>
                      <i className="fas fa-filter" />
                    </div>

                    {hasSupabaseConfig && authUser ? (
                      <div className="scope-select-wrap toolbar-select-field" aria-label="Recipe scope">
                        <label htmlFor="recipeScopeSelect" className="visually-hidden">
                          Recipe scope
                        </label>
                        <select
                          id="recipeScopeSelect"
                          className="category-select recipe-scope-select"
                          value={recipeScope}
                          onChange={(event) => setRecipeScope(event.target.value)}
                        >
                          <option value="mine">My Recipes</option>
                          <option value="shared">Shared With Me</option>
                          <option value="group">Groups</option>
                        </select>
                      </div>
                    ) : null}

                    {recipeScope === 'group' ? (
                      <div className="group-scope-controls">
                        <label htmlFor="groupScopeSelect" className="visually-hidden">
                          Select active group
                        </label>
                        <select id="groupScopeSelect" className="category-select toolbar-group-select" value={selectedGroupId} onChange={(event) => setSelectedGroupId(event.target.value)}>
                          {groups.length === 0 ? <option value="">No groups yet</option> : null}
                          {groups.map((group) => (
                            <option key={group.id} value={group.id}>
                              {group.name}
                            </option>
                          ))}
                        </select>
                        <button className="btn btn-secondary btn-small toolbar-ghost-button" type="button" onClick={() => void openGroupModal()}>
                          <i className="fas fa-users" />
                          Manage Groups
                        </button>
                        {groupStatusText ? (
                          <div className={`group-refresh-indicator${isGroupRecipesRefreshing ? ' group-refresh-indicator-active' : ''}`} role="status" aria-live="polite">
                            <i className={`fas ${isGroupRecipesRefreshing ? 'fa-rotate fa-spin' : 'fa-signal'}`} />
                            <span>{groupStatusText}</span>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>

                  <div className="controls-utility-cluster">
                    <div className="results-count" aria-live="polite">
                      {filteredRecipes.length} recipe{filteredRecipes.length === 1 ? '' : 's'}
                    </div>

                    <button
                      className={`btn btn-secondary btn-small toolbar-ghost-button toolbar-compact-button ${isCompactCardView ? 'toolbar-compact-button-active' : ''}`}
                      type="button"
                      aria-pressed={isCompactCardView}
                      onClick={() => setIsCompactCardView((prev) => !prev)}
                    >
                      <i className={`fas ${isCompactCardView ? 'fa-toggle-on' : 'fa-toggle-off'}`} />
                      Compact View
                    </button>

                    <div ref={toolsMenuRef} className={`tools-menu${isToolsMenuOpen ? ' is-open' : ''}`}>
                      <button
                        className="btn btn-secondary btn-small toolbar-ghost-button toolbar-tools-button"
                        type="button"
                        aria-haspopup="menu"
                        aria-expanded={isToolsMenuOpen}
                        aria-controls="recipe-tools-menu"
                        onClick={() => setIsToolsMenuOpen((prev) => !prev)}
                      >
                        <i className="fas fa-sliders" />
                        Tools
                      </button>

                      {isToolsMenuOpen ? (
                        <div id="recipe-tools-menu" className="tools-menu-panel" aria-label="Recipe tools">
                          <ToolbarMenuSection title="Utilities">
                            <button
                              className={`btn tools-menu-button ${showPinnedOnly ? 'btn-pin-active' : 'btn-pin'}`}
                              type="button"
                              aria-pressed={showPinnedOnly}
                              onClick={() => setShowPinnedOnly((prev) => !prev)}
                            >
                              <i className={`fas ${showPinnedOnly ? 'fa-star' : 'fa-star-half-alt'}`} />
                              {showPinnedOnly ? 'Pinned Only' : 'All + Pinned'}
                            </button>
                            <button
                              className="btn btn-secondary tools-menu-button"
                              type="button"
                              onClick={() => {
                                closeToolsMenu()
                                randomizeRecipe()
                              }}
                            >
                              <i className="fas fa-dice" />
                              Random Recipe
                            </button>
                            <button
                              className="btn btn-secondary tools-menu-button"
                              type="button"
                              onClick={() => {
                                closeToolsMenu()
                                openShoppingListBuilder()
                              }}
                            >
                              <i className="fas fa-cart-shopping" />
                              Shopping List
                            </button>
                          </ToolbarMenuSection>

                          <ToolbarMenuSection title="Manage Recipes">
                            <button
                              className="btn btn-secondary tools-menu-button"
                              type="button"
                              onClick={() => {
                                closeToolsMenu()
                                void uploadLocalRecipesToCloud()
                              }}
                              disabled={!hasSupabaseConfig || isBulkUploading}
                            >
                              <i className="fas fa-cloud-arrow-up" />
                              {isBulkUploading ? 'Uploading...' : 'Upload Local to Cloud'}
                            </button>
                            <button
                              className="btn btn-secondary tools-menu-button"
                              type="button"
                              onClick={() => {
                                closeToolsMenu()
                                exportRecipes()
                              }}
                            >
                              <i className="fas fa-download" />
                              Export Recipes
                            </button>
                            <button
                              className="btn btn-secondary tools-menu-button"
                              type="button"
                              onClick={() => {
                                closeToolsMenu()
                                importInputRef.current?.click()
                              }}
                            >
                              <i className="fas fa-upload" />
                              Import Recipes
                            </button>
                          </ToolbarMenuSection>

                          {!isInstalledPwa ? (
                            <ToolbarMenuSection title="Display & Support">
                              <details className="ios-install-help tools-install-help">
                                <summary>
                                  <i className="fas fa-mobile-screen-button" />
                                  iPhone App Install Tips
                                </summary>
                                <p>Recommended: Use Brave as your default browser to help block ads and popups.</p>
                                <ol>
                                  <li>When you want to install this app, open this website in Safari on your iPhone.</li>
                                  <li>Tap the button with three dots on the bottom right.</li>
                                  <li>Tap 'Share' (square with the up arrow).</li>
                                  <li>Tap 'More'.</li>
                                  <li>Select Add to Home Screen.</li>
                                  <li>Tap Add to finish.</li>
                                </ol>
                              </details>
                            </ToolbarMenuSection>
                          ) : null}

                          <ToolbarMenuSection title="Danger Zone" danger>
                            <button
                              className="btn btn-danger tools-menu-button tools-menu-button-danger"
                              type="button"
                              onClick={() => {
                                closeToolsMenu()
                                deleteAllRecipes()
                              }}
                            >
                              <i className="fas fa-trash-alt" />
                              Delete All Recipes
                            </button>
                          </ToolbarMenuSection>
                        </div>
                      ) : null}
                    </div>

                    <input
                      ref={importInputRef}
                      type="file"
                      accept=".json"
                      style={{ display: 'none' }}
                      onChange={handleImportFile}
                    />
                  </div>
                </div>
              </>
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
                  const recipeOriginBadges = getRecipeOriginBadges(recipe)
                  const recipeProvenanceEntries = getRecipeProvenanceEntries(recipe)

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
                        {recipeOriginBadges.length > 0 ? (
                          <div className="recipe-origin-badges">
                            {recipeOriginBadges.map((badge) => (
                              <span key={`${recipe.id}-${badge.label}`} className={`recipe-origin-badge recipe-origin-badge-${badge.tone}`}>
                                <i className={`fas ${badge.icon}`} />
                                {badge.label}
                              </span>
                            ))}
                          </div>
                        ) : null}
                        {recipeProvenanceEntries.length > 0 ? (
                          <div className="recipe-provenance-list">
                            {recipeProvenanceEntries.map((entry) => (
                              <div key={`${recipe.id}-${entry.key}`} className="recipe-provenance-item">
                                <span className="recipe-provenance-label">{entry.label}</span>
                                <IdentityBlock
                                  displayName={entry.displayName}
                                  username={entry.username}
                                  avatarUrl={entry.avatarUrl}
                                  fallback={entry.fallback}
                                  meta={entry.meta}
                                  tone={entry.tone}
                                  compact
                                />
                              </div>
                            ))}
                          </div>
                        ) : null}
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

                      <div className={`recipe-body ${isCompactCardView ? 'recipe-body-compact' : ''}`}>
                        {recipe.image ? <img src={recipe.image} alt={recipe.name} className="recipe-image" /> : null}

                        {!isCompactCardView && recipe.notes ? <p className="recipe-notes">{recipe.notes}</p> : null}

                        {!isCompactCardView && hasDetailedRecipe ? (
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
                          {canShareRecipe(recipe) && hasSupabaseConfig && authUser ? (
                            <button
                              className="btn btn-small btn-secondary"
                              type="button"
                              aria-label="Share recipe"
                              title="Share recipe"
                              onClick={(event) => {
                                event.stopPropagation()
                                openShareModal(recipe)
                              }}
                            >
                              <i className="fas fa-share-nodes" />
                              <span className="visually-hidden">Share</span>
                            </button>
                          ) : null}
                          {recipeScope !== 'group' && hasSupabaseConfig && authUser && isUuidLike(selectedGroupId) ? (
                            <button
                              className="btn btn-small btn-secondary"
                              type="button"
                              aria-label="Add recipe to selected group"
                              title={canContributeToSelectedGroup ? `Add to ${selectedGroup?.name || 'group'}` : 'No permission to contribute'}
                              onClick={(event) => {
                                event.stopPropagation()
                                void addRecipeToSelectedGroup(recipe)
                              }}
                              disabled={!canContributeToSelectedGroup}
                            >
                              <i className="fas fa-users" />
                              <span className="visually-hidden">Add to Group</span>
                            </button>
                          ) : null}
                          {recipeScope === 'group' ? (
                            <button
                              className="btn btn-small btn-secondary"
                              type="button"
                              aria-label="Remove recipe from selected group"
                              title={canRemoveRecipeFromSelectedGroup(recipe) ? `Remove from ${selectedGroup?.name || 'group'}` : 'No permission to remove'}
                              onClick={(event) => {
                                event.stopPropagation()
                                void removeRecipeFromSelectedGroup(recipe)
                              }}
                              disabled={!canRemoveRecipeFromSelectedGroup(recipe)}
                            >
                              <i className="fas fa-user-minus" />
                              <span className="visually-hidden">Remove from Group</span>
                            </button>
                          ) : null}
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
                              {recipeScope !== 'group' ? (
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
                              ) : null}
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
                {recipeScope === 'shared' ? (
                  <EmptyStateCard
                    icon="fa-share-nodes"
                    title="No shared recipes yet"
                    description="When someone shares a recipe with you, it will appear here with the right editing permissions."
                    action={
                      <button className="btn btn-secondary" type="button" onClick={() => setRecipeScope('mine')}>
                        <i className="fas fa-utensils" />
                        Back to My Recipes
                      </button>
                    }
                  />
                ) : recipeScope === 'group' ? (
                  groups.length === 0 ? (
                    <EmptyStateCard
                      icon="fa-users"
                      title="No groups yet"
                      description="Create a group to share recipes with family, friends, or event teams. Once it exists, you can invite members and start contributing recipes together."
                      action={
                        <button className="btn btn-primary" type="button" onClick={() => void openGroupModal()}>
                          <i className="fas fa-users" />
                          Create Your First Group
                        </button>
                      }
                    />
                  ) : (
                    <EmptyStateCard
                      icon="fa-book-open"
                      title="No group recipes yet"
                      description={`Nothing has been added to ${selectedGroup?.name || 'this group'} yet. Add an existing recipe or create a new one, then share it with the group.`}
                      action={
                        <div className="empty-state-action-row">
                          <button className="btn btn-primary" type="button" onClick={() => openModal()}>
                            <i className="fas fa-plus" />
                            Add a Recipe
                          </button>
                          <button className="btn btn-secondary" type="button" onClick={() => void openGroupModal()}>
                            <i className="fas fa-users-gear" />
                            Manage Group
                          </button>
                        </div>
                      }
                    />
                  )
                ) : recipes.length > 0 ? (
                  <EmptyStateCard
                    icon="fa-magnifying-glass"
                    title="No recipes found"
                    description="Try changing your search terms, clearing the category filter, or switching off pinned-only mode."
                    action={
                      <button
                        className="btn btn-secondary"
                        type="button"
                        onClick={() => {
                          setSearchTerm('')
                          setCategoryFilter('')
                          setShowPinnedOnly(false)
                        }}
                      >
                        <i className="fas fa-rotate-left" />
                        Clear Filters
                      </button>
                    }
                  />
                ) : (
                  <EmptyStateCard
                    icon="fa-cookie-bite"
                    title="No recipes yet"
                    description="Start your collection with a recipe link, a scanned card, or a custom family favorite. Dish Depot will help you organize the rest."
                    action={
                      <div className="empty-state-action-row">
                        <button className="btn btn-primary" type="button" onClick={() => openModal()}>
                          <i className="fas fa-plus" />
                          Add Your First Recipe
                        </button>
                        <button className="btn btn-secondary" type="button" onClick={() => setIsWelcomeModalOpen(true)}>
                          <i className="fas fa-circle-info" />
                          See What Dish Depot Can Do
                        </button>
                      </div>
                    }
                  />
                )}
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
                <EmptyStateCard
                  icon="fa-calendar-plus"
                  title="Your meal plan starts with recipes"
                  description="Add at least one recipe first, then you can drop it into breakfast, lunch, or dinner for the week."
                  action={
                    <button className="btn btn-primary" type="button" onClick={() => setActiveView('recipes')}>
                      <i className="fas fa-arrow-left" />
                      Go to Recipes
                    </button>
                  }
                  compact
                />
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
        <AppErrorBoundary scope="modal" onReset={closeFocusedRecipe}>
          <Suspense fallback={<ModalLoadingFallback />}>
            <FocusedRecipeModal
              focusedRecipe={focusedRecipe}
              closeFocusedRecipe={closeFocusedRecipe}
              getRecipeOriginBadges={getRecipeOriginBadges}
              getRecipeProvenanceEntries={getRecipeProvenanceEntries}
              categoriesMap={CATEGORIES}
              canShareRecipe={canShareRecipe}
              hasSupabaseConfig={hasSupabaseConfig}
              authUser={authUser}
              openShareModal={openShareModal}
              isUuidLike={isUuidLike}
              selectedGroupId={selectedGroupId}
              addRecipeToSelectedGroup={addRecipeToSelectedGroup}
              canContributeToSelectedGroup={canContributeToSelectedGroup}
              selectedGroup={selectedGroup}
              recipeScope={recipeScope}
              removeRecipeFromSelectedGroup={removeRecipeFromSelectedGroup}
              canRemoveRecipeFromSelectedGroup={canRemoveRecipeFromSelectedGroup}
              visitRecipe={visitRecipe}
              copyRecipeUrl={copyRecipeUrl}
              printRecipesAsPdf={printRecipesAsPdf}
              canManageRecipe={canManageRecipe}
              togglePinnedRecipe={togglePinnedRecipe}
              openModal={openModal}
              handleDeleteRecipe={handleDeleteRecipe}
            />
          </Suspense>
        </AppErrorBoundary>
      ) : null}

      {isModalOpen ? (
        <AppErrorBoundary scope="modal" onReset={closeModal}>
          <Suspense fallback={<ModalLoadingFallback />}>
            <AddRecipeModal
              currentEditingId={currentEditingId}
              currentRecipeType={currentRecipeType}
              setRecipeCreationMode={setRecipeCreationMode}
              handleSubmit={handleSubmit}
              form={form}
              setForm={setForm}
              handleExtractFromUrl={handleExtractFromUrl}
              isExtracting={isExtracting}
              isOnline={isOnline}
              isApiReachable={isApiReachable}
              cardScanInputRef={cardScanInputRef}
              isPreparingCardScan={isPreparingCardScan}
              handleCardScanFileChange={handleCardScanFileChange}
              cardScanFile={cardScanFile}
              cardScanPreviewUrl={cardScanPreviewUrl}
              cardScanPreparationNote={cardScanPreparationNote}
              handleExtractFromCard={handleExtractFromCard}
              extractCandidate={extractCandidate}
              extractReviewSummary={extractReviewSummary}
              extractFieldReview={extractFieldReview}
              extractWarnings={extractWarnings}
              applyExtractCandidate={applyExtractCandidate}
              discardExtractCandidate={discardExtractCandidate}
              updateRecipeFormField={updateRecipeFormField}
              applyRecipeFieldCleanup={applyRecipeFieldCleanup}
              categoryOptions={CATEGORY_OPTIONS}
              formatCategory={formatCategory}
              toggleCategory={toggleCategory}
              hasSupabaseConfig={hasSupabaseConfig}
              closeModal={closeModal}
            />
          </Suspense>
        </AppErrorBoundary>
      ) : null}

      {isProfileModalOpen ? (
        <div className="modal show profile-modal-overlay" role="dialog" aria-modal="true" onClick={closeProfileModal}>
          <div className="modal-content profile-modal" onClick={(event) => event.stopPropagation()}>
            <span className="close" onClick={closeProfileModal}>
              &times;
            </span>
            <h2>Profile</h2>
            <div className="profile-theme-row">
              <span className="profile-theme-label">Theme</span>
              <label className="theme-switch" aria-label="Toggle dark mode">
                <input type="checkbox" checked={theme === 'dark'} onChange={toggleTheme} />
                <span className="theme-switch-track">
                  <span className="theme-switch-knob">
                    <i className={`fas ${theme === 'dark' ? 'fa-moon' : 'fa-sun'}`} />
                  </span>
                </span>
                <span className="theme-switch-label">{theme === 'dark' ? 'Dark' : 'Light'}</span>
              </label>
            </div>
            {isResetFlowActive ? (
              <>
                <p className="profile-modal-subtitle">Set a new password for your Dish Depot account.</p>

                <form className="profile-auth-form" onSubmit={handleCompletePasswordReset}>
                  <div className="auth-input-row profile-auth-fields">
                    <input
                      type="password"
                      value={resetPasswordDraft}
                      onChange={(event) => setResetPasswordDraft(event.target.value)}
                      placeholder="New password"
                      autoComplete="new-password"
                      minLength={6}
                      required
                    />
                    <input
                      type="password"
                      value={resetPasswordConfirm}
                      onChange={(event) => setResetPasswordConfirm(event.target.value)}
                      placeholder="Confirm new password"
                      autoComplete="new-password"
                      minLength={6}
                      required
                    />
                  </div>

                  <div className="profile-form-actions">
                    <button
                      className="btn btn-secondary"
                      type="button"
                      onClick={() => {
                        setIsResetFlowActive(false)
                        setResetPasswordDraft('')
                        setResetPasswordConfirm('')
                      }}
                      disabled={resetPasswordBusy}
                    >
                      Cancel
                    </button>
                    <button className="btn btn-primary" type="submit" disabled={resetPasswordBusy}>
                      {resetPasswordBusy ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </form>
              </>
            ) : authUser ? (
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
                    {authMode === 'signin' ? (
                      <button className="btn btn-secondary" type="button" onClick={() => void handleRequestPasswordReset()} disabled={authBusy}>
                        Forgot Password?
                      </button>
                    ) : null}
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

      {isGroupModalOpen ? (
        <div className="modal show share-modal-overlay" role="dialog" aria-modal="true" onClick={closeGroupModal}>
          <div className="modal-content share-modal" onClick={(event) => event.stopPropagation()}>
            <span className="close" onClick={closeGroupModal}>
              &times;
            </span>
            <h2>Groups</h2>
            <p className="share-modal-subtitle">Create and manage collaborative groups for shared recipes.</p>
            <p className="share-helper-note">Sections below can be expanded or collapsed to keep things focused.</p>

            <details className="modal-section" open>
              <summary>Create Group</summary>
              <form className="share-form" onSubmit={handleCreateGroup}>
                <div className="form-group">
                  <label htmlFor="groupNameInput">Group Name</label>
                  <div className="share-lookup-row">
                    <input
                      id="groupNameInput"
                      type="text"
                      value={groupNameDraft}
                      onChange={(event) => setGroupNameDraft(event.target.value)}
                      placeholder="The Johnson Family"
                    />
                    <button className="btn btn-secondary" type="submit" disabled={groupBusy}>
                      {groupBusy ? 'Creating...' : 'Create'}
                    </button>
                  </div>
                </div>
              </form>
            </details>

            {groups.length > 0 ? (
              <details className="modal-section" open>
                <summary>Selected Group</summary>
                <div className="form-group">
                  <label htmlFor="groupSelectInModal">Choose Group</label>
                  <select
                    id="groupSelectInModal"
                    value={selectedGroupId}
                    onChange={(event) => {
                      const nextGroupId = event.target.value
                      setSelectedGroupId(nextGroupId)
                      setGroupMembers([])
                      setGroupPendingInvites([])
                      setGroupActivity([])
                      void loadSelectedGroupMembers(nextGroupId)
                      void loadSelectedGroupPendingInvites(nextGroupId)
                      void loadSelectedGroupActivity(nextGroupId)
                    }}
                  >
                    {groups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                </div>
              </details>
            ) : null}

            {isUuidLike(selectedGroupId) ? (
              <>
                <details className="modal-section" open>
                  <summary>Invite Members</summary>
                  <form className="share-form" onSubmit={searchGroupInviteCandidates}>
                    <div className="form-group">
                      <label htmlFor="groupInviteLookup">Send Invite by Username</label>
                      <p className="share-helper-note">Invited users will be able to accept or decline before joining.</p>
                      <div className="share-lookup-row">
                        <input
                          id="groupInviteLookup"
                          type="text"
                          value={groupInviteLookup}
                          onChange={(event) => setGroupInviteLookup(event.target.value.toLowerCase())}
                          placeholder="chefmaria"
                          autoComplete="off"
                          disabled={!canAdminSelectedGroup}
                        />
                        <select value={groupInviteRole} onChange={(event) => setGroupInviteRole(event.target.value)} disabled={!canAdminSelectedGroup}>
                          {GROUP_ROLE_OPTIONS.map((role) => (
                            <option key={role} value={role}>
                              {`${GROUP_ROLE_LABELS[role]} — ${GROUP_ROLE_DESCRIPTIONS[role]}`}
                            </option>
                          ))}
                        </select>
                        <button className="btn btn-secondary" type="submit" disabled={groupBusy || !canAdminSelectedGroup}>
                          {groupBusy ? 'Searching...' : 'Find User'}
                        </button>
                      </div>
                    </div>
                  </form>

                  {groupInviteResults.length > 0 ? (
                    <div className="share-results" aria-label="Group invite results">
                        {groupInviteResults.map((result) => (
                          <div key={result.id} className="share-result-item">
                            <IdentityBlock
                              displayName={result.displayName}
                              username={result.username}
                              avatarUrl={result.avatarUrl}
                              fallback={result.id || 'Dish Depot user'}
                              meta="Ready to invite"
                              tone="search"
                            />
                            <button className="btn btn-secondary" type="button" onClick={() => void addUserToSelectedGroup(result)} disabled={!canAdminSelectedGroup || groupBusy}>
                              Send Invite
                            </button>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </details>

                <details className="modal-section" open>
                  <summary>Pending Invites</summary>
                  <section className="share-existing" aria-label="Pending invites for selected group">
                    {groupInvitesLoading ? <p className="share-empty">Loading pending invites...</p> : null}
                    {!groupInvitesLoading && groupPendingInvites.length === 0 ? (
                      <EmptyStateCard
                        icon="fa-paper-plane"
                        title="No pending invites"
                        description="Invite someone by username to bring collaborators into this group. New invites will appear here until they are accepted or canceled."
                        compact
                      />
                    ) : null}
                    {!groupInvitesLoading && groupPendingInvites.length > 0 ? (
                      <div className="share-existing-list">
                        {groupPendingInvites.map((invite) => (
                          <div key={invite.id} className="share-existing-item">
                            <IdentityBlock
                              {...getIdentityProps({
                                userId: invite.invitedUserId,
                                displayName: invite.invitedDisplayName,
                                username: invite.invitedUsername,
                                fallback: invite.invitedUserId || 'Invited member',
                              })}
                              meta={`${GROUP_ROLE_LABELS[invite.role] || invite.role} · ${formatInviteExpiry(invite.expiresAt)}`}
                              tone="invite"
                            />
                            <div className="share-existing-actions">
                              <button className="btn btn-secondary" type="button" onClick={() => void resendGroupInvite(invite)} disabled={!canAdminSelectedGroup || groupBusy}>
                                Resend
                              </button>
                              <button className="btn btn-danger" type="button" onClick={() => void cancelGroupInvite(invite)} disabled={!canAdminSelectedGroup || groupBusy}>
                                Cancel
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </section>
                </details>

                <details className="modal-section" open>
                  <summary>Members</summary>
                  <section className="share-existing" aria-label="Group members">
                    {groupMembersLoading ? <p className="share-empty">Loading members...</p> : null}
                    {!groupMembersLoading && groupMembers.length === 0 ? (
                      <EmptyStateCard
                        icon="fa-user-group"
                        title="No members yet"
                        description="Invite people into this group so they can browse, contribute, and help manage shared recipes."
                        compact
                      />
                    ) : null}
                    {!groupMembersLoading && groupMembers.length > 0 ? (
                      <div className="share-existing-list">
                        {groupMembers.map((member) => (
                          <div key={member.userId} className="share-existing-item">
                            <IdentityBlock
                              {...getIdentityProps({
                                userId: member.userId,
                                displayName: member.displayName,
                                username: member.username,
                                fallback: member.userId === authUser?.id ? 'You' : member.userId,
                              })}
                              meta={`${GROUP_ROLE_LABELS[member.role] || member.role}${member.userId === authUser?.id ? ' · You' : ''}`}
                              tone={member.userId === authUser?.id ? 'self' : 'member'}
                            />
                            <div className="share-existing-actions">
                              <select
                                value={member.role}
                                onChange={(event) => void updateGroupMemberRole(member, event.target.value)}
                                disabled={!canAdminSelectedGroup || groupBusy || member.userId === authUser?.id}
                              >
                                {GROUP_ROLE_OPTIONS.map((role) => (
                                  <option key={role} value={role}>
                                    {`${GROUP_ROLE_LABELS[role]} — ${GROUP_ROLE_DESCRIPTIONS[role]}`}
                                  </option>
                                ))}
                              </select>
                              {!(member.userId === authUser?.id && groupMembers.length === 1) ? (
                                <button
                                  className="btn btn-danger"
                                  type="button"
                                  onClick={() => void removeUserFromSelectedGroup(member)}
                                  disabled={groupBusy || (!canAdminSelectedGroup && member.userId !== authUser?.id)}
                                >
                                  {member.userId === authUser?.id ? 'Leave' : 'Remove'}
                                </button>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </section>
                </details>

                <details className="modal-section" open>
                  <summary>Recent Activity</summary>
                  <section className="group-activity-list" aria-label="Recent group activity">
                    {groupActivityLoading ? <p className="share-empty">Loading activity...</p> : null}
                    {!groupActivityLoading && groupActivity.length === 0 ? (
                      <EmptyStateCard
                        icon="fa-clock-rotate-left"
                        title="No activity yet"
                        description="Invite members or add recipes to this group. Dish Depot will keep the recent activity feed here so everyone can follow along."
                        compact
                      />
                    ) : null}
                    {!groupActivityLoading && groupActivity.length > 0 ? (
                      <div className="group-activity-items">
                        {groupActivity.map((activity) => {
                          const activityPresentation = describeGroupActivityItem(activity)
                          const activityMeta = [activityPresentation.detail]
                          const identity = getIdentityProps({
                            userId: activity.actorUserId || activity.subjectUserId,
                            displayName: activity.actorDisplayName || activity.subjectDisplayName,
                            username: activity.actorUsername || activity.subjectUsername,
                            fallback: activity.actorUserId || activity.subjectUserId || 'Member',
                          })
                          if (activity.actorDisplayName || activity.actorUsername) {
                            activityMeta.push(`By ${activity.actorDisplayName || `@${activity.actorUsername}`}`)
                          }
                          return (
                            <article key={activity.id} className="group-activity-item">
                              <div className="group-activity-identity">
                                <IdentityAvatar
                                  displayName={identity.displayName}
                                  username={identity.username}
                                  avatarUrl={identity.avatarUrl}
                                  fallback={identity.fallback}
                                  tone="activity"
                                />
                                <span className="group-activity-type-badge" aria-hidden="true">
                                  <i className={`fas ${activityPresentation.icon}`} />
                                </span>
                              </div>
                              <div className="group-activity-content">
                                <strong>{activityPresentation.title}</strong>
                                <small>{activityMeta.join(' · ')}</small>
                              </div>
                              <time className="group-activity-time" dateTime={activity.occurredAt || undefined}>
                                {formatRelativeTime(activity.occurredAt)}
                              </time>
                            </article>
                          )
                        })}
                      </div>
                    ) : null}
                  </section>
                </details>

                {canAdminSelectedGroup ? (
                  <details className="modal-section">
                    <summary>Danger Zone</summary>
                    <div className="share-form-actions group-danger-zone">
                      <button className="btn btn-danger" type="button" onClick={() => void deleteSelectedGroup()} disabled={groupBusy}>
                        <i className="fas fa-trash" />
                        Delete Group
                      </button>
                    </div>
                  </details>
                ) : null}
              </>
            ) : null}
          </div>
        </div>
      ) : null}

      {isGroupInvitesModalOpen ? (
        <div className="modal show share-modal-overlay" role="dialog" aria-modal="true" onClick={closeGroupInvitesModal}>
          <div className="modal-content share-modal" onClick={(event) => event.stopPropagation()}>
            <span className="close" onClick={closeGroupInvitesModal}>
              &times;
            </span>
            <h2>Group Invites</h2>
            <p className="share-modal-subtitle">Accept or decline invitations to join collaborative groups.</p>

            {groupInvitesLoading ? <p className="share-empty">Loading invites...</p> : null}
            {!groupInvitesLoading && pendingGroupInvites.length === 0 ? (
              <EmptyStateCard
                icon="fa-envelope-open-text"
                title="No pending invites right now"
                description="When another Dish Depot user invites you into a group, it will appear here so you can accept or decline it."
                compact
              />
            ) : null}

            {!groupInvitesLoading && pendingGroupInvites.length > 0 ? (
              <div className="share-existing-list" aria-label="Pending group invites">
                {pendingGroupInvites.map((invite) => (
                  <div key={invite.id} className="share-existing-item">
                    <div className="share-existing-item-shell">
                        <IdentityBlock
                          {...getIdentityProps({
                            userId: invite.invitedBy,
                            displayName: invite.inviterDisplayName,
                            username: invite.inviterUsername,
                            fallback: 'Group invite',
                          })}
                          meta={`Invited you to ${invite.groupName || 'Group'}`}
                          tone="invite"
                        />
                        <div className="share-existing-meta-block">
                          <strong>{invite.groupName || 'Group'}</strong>
                          <small>
                            {GROUP_ROLE_LABELS[invite.role] || invite.role} · {formatInviteExpiry(invite.expiresAt)}
                          </small>
                          <small>Sent: {formatInviteTimestamp(invite.createdAt)}</small>
                        </div>
                      </div>
                    <div className="share-existing-actions">
                      <button className="btn btn-secondary" type="button" onClick={() => void acceptPendingGroupInvite(invite)} disabled={groupInvitesLoading}>
                        Accept
                      </button>
                      <button className="btn btn-danger" type="button" onClick={() => void declinePendingGroupInvite(invite)} disabled={groupInvitesLoading}>
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
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

            <details className="modal-section" open>
              <summary>Find Recipient</summary>
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
                        <IdentityBlock
                          displayName={result.displayName}
                          username={result.username}
                          avatarUrl={result.avatarUrl}
                          fallback="Dish Depot user"
                          meta="Ready to share"
                          tone="search"
                        />
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
              </form>
            </details>

            <details className="modal-section" open>
              <summary>Currently Shared With</summary>
              <section className="share-existing" aria-label="Current shares">
                {shareRecipientsLoading ? <p className="share-empty">Loading shares...</p> : null}

                {!shareRecipientsLoading && shareRecipients.length === 0 ? (
                  <EmptyStateCard
                    icon="fa-user-plus"
                    title="No recipients yet"
                    description="Search for a Dish Depot username above to share this recipe. You can make it view-only or allow editing."
                    compact
                  />
                ) : null}

                {!shareRecipientsLoading && shareRecipients.length > 0 ? (
                  <div className="share-existing-list">
                    {shareRecipients.map((recipient) => (
                      <div key={recipient.userId} className="share-existing-item">
                        <IdentityBlock
                          displayName={recipient.displayName}
                          username={recipient.username}
                          avatarUrl={recipient.avatarUrl}
                          fallback={recipient.userId || 'Shared user'}
                          meta={recipient.canEdit ? 'Can edit this recipe' : 'View only'}
                          tone={recipient.canEdit ? 'editable' : 'default'}
                        />

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
            </details>

            <div className="share-form-actions">
              <button className="btn btn-secondary" type="button" onClick={closeShareModal}>
                Close
              </button>
            </div>
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
              Start by selecting recipes, then Dish Depot will organize the list into grocery-style sections.
            </p>

            <div className="shopping-list-toolbar">
              <div className="shopping-list-meta-pills">
                <span className="shopping-list-meta-pill">Recipes selected: {selectedShoppingCount}</span>
                <span className="shopping-list-meta-pill">Combined items: {combinedShoppingItems.length}</span>
                {pantryItemCount > 0 ? <span className="shopping-list-meta-pill">Pantry items: {pantryItemCount}</span> : null}
                {hasSavedShoppingDraft ? <span className="shopping-list-meta-pill">Draft saved on this device</span> : null}
                {shoppingHistory.length > 0 ? <span className="shopping-list-meta-pill">Saved lists: {shoppingHistory.length}</span> : null}
              </div>
              <div className="shopping-list-toolbar-actions">
                <button className="btn btn-secondary btn-small" type="button" onClick={saveShoppingDraft}>
                  Save Draft
                </button>
                <button className="btn btn-secondary btn-small" type="button" onClick={saveShoppingListToHistory}>
                  Save List
                </button>
                {hasSavedShoppingDraft ? (
                  <button className="btn btn-secondary btn-small" type="button" onClick={() => clearSavedShoppingDraft()}>
                    Clear Saved Draft
                  </button>
                ) : null}
              </div>
            </div>

            <div className="shopping-builder-controls">
              <div className="import-preview-actions shopping-list-action-row">
                <button className="btn btn-secondary btn-small" type="button" onClick={() => setAllShoppingCandidates(true)}>
                  Select All
                </button>
                <button className="btn btn-secondary btn-small" type="button" onClick={() => setAllShoppingCandidates(false)}>
                  Clear Recipes
                </button>
                <button className="btn btn-secondary btn-small" type="button" onClick={clearShoppingChecklist}>
                  Uncheck Items
                </button>
                <button className="btn btn-secondary btn-small" type="button" onClick={clearShoppingPantry}>
                  Clear Pantry
                </button>
                <button className="btn btn-secondary btn-small" type="button" onClick={exportShoppingListText}>
                  Export List
                </button>
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
                <button
                  type="button"
                  className={`btn btn-small ${hidePantryItems ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setHidePantryItems((prev) => !prev)}
                >
                  {hidePantryItems ? 'Show Pantry' : 'Hide Pantry'}
                </button>
              </div>
              <p className="shopping-panel-note shopping-builder-hint">
                Mark any item with <strong>Have at Home</strong> to add it to pantry. Your pantry items appear in their own section below.
              </p>
            </div>

            {shoppingHistory.length > 0 ? (
              <details className="shopping-panel">
                <summary>Saved Lists ({shoppingHistory.length})</summary>
                <p className="shopping-panel-note">Reuse a saved shopping setup without rebuilding it from scratch.</p>
                <div className="shopping-history-list">
                  {shoppingHistory.map((entry) => (
                    <article key={entry.id} className="shopping-history-item">
                      <div className="shopping-history-copy">
                        <strong>{entry.label}</strong>
                        <small>
                          {entry.recipeCount} recipe{entry.recipeCount === 1 ? '' : 's'} · {entry.totalCount} combined item{entry.totalCount === 1 ? '' : 's'}
                          {entry.unresolvedCount > 0 ? ` · ${entry.unresolvedCount} needs review` : ''}
                          {entry.pantryCount > 0 ? ` · ${entry.pantryCount} pantry` : ''}
                        </small>
                        <small>Saved {formatRelativeTime(entry.savedAt)}</small>
                      </div>
                      <div className="shopping-history-actions">
                        <button className="btn btn-small btn-secondary" type="button" onClick={() => restoreShoppingHistoryEntry(entry)}>
                          Restore
                        </button>
                        <button className="btn btn-small btn-secondary" type="button" onClick={() => deleteShoppingHistoryEntry(entry.id)}>
                          Delete
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </details>
            ) : null}

            <details className="shopping-panel" open={pantryEntries.length > 0}>
              <summary>Pantry / Have at Home ({pantryEntries.length})</summary>
              {pantryEntries.length > 0 ? (
                <>
                  <p className="shopping-panel-note">These are the items you marked as already available at home. Remove them here or use Hide Pantry to keep the active list focused.</p>
                  <div className="shopping-history-list">
                    {pantryEntries.map((entry) => (
                      <article key={entry.key} className="shopping-history-item shopping-pantry-entry">
                        <div className="shopping-history-copy">
                          <strong>{entry.label}</strong>
                          <small>{entry.section} · {entry.detail}</small>
                        </div>
                        <div className="shopping-history-actions">
                          <button className="btn btn-small btn-secondary" type="button" onClick={() => toggleShoppingPantryItem(entry.key)}>
                            Remove from Pantry
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                </>
              ) : (
                <EmptyStateCard
                  icon="fa-box-open"
                  title="No pantry items yet"
                  description="When you tap Have at Home on any ingredient, it will show up here so you can review or remove it later."
                  compact
                />
              )}
            </details>

            <div className="shopping-list-layout">
              <details className="shopping-panel" open>
                <summary>1. Choose Recipes</summary>
                <section className="shopping-list-recipes">
                  <p className="shopping-panel-note">Pick only the recipes you want to shop for right now.</p>
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
              </details>

              <details className="shopping-panel" open={selectedShoppingCount > 0}>
                 <summary>2. Combined Totals ({visibleCombinedShoppingItems.length})</summary>
                 <section className="shopping-list-ingredients">
                   {visibleCombinedShoppingItems.length > 0 ? (
                     <div className="shopping-group-sections">
                       {visibleGroupedCombinedShoppingItems.map((group) => (
                         <section key={group.section} className="shopping-group-section">
                           <div className="shopping-group-heading">{group.section}</div>
                           <div className="shopping-list-ingredient-items">
                             {group.items.map((item) => (
                               <div key={item.key} className={`shopping-list-ingredient-item ${shoppingPantry[item.key] ? 'shopping-list-pantry-item' : ''}`}>
                                 <input
                                   type="checkbox"
                                   checked={Boolean(shoppingChecklist[item.key])}
                                   onChange={() => toggleShoppingItemChecked(item.key)}
                                 />
                                 <span className={shoppingChecklist[item.key] ? 'shopping-list-item-checked' : ''}>
                                   {item.amountLabel}
                                   {item.sourceCount > 1 ? ` (${item.sourceCount} lines)` : ''}
                                   {shoppingPantry[item.key] ? <small className="shopping-pantry-flag">Have at home</small> : null}
                                 </span>
                                 <button className="btn btn-secondary btn-small shopping-pantry-btn" type="button" onClick={() => toggleShoppingPantryItem(item.key)}>
                                   {shoppingPantry[item.key] ? 'In Pantry' : 'Have at Home'}
                                 </button>
                               </div>
                             ))}
                           </div>
                         </section>
                      ))}
                    </div>
                  ) : (
                    <EmptyStateCard
                      icon="fa-cart-shopping"
                      title="Select recipes to build your list"
                      description="Start on the left by checking the recipes you want to shop for. Dish Depot will combine matching ingredients automatically."
                      compact
                    />
                  )}
                </section>
              </details>

               {filteredVisibleUnresolvedItems.length > 0 ? (
                 <details className="shopping-panel">
                  <summary>3. Needs Review ({filteredVisibleUnresolvedItems.length})</summary>
                  <p className="shopping-panel-note">These ingredients could not be safely combined. You can check them off as-is or merge them manually.</p>
                  <div className="shopping-manual-tools">
                    <input
                      type="text"
                      className="shopping-manual-input"
                      placeholder="Label for merged items"
                      value={shoppingManualText}
                      onChange={(event) => setShoppingManualText(event.target.value)}
                    />
                    <button className="btn btn-secondary btn-small" type="button" onClick={createManualMergeGroup}>
                      Merge Selected
                    </button>
                  </div>
                  <div className="shopping-group-sections">
                    {filteredGroupedVisibleUnresolvedItems.map((group) => (
                      <section key={group.section} className="shopping-group-section">
                        <div className="shopping-group-heading">{group.section}</div>
                        <div className="shopping-list-ingredient-items">
                          {group.items.map((item) => (
                            <div key={item.key} className={`shopping-list-ingredient-item shopping-list-unresolved-item ${shoppingPantry[item.key] ? 'shopping-list-pantry-item' : ''}`}>
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
                                {shoppingPantry[item.key] ? <small className="shopping-pantry-flag">Have at home</small> : null}
                              </span>
                              <button className="btn btn-secondary btn-small shopping-pantry-btn" type="button" onClick={() => toggleShoppingPantryItem(item.key)}>
                                {shoppingPantry[item.key] ? 'In Pantry' : 'Have at Home'}
                              </button>
                            </div>
                          ))}
                        </div>
                      </section>
                    ))}
                  </div>
                </details>
              ) : null}

               {visibleManualShoppingGroups.length > 0 ? (
                 <details className="shopping-panel">
                  <summary>4. Manual Merge Items ({visibleManualShoppingGroups.length})</summary>
                  <div className="shopping-group-sections">
                    {visibleGroupedManualShoppingItems.map((section) => (
                      <section key={section.section} className="shopping-group-section">
                        <div className="shopping-group-heading">{section.section}</div>
                        <div className="shopping-list-ingredient-items">
                          {section.items.map((group) => (
                            <div key={group.key} className={`shopping-list-ingredient-item shopping-list-manual-item ${shoppingPantry[group.key] ? 'shopping-list-pantry-item' : ''}`}>
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
                                {shoppingPantry[group.key] ? ' · Have at home' : ''}
                              </span>
                              <div className="shopping-manual-actions">
                                <button
                                  className="btn btn-small btn-secondary"
                                  type="button"
                                  onClick={() => toggleShoppingPantryItem(group.key)}
                                >
                                  {shoppingPantry[group.key] ? 'In Pantry' : 'Have at Home'}
                                </button>
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
                      </section>
                    ))}
                  </div>
                </details>
              ) : null}
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
          !isGroupModalOpen &&
          !isGroupInvitesModalOpen &&
          !isShareModalOpen &&
          !isImportPreviewOpen &&
          !isExportPreviewOpen &&
          !isShoppingListOpen &&
          !isToolsMenuOpen &&
          !focusedRecipe &&
          !isProfileModalOpen
        }
        showAddRecipeFab={activeView === 'recipes' && recipeScope !== 'shared' && !isInlineAddRecipeVisible}
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

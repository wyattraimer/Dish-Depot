import { Buffer } from 'node:buffer'
import process from 'node:process'
import { AzureKeyCredential, DocumentAnalysisClient } from '@azure/ai-form-recognizer'

const OCR_ENDPOINT = process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT || process.env.AZURE_DI_ENDPOINT || ''
const OCR_KEY = process.env.AZURE_DOCUMENT_INTELLIGENCE_API_KEY || process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY || process.env.AZURE_DI_KEY || ''
const OCR_MODEL = process.env.AZURE_DOCUMENT_INTELLIGENCE_MODEL || 'prebuilt-read'

let analysisClient = null

function extractionError(code, message) {
  const error = new Error(message)
  error.code = code
  return error
}

function getClient() {
  if (!OCR_ENDPOINT || !OCR_KEY) {
    throw extractionError('OCR_NOT_CONFIGURED', 'Recipe card scanning is not configured on the server yet.')
  }

  if (!analysisClient) {
    analysisClient = new DocumentAnalysisClient(OCR_ENDPOINT, new AzureKeyCredential(OCR_KEY))
  }

  return analysisClient
}

function normalizeOcrLines(pages = []) {
  const lines = []

  pages.forEach((page) => {
    ;(page.lines || []).forEach((line) => {
      const content = String(line.content || '')
        .replace(/\s+/g, ' ')
        .trim()

      if (content) {
        lines.push(content)
      }
    })
  })

  return lines
}

function normalizeHeading(line) {
  return line
    .toLowerCase()
    .replace(/[.:;\-–—]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function isLikelyHeading(line) {
  return /^(ingredients?|directions?|instructions?|method|preparation|steps?|notes?)$/.test(normalizeHeading(line))
}

function isLikelyDirection(line) {
  return /^(?:\d+[.):-]?\s*)?(mix|stir|combine|bake|cook|preheat|add|beat|whisk|fold|pour|heat|bring|simmer|serve|let|grease|place|sprinkle|chop|slice|boil|saute|brown|blend)\b/i.test(line)
}

function cleanSectionLines(lines) {
  return lines
    .map((line) => line.replace(/^[\u2022\-–—•]+\s*/, '').trim())
    .filter(Boolean)
}

function inferRecipeSections(lines) {
  const normalized = cleanSectionLines(lines)
  if (normalized.length === 0) {
    throw extractionError('NO_TEXT_FOUND', 'No readable text was found in that recipe card image.')
  }

  const headingLines = normalized.map((line) => normalizeHeading(line))
  const ingredientIndex = headingLines.findIndex((line) => /^ingredients?$/.test(line))
  const directionIndex = headingLines.findIndex((line) => /^(directions?|instructions?|method|preparation|steps?)$/.test(line))
  const notesIndex = headingLines.findIndex((line) => /^notes?$/.test(line))

  let title = ''
  const warnings = []
  let ingredients = []
  let directions = []
  let notes = ''

  if (!isLikelyHeading(normalized[0]) && normalized[0].length <= 100) {
    title = normalized[0]
  }

  if (ingredientIndex !== -1 || directionIndex !== -1) {
    const contentStart = title ? 1 : 0
    const ingredientStart = ingredientIndex === -1 ? contentStart : ingredientIndex + 1
    const directionStart = directionIndex === -1 ? normalized.length : directionIndex + 1
    const notesStart = notesIndex === -1 ? normalized.length : notesIndex + 1

    if (ingredientIndex !== -1) {
      ingredients = cleanSectionLines(normalized.slice(ingredientStart, Math.min(directionIndex === -1 ? notesStart : directionIndex, notesStart)))
    }

    if (directionIndex !== -1) {
      directions = cleanSectionLines(normalized.slice(directionStart, notesStart))
    }

    if (notesIndex !== -1) {
      notes = cleanSectionLines(normalized.slice(notesStart)).join('\n')
    }
  } else {
    const contentLines = title ? normalized.slice(1) : normalized.slice()
    const inferredDirectionsIndex = contentLines.findIndex((line) => isLikelyDirection(line))

    if (inferredDirectionsIndex > 0) {
      ingredients = cleanSectionLines(contentLines.slice(0, inferredDirectionsIndex))
      directions = cleanSectionLines(contentLines.slice(inferredDirectionsIndex))
      warnings.push('Sections were inferred from the handwriting layout. Please review before saving.')
    } else {
      notes = contentLines.join('\n')
      warnings.push('Could not confidently separate ingredients and directions. The OCR text was added to notes for review.')
    }
  }

  if (!title) {
    title = normalized.find((line) => !isLikelyHeading(line) && line.length <= 100) || ingredients[0] || directions[0] || normalized[0] || 'Scanned Recipe Card'
    warnings.push('Recipe title was inferred from the scanned text.')
  }

  if (ingredients.length === 0) {
    warnings.push('No ingredient section was confidently detected.')
  }

  if (directions.length === 0) {
    warnings.push('No directions section was confidently detected.')
  }

  return {
    title,
    ingredients,
    directions,
    notes,
    warnings,
  }
}

export async function extractRecipeFromCardImage(fileBuffer) {
  if (!fileBuffer || !Buffer.isBuffer(fileBuffer) || fileBuffer.length === 0) {
    throw extractionError('INVALID_IMAGE', 'Upload a recipe card image to scan.')
  }

  const client = getClient()

  let result
  try {
    const poller = await client.beginAnalyzeDocument(OCR_MODEL, fileBuffer)
    result = await poller.pollUntilDone()
  } catch (error) {
    throw extractionError('OCR_FAILED', error?.message || 'Azure Document Intelligence could not process this recipe card.')
  }

  const lines = normalizeOcrLines(result?.pages)
  const parsed = inferRecipeSections(lines)
  const handwritingDetected = Array.isArray(result?.styles) && result.styles.some((style) => style?.isHandwritten)

  return {
    data: {
      name: parsed.title,
      url: '',
      image: '',
      ingredients: parsed.ingredients,
      directions: parsed.directions,
      categories: [],
      notes: parsed.notes,
      type: 'custom',
    },
    meta: {
      source: 'Recipe Card Scan',
      domain: 'Azure Document Intelligence',
      warnings: parsed.warnings,
      handwritingDetected,
    },
  }
}

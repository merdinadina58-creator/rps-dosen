import ZAI from 'z-ai-web-dev-sdk'

/**
 * Web Search helper for RPS generation.
 * Uses z-ai-web-dev-sdk's functions.invoke('web_search') to fetch real-time
 * information about the mata kuliah before AI generates the RPS.
 *
 * This gives the AI up-to-date context about:
 * - Current syllabi and curriculum standards
 * - Recommended reference books (with real titles, authors, publishers)
 * - Latest trends and topics in the field
 * - Real CPMK examples from other universities
 *
 * All searches are backend-only (z-ai-web-dev-sdk requirement).
 */

let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null

async function getZAI() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create()
  }
  return zaiInstance
}

export interface SearchResult {
  title: string
  url: string
  snippet: string
  domain: string
  date?: string
}

export interface MataKuliahContext {
  query: string
  results: SearchResult[]
  summary: string // condensed context for the AI prompt
}

/**
 * Search the web for context about a mata kuliah.
 * Runs 2 targeted searches in parallel:
 *   1. Silabus/CPMK/kurikulum (for structure & learning outcomes)
 *   2. Buku referensi/referensi (for real book recommendations)
 *
 * Returns a condensed summary suitable for passing to the AI as context.
 */
export async function searchMataKuliahContext(
  namaMataKuliah: string,
  prodi: string
): Promise<MataKuliahContext> {
  const zai = await getZAI()

  const query1 = `${namaMataKuliah} silabus CPMK capaian pembelajaran kurikulum`
  const query2 = `${namaMataKuliah} buku referensi textbook best`

  const [results1, results2] = await Promise.all([
    zai.functions
      .invoke('web_search', { query: query1, num: 5 })
      .catch(() => [] as SearchResult[]),
    zai.functions
      .invoke('web_search', { query: query2, num: 5 })
      .catch(() => [] as SearchResult[]),
  ])

  const formatResults = (results: unknown[], label: string): string => {
    if (!Array.isArray(results) || results.length === 0) return ''
    const items = results.slice(0, 4).map((r: unknown, i: number) => {
      const item = r as Record<string, unknown>
      const title = String(item.name || item.title || '')
      const snippet = String(item.snippet || '').slice(0, 150)
      const domain = String(item.host_name || '')
      return `${i + 1}. ${title} (${domain})\n   ${snippet}`
    })
    return `=== ${label} ===\n${items.join('\n\n')}`
  }

  const context1 = formatResults(results1, 'Silabus & CPMK referensi')
  const context2 = formatResults(results2, 'Buku referensi')

  const summary = [context1, context2].filter(Boolean).join('\n\n')

  // Collect all results for the full response
  const allResults: SearchResult[] = [
    ...(Array.isArray(results1) ? results1 : []),
    ...(Array.isArray(results2) ? results2 : []),
  ].map((r: unknown) => {
    const item = r as Record<string, unknown>
    return {
      title: String(item.name || item.title || ''),
      url: String(item.url || ''),
      snippet: String(item.snippet || ''),
      domain: String(item.host_name || ''),
      date: item.date ? String(item.date) : undefined,
    }
  })

  return {
    query: `${query1}; ${query2}`,
    results: allResults,
    summary,
  }
}

export interface DeepSearchResult {
  results: Array<SearchResult & { queryUsed: string }>
  rawText: string // all snippets concatenated, for AI to parse
  queries: string[]
}

/**
 * DEEP SEARCH for references: runs 5 targeted queries to find REAL books/references.
 * Different query strategies maximize coverage:
 *   1. Textbook/best book search (English — finds international standard textbooks)
 *   2. Buku akademik search (Indonesian — finds local academic books)
 *   3. Publisher-specific search (Gramedia/Elex/ANDI — major Indonesian publishers)
 *   4. Amazon/Goodreads search (finds popular books with ratings)
 *   5. Jurnal/paper search (finds academic papers)
 *
 * Returns raw search results that the AI will PARSE (extract real refs from),
 * NOT generate. This ensures references are 100% real, not hallucinated.
 */
export async function deepSearchReferensi(
  namaMataKuliah: string,
  prodi: string
): Promise<DeepSearchResult> {
  const zai = await getZAI()

  const queries = [
    `${namaMataKuliah} textbook best book`,
    `${namaMataKuliah} buku akademik referensi pengarang`,
    `${namaMataKuliah} buku Gramedia OR "Elex Media" OR "Penerbit ANDI"`,
    `${namaMataKuliah} book Amazon Goodreads author`,
    `${namaMataKuliah} jurnal paper penelitian ${prodi}`,
  ]

  const allResults: Array<SearchResult & { queryUsed: string }> = []

  // Run all 5 searches in parallel for speed
  const searchPromises = queries.map(async (query, idx) => {
    try {
      const results = await zai.functions.invoke('web_search', { query, num: 5 })
      if (Array.isArray(results)) {
        return results.map((r: unknown) => {
          const item = r as Record<string, unknown>
          return {
            title: String(item.name || item.title || ''),
            url: String(item.url || ''),
            snippet: String(item.snippet || ''),
            domain: String(item.host_name || ''),
            date: item.date ? String(item.date) : undefined,
            queryUsed: queries[idx],
          }
        })
      }
    } catch {
      // Individual search failure — return empty, don't break the whole thing
    }
    return []
  })

  const settled = await Promise.all(searchPromises)
  for (const results of settled) {
    allResults.push(...results)
  }

  // Build raw text for AI parsing — include title + snippet + domain + URL
  const rawText = allResults
    .map((r, i) => {
      return `[${i + 1}] Judul: ${r.title}\n    Snippet: ${r.snippet}\n    Domain: ${r.domain}\n    URL: ${r.url}`
    })
    .join('\n\n')

  return {
    results: allResults,
    rawText,
    queries,
  }
}

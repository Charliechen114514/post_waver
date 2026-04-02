import { spawn, ChildProcess } from 'child_process'
import path from 'path'
import { existsSync, readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { Post, RelatedPost } from '../types.js'

/**
 * Input structure for TF-IDF Python script
 */
interface TFIDFInput {
  posts: Array<{
    id: string
    title: string
    tags: string[]
    contentHash: string
  }>
}

/**
 * Output structure from TF-IDF Python script
 */
interface TFIDFOutput {
  [postId: string]: Array<{
    id: string
    score: number
  }>
}

/**
 * Cache entry for TF-IDF results
 */
interface CacheEntry {
  result: Map<string, RelatedPost[]>
  timestamp: number
}

/**
 * Python subprocess bridge with content hash caching
 *
 * Handles communication with Python TF-IDF calculator:
 * - Content hash-based caching to avoid repeated calls
 * - Configurable Python binary (via PYTHON env var)
 * - 30-second timeout
 * - Strict stdout/stderr separation
 * - Graceful fallback on errors
 */
export class PythonBridge {
  private scriptPath: string
  private pythonBin: string
  private timeout: number
  private cache: Map<string, CacheEntry>
  private cacheTTL: number // Cache time-to-live in milliseconds
  private projectRoot: string

  /**
   * Create a new Python bridge instance
   *
   * @param scriptPath - Path to Python script (relative to package root)
   * @param timeout - Timeout in milliseconds (default: 30000)
   * @param cacheTTL - Cache TTL in milliseconds (default: 3600000 = 1 hour)
   */
  constructor(
    scriptPath: string = 'packages/linker/scripts/calculate_tfidf.py',
    timeout: number = 30000,
    cacheTTL: number = 3600000
  ) {
    // Determine project root by going up from __dirname until we find package.json
    // This ensures the path is correct regardless of where the code is called from
    this.projectRoot = this.findProjectRoot()
    this.scriptPath = scriptPath
    this.pythonBin = process.env.PYTHON || 'python3'
    this.timeout = timeout
    this.cacheTTL = cacheTTL
    this.cache = new Map()
  }

  /**
   * Find project root by looking for package.json
   */
  private findProjectRoot(): string {
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = path.dirname(__filename)
    let currentDir = __dirname

    // Go up directories until we find package.json at project root
    while (currentDir !== '/') {
      const packageJsonPath = path.join(currentDir, 'package.json')
      if (existsSync(packageJsonPath)) {
        // Check if this is the workspace root (has "private": true)
        try {
          // Use dynamic import for JSON
          const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
          if (packageJson.private === true || packageJson.workspaces) {
            return currentDir
          }
        } catch {
          // Continue searching
        }
      }
      currentDir = path.dirname(currentDir)
    }

    // Fallback to current working directory
    return process.cwd()
  }

  /**
   * Generate cache key from content hashes of all posts
   *
   * @param posts - Posts to calculate for
   * @returns Cache key string
   */
  private generateCacheKey(posts: Post[]): string {
    // Sort by id to ensure consistent key regardless of input order
    const sortedHashes = posts
      .map(p => p.contentHash)
      .sort()
      .join('|')
    return sortedHashes
  }

  /**
   * Get cached result if available and not expired
   *
   * @param cacheKey - Cache key
   * @returns Cached result or undefined
   */
  private getCached(cacheKey: string): Map<string, RelatedPost[]> | undefined {
    const entry = this.cache.get(cacheKey)
    if (!entry) {
      return undefined
    }

    // Check if cache is expired
    const now = Date.now()
    if (now - entry.timestamp > this.cacheTTL) {
      this.cache.delete(cacheKey)
      return undefined
    }

    return entry.result
  }

  /**
   * Set cache entry
   *
   * @param cacheKey - Cache key
   * @param result - Result to cache
   */
  private setCache(cacheKey: string, result: Map<string, RelatedPost[]>): void {
    this.cache.set(cacheKey, {
      result,
      timestamp: Date.now()
    })
  }

  /**
   * Spawn Python process and get result
   *
   * @param input - Input data for Python script
   * @returns Promise resolving to Python output
   */
  private spawnPython(input: TFIDFInput): Promise<TFIDFOutput> {
    return new Promise((resolve, reject) => {
      const absoluteScriptPath = path.join(this.projectRoot, this.scriptPath)

      const python: ChildProcess = spawn(this.pythonBin, [absoluteScriptPath], {
        cwd: this.projectRoot // Run from project root
      })

      let stdout = ''
      let stderr = ''
      let isResolved = false

      // Set up timeout
      const timeoutId = setTimeout(() => {
        if (!isResolved) {
          isResolved = true
          python.kill('SIGKILL')
          reject(new Error(`Python script timeout after ${this.timeout}ms`))
        }
      }, this.timeout)

      // Handle stdout
      python.stdout?.on('data', (data) => {
        stdout += data.toString()
      })

      // Handle stderr (logged separately)
      python.stderr?.on('data', (data) => {
        stderr += data.toString()
      })

      // Handle process exit
      python.on('close', (code) => {
        clearTimeout(timeoutId)

        if (isResolved) {
          return // Already rejected by timeout
        }

        isResolved = true

        if (code !== 0) {
          const errorMsg = stderr.trim() || `Python script exited with code ${code}`
          reject(new Error(`Python script failed: ${errorMsg}`))
          return
        }

        // Parse JSON output
        try {
          const result = JSON.parse(stdout.trim()) as TFIDFOutput

          // Validate output structure
          if (typeof result !== 'object' || result === null) {
            reject(new Error('Invalid Python output: expected object, got ' + typeof result))
            return
          }

          resolve(result)
        } catch (error) {
          reject(new Error(`Failed to parse Python output: ${stdout}`))
        }
      })

      // Handle spawn errors
      python.on('error', (error) => {
        clearTimeout(timeoutId)
        if (!isResolved) {
          isResolved = true
          reject(new Error(`Failed to spawn Python process: ${error.message}`))
        }
      })

      // Send input to Python script
      try {
        const inputData = JSON.stringify(input)
        python.stdin?.write(inputData)
        python.stdin?.end()
      } catch (error) {
        clearTimeout(timeoutId)
        if (!isResolved) {
          isResolved = true
          reject(new Error(`Failed to write to Python stdin: ${error}`))
        }
      }
    })
  }

  /**
   * Calculate related posts using Python TF-IDF
   *
   * @param posts - Posts to calculate relationships for
   * @returns Map of post ID to related posts, or null if Python failed
   */
  async calculateRelatedPosts(posts: Post[]): Promise<Map<string, RelatedPost[]> | null> {
    // Check cache first
    const cacheKey = this.generateCacheKey(posts)
    const cached = this.getCached(cacheKey)
    if (cached) {
      console.log('[PythonBridge] Using cached TF-IDF results')
      return cached
    }

    // Skip if less than 2 posts
    if (posts.length < 2) {
      return new Map()
    }

    // Prepare input for Python script
    const input: TFIDFInput = {
      posts: posts.map(p => ({
        id: p.id,
        title: p.frontmatter.title,
        tags: p.frontmatter.tags,
        contentHash: p.contentHash
      }))
    }

    try {
      console.log(`[PythonBridge] Running TF-IDF calculation for ${posts.length} posts...`)

      // Call Python script
      const output = await this.spawnPython(input)

      // Transform output to Map<string, RelatedPost[]>
      const result = new Map<string, RelatedPost[]>()

      for (const [postId, relatedPosts] of Object.entries(output)) {
        // Transform to RelatedPost format
        const related = relatedPosts.map(item => ({
          id: item.id,
          title: '',  // Title will be filled by orchestrator
          score: item.score
        }))
        result.set(postId, related)
      }

      // Cache the result
      this.setCache(cacheKey, result)

      console.log('[PythonBridge] TF-IDF calculation completed')
      return result

    } catch (error) {
      // Log error but don't throw - let caller decide on fallback
      console.warn('[PythonBridge] TF-IDF calculation failed:', error)
      return null
    }
  }

  /**
   * Clear the cache (useful for testing or force refresh)
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * Get cache size (for debugging)
   */
  getCacheSize(): number {
    return this.cache.size
  }
}

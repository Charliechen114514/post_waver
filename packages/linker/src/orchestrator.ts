import { Post, RelatedPost } from './types.js'
import { calculatePrevNext, ChronologicalRelationship } from './calculator/prev-next.js'
import { TagMatcher } from './matchers/tag-matcher.js'
import { PythonBridge } from './bridge/python-bridge.js'

/**
 * Complete relationship result for all posts
 */
export interface Relationships {
  /** Chronological relationships (prev/next) */
  prevNext: Map<string, ChronologicalRelationship>
  /** Semantic relationships (related posts) */
  related: Map<string, RelatedPost[]>
}

/**
 * Orchestrator for content relationship generation
 *
 * This is a PURE LOGIC LAYER - it coordinates relationship generation
 * without performing direct IO operations (except calling the bridge).
 *
 * Strategy:
 * 1. Always calculate prev/next (chronological relationships)
 * 2. Try Python TF-IDF for related posts
 * 3. Fall back to TagMatcher if Python fails
 * 4. Never fail - always return something useful
 */
export class LinkOrchestrator {
  private tagMatcher: TagMatcher
  private pythonBridge: PythonBridge

  constructor() {
    this.tagMatcher = new TagMatcher()
    this.pythonBridge = new PythonBridge()
  }

  /**
   * Generate complete relationships for all posts
   *
   * @param posts - Posts to generate relationships for
   * @returns Complete relationships (prev/next and related)
   */
  async generateRelationships(posts: Post[]): Promise<Relationships> {
    console.log(`[LinkOrchestrator] Generating relationships for ${posts.length} posts...`)

    // Phase 1: Calculate chronological relationships (always succeeds)
    console.log('[LinkOrchestrator] Calculating chronological relationships...')
    const prevNext = calculatePrevNext(posts)

    // Phase 2: Calculate semantic relationships (with fallback)
    console.log('[LinkOrchestrator] Calculating semantic relationships...')
    const related = await this.calculateRelatedPosts(posts)

    console.log('[LinkOrchestrator] Relationship generation completed')

    return {
      prevNext,
      related
    }
  }

  /**
   * Calculate related posts with graceful fallback
   *
   * Strategy:
   * 1. Try Python TF-IDF (high quality)
   * 2. Fall back to TagMatcher (tag-based)
   * 3. Never fail - always return something
   *
   * @param posts - Posts to calculate related posts for
   * @returns Map of post ID to related posts
   */
  private async calculateRelatedPosts(posts: Post[]): Promise<Map<string, RelatedPost[]>> {
    // Skip if less than 2 posts
    if (posts.length < 2) {
      console.log('[LinkOrchestrator] Less than 2 posts, skipping relationship calculation')
      return new Map()
    }

    // Strategy 1: Try Python TF-IDF first
    try {
      console.log('[LinkOrchestrator] Attempting Python TF-IDF calculation...')
      const tfidfResult = await this.pythonBridge.calculateRelatedPosts(posts)

      if (tfidfResult) {
        console.log('[LinkOrchestrator] Python TF-IDF succeeded')
        return this.enrichRelatedPosts(tfidfResult, posts)
      }
    } catch (error) {
      console.warn('[LinkOrchestrator] Python TF-IDF failed:', error)
    }

    // Strategy 2: Fall back to TagMatcher
    console.log('[LinkOrchestrator] Falling back to TagMatcher')
    const tagResult = this.tagMatcher.calculateAllRelationships(posts, 3)
    console.log('[LinkOrchestrator] TagMatcher completed')

    return tagResult
  }

  /**
   * Enrich related posts with titles
   *
   * Python TF-IDF returns only IDs and scores - we need to add titles
   *
   * @param relatedPosts - Related posts without titles
   * @param posts - All posts (for title lookup)
   * @returns Related posts with titles
   */
  private enrichRelatedPosts(
    relatedPosts: Map<string, RelatedPost[]>,
    posts: Post[]
  ): Map<string, RelatedPost[]> {
    const enriched = new Map<string, RelatedPost[]>()

    // Create a map for quick post lookup
    const postMap = new Map<string, Post>()
    for (const post of posts) {
      postMap.set(post.id, post)
    }

    // Enrich each related post list
    for (const [postId, relatedList] of relatedPosts.entries()) {
      const enrichedList = relatedList.map(related => {
        const post = postMap.get(related.id)
        return {
          id: related.id,
          title: post?.frontmatter.title || related.id,
          score: related.score
        }
      })
      enriched.set(postId, enrichedList)
    }

    return enriched
  }

  /**
   * Clear Python bridge cache
   *
   * Useful for testing or force refresh
   */
  clearCache(): void {
    this.pythonBridge.clearCache()
  }
}

/**
 * Singleton instance for convenient access
 */
export const orchestrator = new LinkOrchestrator()

/**
 * Convenience function to generate relationships
 *
 * @param posts - Posts to generate relationships for
 * @returns Complete relationships
 */
export async function generateRelationships(posts: Post[]): Promise<Relationships> {
  return orchestrator.generateRelationships(posts)
}

import { Post, RelatedPost } from '../types.js'

/**
 * Tag-based semantic matching fallback
 * Uses normalized Jaccard similarity (cosine similarity on binary tag vectors)
 */
export class TagMatcher {
  /**
   * Calculate similarity between two posts based on tag overlap
   *
   * Formula: |tags_A ∩ tags_B| / sqrt(|tags_A| × |tags_B|)
   * This is cosine similarity on binary tag vectors
   *
   * @param postA - First post
   * @param postB - Second post
   * @returns Similarity score between 0 and 1
   */
  private calculateSimilarity(postA: Post, postB: Post): number {
    const tagsA = new Set(postA.frontmatter.tags)
    const tagsB = new Set(postB.frontmatter.tags)

    // Find intersection
    const intersection = [...tagsA].filter(tag => tagsB.has(tag))

    // Critical optimization: return 0 for zero intersection
    // This prevents false positives where unrelated posts get matched
    if (intersection.length === 0) {
      return 0
    }

    // Normalized Jaccard similarity (cosine on binary vectors)
    const denominator = Math.sqrt(tagsA.size * tagsB.size)
    return intersection.length / denominator
  }

  /**
   * Find top N related posts based on tag similarity
   *
   * @param posts - All posts to search through
   * @param currentPost - The post to find related posts for
   * @param topN - Number of related posts to return (default: 3)
   * @returns Array of related posts sorted by similarity score
   */
  findRelatedPosts(
    posts: Post[],
    currentPost: Post,
    topN: number = 3
  ): RelatedPost[] {
    // Calculate similarity for all posts except current
    const similarities = posts
      .filter(post => post.id !== currentPost.id)
      .map(post => ({
        post,
        score: this.calculateSimilarity(currentPost, post)
      }))
      .filter(item => item.score > 0) // Only include posts with some tag overlap
      .sort((a, b) => b.score - a.score) // Sort by score descending
      .slice(0, topN) // Take top N

    // Transform to RelatedPost format
    return similarities.map(({ post, score }) => ({
      id: post.id,
      title: post.frontmatter.title,
      score
    }))
  }

  /**
   * Calculate related posts for all posts in the collection
   *
   * @param posts - All posts
   * @param topN - Number of related posts per post (default: 3)
   * @returns Map of post ID to array of related posts
   */
  calculateAllRelationships(
    posts: Post[],
    topN: number = 3
  ): Map<string, RelatedPost[]> {
    const relationships = new Map<string, RelatedPost[]>()

    for (const post of posts) {
      relationships.set(post.id, this.findRelatedPosts(posts, post, topN))
    }

    return relationships
  }
}

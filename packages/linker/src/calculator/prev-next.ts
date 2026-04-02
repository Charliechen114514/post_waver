import { Post } from '../types.js'

/**
 * Result of chronological relationship calculation
 */
export interface ChronologicalRelationship {
  /** ID of the previous (older) post */
  prev?: string
  /** ID of the next (newer) post */
  next?: string
}

/**
 * Calculate chronological relationships (prev/next) based on publication date
 *
 * Posts are sorted by date descending (newest first):
 * [newest, ..., middle, ..., oldest]
 *
 * For each post:
 * - next = newer post (toward index 0, higher in the sorted array)
 * - prev = older post (toward end of array, lower in the sorted array)
 */
export function calculatePrevNext(posts: Post[]): Map<string, ChronologicalRelationship> {
  const relationships = new Map<string, ChronologicalRelationship>()

  // Skip if less than 2 posts
  if (posts.length < 2) {
    return relationships
  }

  // Sort posts by date descending (newest → oldest)
  const sortedPosts = [...posts].sort((a, b) => {
    const dateA = new Date(a.frontmatter.date).getTime()
    const dateB = new Date(b.frontmatter.date).getTime()
    return dateB - dateA // Descending: newest first
  })

  // Assign prev/next relationships
  for (let i = 0; i < sortedPosts.length; i++) {
    const currentPost = sortedPosts[i]

    const relationship: ChronologicalRelationship = {}

    // next = newer post (higher in the sorted array, toward index 0)
    if (i > 0) {
      relationship.next = sortedPosts[i - 1].id
    }

    // prev = older post (lower in the sorted array, toward end)
    if (i < sortedPosts.length - 1) {
      relationship.prev = sortedPosts[i + 1].id
    }

    relationships.set(currentPost.id, relationship)
  }

  return relationships
}

/**
 * Get prev/next for a specific post
 *
 * @param posts - All posts
 * @param postId - Post ID to get relationships for
 * @returns Chronological relationship or undefined
 */
export function getPrevNext(posts: Post[], postId: string): ChronologicalRelationship | undefined {
  const relationships = calculatePrevNext(posts)
  return relationships.get(postId)
}

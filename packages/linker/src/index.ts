/**
 * Content Hub - Linker Package
 *
 * Provides content relationship generation functionality:
 * - Chronological relationships (prev/next based on date)
 * - Semantic relationships (related posts based on content similarity)
 * - Tag-based fallback matching
 * - Python TF-IDF integration with graceful degradation
 */

// Main orchestrator
export { LinkOrchestrator, orchestrator, generateRelationships } from './orchestrator.js'
export type { Relationships } from './orchestrator.js'

// Tag matcher (for testing and fallback)
export { TagMatcher } from './matchers/tag-matcher.js'

// Chronological calculator
export { calculatePrevNext, getPrevNext } from './calculator/prev-next.js'
export type { ChronologicalRelationship } from './calculator/prev-next.js'

// Python bridge (for advanced use cases)
export { PythonBridge } from './bridge/python-bridge.js'

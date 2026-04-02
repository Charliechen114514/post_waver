#!/usr/bin/env tsx
import { FullPublishPipeline } from '../packages/engine/dist/publish/full-pipeline.js'

async function main() {
  const postId = process.argv[2]
  if (!postId) {
    console.error('Usage: pnpm publish:full <postId>')
    process.exit(1)
  }

  const pipeline = new FullPublishPipeline()
  await pipeline.publish(postId)
}

main().catch(console.error)

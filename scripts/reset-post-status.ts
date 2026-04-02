import { PostDAL } from '../packages/database/dist/dal/post.js'

async function main() {
  const postId = process.argv[2] || 'example-post'
  const dal = new PostDAL()

  const post = await dal.findByPostId(postId)
  console.log(`Current status for ${postId}:`, post?.status)

  await dal.updateStatus(postId, 'draft')

  console.log(`Reset ${postId} to: draft`)
}

main().catch(console.error)

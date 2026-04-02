import { PostDAL } from '../packages/database/dist/dal/post.js'

async function main() {
  const dal = new PostDAL()
  const posts = await dal.findAll()

  let fixedCount = 0
  for (const post of posts) {
    // Check if post needs position fix
    const state = await dal.getWorkflowStatus(post.postId)
    if (state && state.status === 'pending' && state.location === 'done') {
      // Manually update using raw query through prisma
      const { PrismaClient } = await import('@prisma/client')
      const prisma = new PrismaClient()
      await prisma.$executeRaw`
        UPDATE Post SET workflowLocation = 'posts' WHERE postId = ${post.postId}
      `
      fixedCount++
      console.log(`Fixed position for: ${post.postId}`)
    }
  }

  console.log(`Fixed ${fixedCount} post(s)`)
}
main()

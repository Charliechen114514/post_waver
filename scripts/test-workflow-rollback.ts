import { FileMover } from '../packages/engine/src/workflow/file-mover.js'
import { promises as fs, existsSync } from 'fs'
import { join } from 'path'

async function testRollback() {
  console.log('🧪 测试工作流回滚修复\n')

  const testPostId = 'test-rollback-fix'
  const postsDir = join(process.cwd(), 'content/posts')
  const doneDir = join(process.cwd(), 'content/done')

  try {
    // 1. 创建测试文件
    console.log('📝 创建测试文件...')
    await fs.mkdir(postsDir, { recursive: true })
    await fs.mkdir(join(postsDir, 'assets'), { recursive: true })

    const testContent = `---
title: 测试回滚修复
---

# 测试图片

![图片1](assets/test1.png)
![图片2](assets/test2.png)
![外部图片](https://example.com/img.png)
`

    await fs.writeFile(join(postsDir, `${testPostId}.md`), testContent)
    await fs.writeFile(join(postsDir, 'assets', 'test1.png'), 'test1')
    await fs.writeFile(join(postsDir, 'assets', 'test2.png'), 'test2')

    console.log('✅ 测试文件创建成功\n')

    // 2. 测试移动到 done
    console.log('📦 测试移动到 done...')
    const fileMover = new FileMover()
    const donePath = await fileMover.moveToDone(testPostId, {
      updateReferences: true,
      moveAssets: true,
      createBackup: false
    })

    console.log(`✅ 已移动到: ${donePath}`)

    // 验证文件位置
    const mdInDone = existsSync(join(doneDir, `${testPostId}.md`))
    const asset1InDone = existsSync(join(doneDir, 'assets', 'test1.png'))
    const asset2InDone = existsSync(join(doneDir, 'assets', 'test2.png'))

    console.log(`\n验证发布后文件位置:`)
    console.log(`  - Markdown在done: ${mdInDone ? '✅' : '❌'}`)
    console.log(`  - 资源1在done: ${asset1InDone ? '✅' : '❌'}`)
    console.log(`  - 资源2在done: ${asset2InDone ? '✅' : '❌'}`)

    if (!mdInDone || !asset1InDone || !asset2InDone) {
      throw new Error('发布后文件位置不正确')
    }

    // 3. 测试回滚
    console.log('\n⏪ 测试回滚到 posts...')
    const postsPath = await fileMover.rollbackToPosts(testPostId)

    console.log(`✅ 已回滚到: ${postsPath}`)

    // 4. 验证回滚后文件位置
    const mdInPosts = existsSync(join(postsDir, `${testPostId}.md`))
    const asset1InPosts = existsSync(join(postsDir, 'assets', 'test1.png'))
    const asset2InPosts = existsSync(join(postsDir, 'assets', 'test2.png'))
    const mdNotInDone = !existsSync(join(doneDir, `${testPostId}.md`))
    const asset1NotInDone = !existsSync(join(doneDir, 'assets', 'test1.png'))
    const asset2NotInDone = !existsSync(join(doneDir, 'assets', 'test2.png'))

    console.log(`\n验证回滚后文件位置:`)
    console.log(`  - Markdown在posts: ${mdInPosts ? '✅' : '❌'}`)
    console.log(`  - 资源1在posts: ${asset1InPosts ? '✅' : '❌'}`)
    console.log(`  - 资源2在posts: ${asset2InPosts ? '✅' : '❌'}`)
    console.log(`  - Markdown不在done: ${mdNotInDone ? '✅' : '❌'}`)
    console.log(`  - 资源1不在done: ${asset1NotInDone ? '✅' : '❌'}`)
    console.log(`  - 资源2不在done: ${asset2NotInDone ? '✅' : '❌'}`)

    // 5. 验证资源内容
    const asset1Content = await fs.readFile(join(postsDir, 'assets', 'test1.png'), 'utf-8')
    const asset2Content = await fs.readFile(join(postsDir, 'assets', 'test2.png'), 'utf-8')

    console.log(`\n验证资源内容:`)
    console.log(`  - 资源1内容正确: ${asset1Content === 'test1' ? '✅' : '❌'}`)
    console.log(`  - 资源2内容正确: ${asset2Content === 'test2' ? '✅' : '❌'}`)

    // 6. 检查所有条件
    if (mdInPosts && asset1InPosts && asset2InPosts &&
        mdNotInDone && asset1NotInDone && asset2NotInDone &&
        asset1Content === 'test1' && asset2Content === 'test2') {
      console.log('\n🎉 所有测试通过！回滚修复验证成功！')
    } else {
      throw new Error('部分测试失败')
    }

  } catch (error) {
    console.error('\n❌ 测试失败:', error)
    throw error
  } finally {
    // 清理测试文件
    console.log('\n🧹 清理测试文件...')
    try {
      await fs.unlink(join(postsDir, `${testPostId}.md`))
      await fs.unlink(join(postsDir, 'assets', 'test1.png'))
      await fs.unlink(join(postsDir, 'assets', 'test2.png'))
      await fs.rmdir(join(postsDir, 'assets'))
    } catch (error) {
      // 忽略清理错误
    }
  }
}

testRollback().catch(error => {
  console.error('测试执行失败:', error)
  process.exit(1)
})

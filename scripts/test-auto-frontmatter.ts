import { parsePost } from '@content-hub/core'
import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'

/**
 * 测试 frontmatter 自动生成功能
 */
async function testAutoFrontmatter() {
  console.log('🧪 测试 Frontmatter 自动生成功能\n')

  const testFile = join(process.cwd(), 'content/posts/test/auto-frontmatter-test.md')

  // 读取原始文件
  const originalContent = await readFile(testFile, 'utf-8')
  console.log('📄 原始文件内容（前 200 字符）：')
  console.log(originalContent.slice(0, 200) + '...\n')

  try {
    // 测试自动生成（不保存到文件）
    console.log('🚀 开始测试自动生成（不保存到文件）...')
    const post1 = await parsePost(testFile, {
      autoComplete: true,
      saveToFile: false
    })

    console.log('\n✅ 自动生成成功！')
    console.log('\n📋 生成的 Frontmatter:')
    console.log(JSON.stringify(post1.frontmatter, null, 2))
    console.log(`\n📊 生成方法: ${post1.frontmatter._method || 'N/A'}`)

    // 测试保存到文件
    console.log('\n\n🚀 开始测试保存到文件...')
    const post2 = await parsePost(testFile, {
      autoComplete: true,
      saveToFile: true
    })

    console.log('\n✅ 已保存到文件！')

    // 读取更新后的文件
    const updatedContent = await readFile(testFile, 'utf-8')
    console.log('\n📄 更新后的文件内容（前 400 字符）：')
    console.log(updatedContent.slice(0, 400) + '...\n')

    // 恢复原始文件
    await writeFile(testFile, originalContent, 'utf-8')
    console.log('♻️  已恢复原始文件\n')

    console.log('✅ 测试完成！')
  } catch (error) {
    console.error('\n❌ 测试失败:', error)

    // 恢复原始文件
    try {
      await writeFile(testFile, originalContent, 'utf-8')
      console.log('♻️  已恢复原始文件')
    } catch (restoreError) {
      console.error('⚠️  恢复文件失败:', restoreError)
    }

    process.exit(1)
  }
}

testAutoFrontmatter()

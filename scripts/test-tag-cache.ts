import { getTagCacheManager } from '@content-hub/core'

/**
 * 测试标签缓存功能
 */
async function testTagCache() {
  console.log('🧪 测试标签缓存功能\n')

  const cache = await getTagCacheManager()

  // 1. 显示缓存统计
  console.log('📊 缓存统计:')
  const stats = cache.getStats()
  console.log(`   总标签数: ${stats.totalTags}`)
  console.log(`   总使用次数: ${stats.totalUsage}`)
  console.log(`   热门标签:`)
  stats.topTags.forEach((tag, index) => {
    console.log(`     ${index + 1}. ${tag.tag} (${tag.count} 次)`)
  })

  // 2. 测试标签匹配
  console.log('\n\n🎯 测试从内容匹配标签:')
  const testContent = `
# React Hooks 教程

在这篇文章中，我将介绍 React Hooks 的使用方法，包括 useState, useEffect 等常用 hooks。
同时也会提到 JavaScript 和 TypeScript 的最佳实践。
  `

  const matchedTags = cache.matchTagsFromContent(testContent, 'test', 5)
  console.log(`   匹配到的标签: ${matchedTags.join(', ') || '无（缓存为空）'}`)

  // 3. 添加示例标签
  console.log('\n\n➕ 添加示例标签到缓存...')
  cache.addTags(['react', 'javascript', 'typescript', 'tutorial'], 'test', ['hooks', 'useState', 'frontend'])
  cache.addTags(['python', 'flask', 'api', 'backend'], 'tech', ['flask', 'python', 'web'])
  cache.addTags(['git', 'version-control', 'tools'], 'notes', ['git', 'github', 'commit'])
  await cache.save()
  console.log('   ✅ 示例标签已添加')

  // 4. 再次测试匹配
  console.log('\n\n🎯 再次测试标签匹配（应该有结果了）:')
  const matchedTags2 = cache.matchTagsFromContent(testContent, 'test', 5)
  console.log(`   匹配到的标签: ${matchedTags2.join(', ')}`)

  // 5. 显示按分类分组的标签
  console.log('\n\n📁 按分类分组的标签:')
  const testTags = cache.getTagsByCategory('test')
  const techTags = cache.getTagsByCategory('tech')
  console.log(`   test 分类: ${testTags.join(', ') || '无'}`)
  console.log(`   tech 分类: ${techTags.join(', ') || '无'}`)

  // 6. 导出常用标签列表（用于 AI 参考）
  console.log('\n\n📋 导出常用标签列表（用于 AI 参考）:')
  const commonTags = cache.exportCommonTags(10)
  console.log(`   ${commonTags.join(', ')}`)

  console.log('\n\n✅ 测试完成！')
  console.log('\n💡 提示：标签缓存会保存到 frontmatter-tag-cache.json')
  console.log('   AI 生成的标签会自动保存到缓存，AI 不可用时从缓存智能匹配')
}

testTagCache()

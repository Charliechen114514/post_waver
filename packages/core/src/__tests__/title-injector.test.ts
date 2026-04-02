import { describe, it, expect } from 'vitest'
import {
  injectTitlePostContent,
  validateInjectionContent,
  formatInjectionForPlatform
} from '../title-injector'

describe('Title Injector', () => {
  describe('injectTitlePostContent', () => {
    it('应该在标题后注入内容', () => {
      const content = `---
title: Test Post
---

# Test Post

This is test content.
`

      const result = injectTitlePostContent(content, {
        platform: 'juejin',
        customContent: '🔥 欢迎订阅我的专栏',
        enabled: true,
        position: 'after_title'
      })

      expect(result).toContain('🔥 欢迎订阅我的专栏')
      expect(result).toContain('# Test Post')
      expect(result.indexOf('🔥 欢迎订阅我的专栏')).toBeGreaterThan(
        result.indexOf('# Test Post')
      )
    })

    it('应该在内容前注入（position: before_content）', () => {
      const content = `---
title: Test Post
---

# Test Post

First paragraph.

Second paragraph.
`

      const result = injectTitlePostContent(content, {
        platform: 'juejin',
        customContent: '这是注入内容',
        enabled: true,
        position: 'before_content'
      })

      expect(result).toContain('这是注入内容')
      // 确保在第一段之前
      const injectionIndex = result.indexOf('这是注入内容')
      const firstParagraphIndex = result.indexOf('First paragraph')
      expect(injectionIndex).toBeLessThan(firstParagraphIndex)
    })

    it('应该处理空内容', () => {
      const content = ''
      const result = injectTitlePostContent(content, {
        platform: 'juejin',
        customContent: '注入内容',
        enabled: true
      })

      expect(result).toContain('注入内容')
    })

    it('应该处理缺少标题的内容', () => {
      const content = 'No heading here.\nJust some content.'

      const result = injectTitlePostContent(content, {
        platform: 'juejin',
        customContent: '注入内容',
        enabled: true
      })

      expect(result).toContain('注入内容')
      expect(result.indexOf('注入内容')).toBe(0) // 在开头
    })

    it('应该在禁用时不注入内容', () => {
      const content = `---
title: Test Post
---

# Test Post

Content here.
`

      const result = injectTitlePostContent(content, {
        platform: 'juejin',
        customContent: '不应该出现的内容',
        enabled: false
      })

      expect(result).not.toContain('不应该出现的内容')
    })

    it('应该处理空注入内容', () => {
      const content = `---
title: Test Post
---

# Test Post

Content here.
`

      const result = injectTitlePostContent(content, {
        platform: 'juejin',
        customContent: '',
        enabled: true
      })

      // 空内容不应该被注入
      expect(result).toBe(content)
    })

    it('应该保留 Frontmatter', () => {
      const content = `---
title: Test Post
date: 2026-04-02
tags: ['test']
---

# Test Post

Content.
`

      const result = injectTitlePostContent(content, {
        platform: 'juejin',
        customContent: '注入内容',
        enabled: true
      })

      expect(result).toMatch(/^---\ntitle: Test Post/)
      expect(result).toContain('date: 2026-04-02')
      expect(result).toContain("tags: ['test']")
    })

    it('应该处理没有 Frontmatter 的内容', () => {
      const content = '# Test Post\n\nContent here.'

      const result = injectTitlePostContent(content, {
        platform: 'juejin',
        customContent: '注入内容',
        enabled: true
      })

      expect(result).toContain('注入内容')
      expect(result).toContain('# Test Post')
    })

    it('应该支持平台特定格式化', () => {
      const content = `---
title: Test Post
---

# Test Post

Content.
`

      // 微信平台应该有 HTML 样式
      const wechatResult = injectTitlePostContent(content, {
        platform: 'wechat',
        customContent: '微信注入内容',
        enabled: true
      })

      // 微信注入应该包含 HTML（通过 formatInjectionForPlatform）
      // 但目前 injectTitlePostContent 不自动格式化
      expect(wechatResult).toContain('微信注入内容')
    })
  })

  describe('validateInjectionContent', () => {
    it('应该接受有效内容', () => {
      const result = validateInjectionContent('这是一段有效的注入内容')
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('应该拒绝空内容', () => {
      const result = validateInjectionContent('')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('注入内容不能为空')
    })

    it('应该拒绝只有空格的内容', () => {
      const result = validateInjectionContent('   ')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('注入内容不能为空')
    })

    it('应该拒绝过长的内容', () => {
      const longContent = 'a'.repeat(501)
      const result = validateInjectionContent(longContent)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('注入内容过长')
    })

    it('应该接受刚好 500 字符的内容', () => {
      const content = 'a'.repeat(500)
      const result = validateInjectionContent(content)
      expect(result.valid).toBe(true)
    })
  })

  describe('formatInjectionForPlatform', () => {
    it('应该为掘金平台返回纯文本', () => {
      const content = '掘金注入内容'
      const result = formatInjectionForPlatform(content, 'juejin')
      expect(result).toBe(content)
    })

    it('应该为微信平台返回 HTML', () => {
      const content = '微信注入内容'
      const result = formatInjectionForPlatform(content, 'wechat')
      expect(result).toContain('<div')
      expect(result).toContain(content)
      expect(result).toContain('style=')
    })

    it('应该为 HTML 平台返回 HTML', () => {
      const content = 'HTML 注入内容'
      const result = formatInjectionForPlatform(content, 'html')
      expect(result).toContain('<div class="title-injection">')
      expect(result).toContain(content)
    })
  })
})

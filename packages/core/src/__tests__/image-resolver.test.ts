import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { existsSync, mkdirSync, writeFileSync, rmSync } from 'fs'
import { join } from 'path'
import {
  isExternalLink,
  isBase64Image,
  normalizePath,
  imageExists,
  generateUniqueFilename
} from '../image-resolver.js'

describe('image-resolver', () => {
  describe('isExternalLink', () => {
    it('应该识别 HTTP 链接', () => {
      expect(isExternalLink('http://example.com/image.jpg')).toBe(true)
    })

    it('应该识别 HTTPS 链接', () => {
      expect(isExternalLink('https://example.com/image.jpg')).toBe(true)
    })

    it('应该拒绝相对路径', () => {
      expect(isExternalLink('./image.jpg')).toBe(false)
    })

    it('应该拒绝绝对路径', () => {
      expect(isExternalLink('/path/to/image.jpg')).toBe(false)
    })

    it('应该拒绝空字符串', () => {
      expect(isExternalLink('')).toBe(false)
    })
  })

  describe('isBase64Image', () => {
    it('应该识别 PNG base64 图片', () => {
      expect(isBase64Image('data:image/png;base64,iVBOR...')).toBe(true)
    })

    it('应该识别 JPEG base64 图片', () => {
      expect(isBase64Image('data:image/jpeg;base64,/9j/4AAQ...')).toBe(true)
    })

    it('应该拒绝普通路径', () => {
      expect(isBase64Image('./image.jpg')).toBe(false)
    })

    it('应该拒绝外链', () => {
      expect(isBase64Image('https://example.com/image.jpg')).toBe(false)
    })
  })

  describe('generateUniqueFilename', () => {
    it('应该返回原文件名（如果不存在）', () => {
      const existing = new Set(['file2.jpg'])
      expect(generateUniqueFilename('file1.jpg', existing)).toBe('file1.jpg')
    })

    it('应该生成唯一文件名（如果存在）', () => {
      const existing = new Set(['file.jpg'])
      expect(generateUniqueFilename('file.jpg', existing)).toBe('file-1.jpg')
    })

    it('应该处理多次冲突', () => {
      const existing = new Set(['file.jpg', 'file-1.jpg', 'file-2.jpg'])
      expect(generateUniqueFilename('file.jpg', existing)).toBe('file-3.jpg')
    })

    it('应该处理无扩展名文件', () => {
      const existing = new Set(['file'])
      expect(generateUniqueFilename('file', existing)).toBe('file-1')
    })

    it('应该处理多个点号文件名', () => {
      const existing = new Set(['file.name.txt'])
      expect(generateUniqueFilename('file.name.txt', existing)).toBe('file.name-1.txt')
    })
  })

  describe('normalizePath 和 imageExists (集成测试)', () => {
    let tempDir: string
    let testImagesDir: string

    beforeEach(() => {
      // 创建临时测试目录
      tempDir = join(process.cwd(), 'temp-test')
      testImagesDir = join(tempDir, 'images')

      if (!existsSync(tempDir)) {
        mkdirSync(tempDir, { recursive: true })
      }
      if (!existsSync(testImagesDir)) {
        mkdirSync(testImagesDir, { recursive: true })
      }

      // 创建测试图片文件
      writeFileSync(join(testImagesDir, 'test1.png'), '')
      writeFileSync(join(testImagesDir, 'test2.jpg'), '')
    })

    afterEach(() => {
      // 清理临时目录
      if (existsSync(tempDir)) {
        rmSync(tempDir, { recursive: true, force: true })
      }
    })

    describe('imageExists', () => {
      it('应该返回 true（外链）', () => {
        expect(imageExists('https://example.com/image.jpg', tempDir)).toBe(true)
      })

      it('应该返回 true（base64）', () => {
        expect(imageExists('data:image/png;base64,iVBOR...', tempDir)).toBe(true)
      })

      it('应该返回 true（存在的本地图片）', () => {
        expect(imageExists('./images/test1.png', tempDir)).toBe(true)
      })

      it('应该返回 false（不存在的本地图片）', () => {
        expect(imageExists('./images/missing.png', tempDir)).toBe(false)
      })
    })

    describe('normalizePath', () => {
      it('应该保持外链不变', () => {
        const result = normalizePath('https://example.com/image.jpg', tempDir)
        expect(result).toBe('https://example.com/image.jpg')
      })

      it('应该保持 base64 不变', () => {
        const result = normalizePath('data:image/png;base64,iVBOR...', tempDir)
        expect(result).toBe('data:image/png;base64,iVBOR...')
      })

      it('应该规范化存在的本地图片', () => {
        const result = normalizePath('./images/test1.png', tempDir)
        expect(result).toBe('/assets/images/test1.png')
      })

      it('应该保持不存在的本地图片原路径', () => {
        const onMissing = vi.fn()
        const result = normalizePath('./images/missing.png', tempDir, { onMissing })

        expect(result).toBe('./images/missing.png')
        expect(onMissing).toHaveBeenCalledWith('./images/missing.png')
      })

      it('应该处理绝对路径', () => {
        const absolutePath = join(testImagesDir, 'test2.jpg')
        const result = normalizePath(absolutePath, tempDir)

        expect(result).toBe('/assets/images/test2.jpg')
      })

      it('应该处理相对路径中的 ../', () => {
        const result = normalizePath('../images/test1.png', join(tempDir, 'subdir'))
        expect(result).toBe('/assets/images/test1.png')
      })
    })
  })
})

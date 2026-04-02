#!/usr/bin/env tsx
import { readFile, writeFile, mkdir } from 'fs/promises'
import { copyFileSync } from 'fs'
import { resolve, dirname, join, basename } from 'path'
import { glob } from 'glob'
import matter from 'gray-matter'
import {
  normalizePath,
  imageExists,
  generateUniqueFilename,
  isExternalLink,
  isBase64Image
} from '@content-hub/core'
import { Command } from 'commander'

const program = new Command()

interface MigrationResult {
  total: number
  moved: number
  kept: number
  missing: number
  errors: Array<{ file: string; error: string }>
}

/**
 * 迁移单个文件中的图片
 */
async function migrateImagesInFile(
  filepath: string,
  contentDir: string,
  assetsDir: string,
  existingFilenames: Set<string>,
  dryRun: boolean
): Promise<{ moved: number; missing: string[] }> {
  const content = await readFile(filepath, 'utf-8')
  const { data, content: markdownBody } = matter(content)

  let movedCount = 0
  const missing: string[] = []

  // 替换 Markdown 图片引用：![alt](src)
  let newBody = markdownBody.replace(
    /!\[(.*?)\]\((.+?)\)/g,
    (match, alt, src) => {
      // 跳过外链和 base64 图片
      if (isExternalLink(src) || isBase64Image(src)) {
        return match
      }

      // 检查是否为本地图片且存在
      if (imageExists(src, dirname(filepath))) {
        const oldPath = resolve(dirname(filepath), src)
        const filename = basename(oldPath)
        const uniqueFilename = generateUniqueFilename(filename, existingFilenames)
        const newPath = join(assetsDir, uniqueFilename)

        // 添加到已存在集合
        existingFilenames.add(uniqueFilename)

        // 实际移动文件
        if (!dryRun) {
          copyFileSync(oldPath, newPath)
        }

        movedCount++
        return `![${alt}](/assets/images/${uniqueFilename})`
      } else {
        missing.push(src)
        return match // 保持原引用
      }
    }
  )

  // 替换 HTML <img> 标签
  newBody = newBody.replace(
    /<img[^>]+src=["']([^"']+)["'][^>]*>/gi,
    (match, src) => {
      // 跳过外链和 base64 图片
      if (isExternalLink(src) || isBase64Image(src)) {
        return match
      }

      // 检查是否为本地图片且存在
      if (imageExists(src, dirname(filepath))) {
        const oldPath = resolve(dirname(filepath), src)
        const filename = basename(oldPath)
        const uniqueFilename = generateUniqueFilename(filename, existingFilenames)
        const newPath = join(assetsDir, uniqueFilename)

        // 实际移动文件
        if (!dryRun) {
          copyFileSync(oldPath, newPath)
        }

        movedCount++
        return match.replace(src, `/assets/images/${uniqueFilename}`)
      } else {
        missing.push(src)
        return match
      }
    }
  )

  // 写回文件
  if (!dryRun) {
    const newContent = matter.stringify(newBody, data)
    await writeFile(filepath, newContent, 'utf-8')
  }

  return { moved: movedCount, missing }
}

/**
 * 主迁移函数
 */
async function migrate(
  contentDir: string,
  options: {
    dryRun?: boolean
    assetsDir?: string
  } = {}
): Promise<MigrationResult> {
  const { dryRun = false, assetsDir = 'content/assets/images' } = options

  // 确保 assets 目录存在
  if (!dryRun) {
    await mkdir(assetsDir, { recursive: true })
  }

  // 扫描所有 Markdown 文件
  const files = await glob('**/*.md', {
    cwd: contentDir,
    absolute: true
  })

  const result: MigrationResult = {
    total: files.length,
    moved: 0,
    kept: 0,
    missing: 0,
    errors: []
  }

  const existingFilenames = new Set<string>()

  for (const file of files) {
    try {
      const { moved, missing } = await migrateImagesInFile(
        file,
        contentDir,
        assetsDir,
        existingFilenames,
        dryRun
      )

      result.moved += moved
      result.missing += missing.length

      if (moved === 0) {
        result.kept++
      }

      if (missing.length > 0) {
        missing.forEach(src => {
          console.warn(`⚠️  ${file}: 图片不存在 - ${src}`)
        })
      }

      if (moved > 0) {
        console.log(`✅ ${file}: 移动了 ${moved} 个图片`)
      }
    } catch (error) {
      result.errors.push({
        file,
        error: error instanceof Error ? error.message : String(error)
      })
      console.error(`❌ ${file}: ${error}`)
    }
  }

  return result
}

program
  .name('migrate-images')
  .description('迁移并规范化图片路径')
  .option('-d, --dir <directory>', '内容目录', 'content/posts')
  .option('-a, --assets-dir <directory>', 'Assets 目录', 'content/assets/images')
  .option('--dry-run', '试运行，不实际修改文件')
  .action(async (options) => {
    if (options.dryRun) {
      console.log('🔍 试运行模式 - 不会实际修改文件\n')
    }

    const result = await migrate(options.dir, {
      dryRun: options.dryRun,
      assetsDir: options.assetsDir
    })

    console.log('\n📊 迁移统计:')
    console.log(`   - 总文件数: ${result.total}`)
    console.log(`   - 已移动图片: ${result.moved}`)
    console.log(`   - 未修改文件: ${result.kept}`)
    console.log(`   - 缺失图片: ${result.missing}`)
    console.log(`   - 错误: ${result.errors.length}`)

    if (result.errors.length > 0) {
      console.log('\n❌ 错误列表:')
      result.errors.forEach(({ file, error }) => {
        console.log(`   ${file}: ${error}`)
      })
      process.exit(1)
    }
  })

program.parse()

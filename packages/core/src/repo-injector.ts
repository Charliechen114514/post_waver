import type { Post } from './types.js'

/**
 * 仓库配置
 */
export interface RepoConfig {
  /** 仓库拥有者 */
  owner: string
  /** 仓库名称 */
  repo: string
  /** 分支（默认 main） */
  branch?: string
  /** 仓库描述（可选） */
  description?: string
}

/**
 * 为文章内容注入仓库引用链接和介绍
 */
export function injectRepoReference(
  content: string,
  post: Post,
  repoConfig: RepoConfig,
  platform: string
): string {
  const repoUrl = `https://github.com/${repoConfig.owner}/${repoConfig.repo}`
  const articlePath = `blob/${repoConfig.branch || 'main'}/${post.filepath}`
  const articleUrl = `${repoUrl}/${articlePath}`

  const repoFooter = generateRepoFooter(repoUrl, articleUrl, repoConfig, platform)

  return content + '\n\n' + repoFooter
}

function generateRepoFooter(
  repoUrl: string,
  articleUrl: string,
  config: RepoConfig,
  platform: string
): string {
  const repoName = config.description || config.repo

  switch (platform) {
    case 'juejin':
      return `
---
*本文首发于 [${repoName}](${repoUrl})，查看源码和更多文章请访问仓库。*
*文章链接：${articleUrl}*
`.trim()

    case 'wechat':
      return `
---
<p style="font-size: 14px; color: #666; margin-top: 40px;">
本文首发于 <a href="${repoUrl}">${repoName}</a>，查看源码和更多文章请访问仓库。<br/>
文章链接：<a href="${articleUrl}">${articleUrl}</a>
</p>
`.trim()

    case 'html':
    default:
      return `
---
<p style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd;">
<strong>来源：</strong><a href="${repoUrl}">${repoName}</a><br/>
<strong>原文链接：</strong><a href="${articleUrl}">${articleUrl}</a>
</p>
`.trim()
  }
}

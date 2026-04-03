import readline from 'readline'

export interface PublishStep {
  name: string
  status: 'pending' | 'running' | 'success' | 'failed'
  duration?: number
  error?: string
}

export interface FullPublishResult {
  success: boolean
  postId: string
  title: string
  steps: PublishStep[]
  outputs: {
    publishPage?: string
    hexoUrl?: string
    platforms: {
      platform: string
      content: string
      url?: string
    }[]
  }
}

/**
 * 用户交互管理器
 * 负责处理用户确认、进度显示、结果展示等 UI 交互
 */
export class PromptManager {
  private rl: readline.Interface

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })
  }

  /**
   * 显示发布计划
   */
  async showPublishPlan(postId: string): Promise<void> {
    console.log('\n┌─────────────────────────────────────────────────────┐')
    console.log('│' + ' '.repeat(20) + '📋 发布计划' + ' '.repeat(21) + '│')
    console.log('├─────────────────────────────────────────────────────┤')
    console.log('│' + ' '.repeat(10) + `文章 ID: ${postId}` + ' '.repeat(30 - postId.length) + '│')
    console.log('│                                                     │')
    console.log('│  发布步骤:                                          │')
    console.log('│    1. ✓ 解析文章                                    │')
    console.log('│    2. ✓ 生成平台产物                                │')
    console.log('│    3. ? Hexo 同步                                   │')
    console.log('│    4. ? 移动到 done                                │')
    console.log('│    5. ✓ 生成发布页面                                │')
    console.log('│    6. ✓ 打开浏览器                                  │')
    console.log('└─────────────────────────────────────────────────────┘\n')
  }

  /**
   * 用户确认
   */
  async confirm(question: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.rl.question(
        `${question} (Y/n): `,
        (answer: string) => {
          resolve(answer.toLowerCase() !== 'n')
        }
      )
    })
  }

  /**
   * 显示步骤进度
   */
  showStepProgress(
    stepIndex: number,
    totalSteps: number,
    stepName: string,
    status: 'running' | 'success' | 'failed',
    duration?: number
  ): void {
    const icon = status === 'running' ? '⏳' :
                 status === 'success' ? '✅' :
                 '❌'

    const durationStr = duration ? ` (${duration}ms)` : ''
    const stepStr = `${icon} [${stepIndex}/${totalSteps}] ${stepName}${durationStr}`

    if (status === 'running') {
      process.stdout.write(`\r${stepStr}`)
    } else {
      console.log(`\r${stepStr}`)
    }
  }

  /**
   * 显示发布结果
   */
  async showResult(result: FullPublishResult): Promise<void> {
    if (result.success) {
      console.log('\n┌─────────────────────────────────────────────────────┐')
      console.log('│' + ' '.repeat(17) + '🎉 发布成功!' + ' '.repeat(18) + '│')
      console.log('├─────────────────────────────────────────────────────┤')
      console.log('│                                                     │')
      console.log('│' + '  📝 文章: '.padEnd(52) + '│')
      console.log(`│    ${result.title}${' '.repeat(48 - result.title.length)}│`)
      console.log('│                                                     │')

      console.log('│  发布步骤:                                          │')
      result.steps.forEach((step) => {
        const icon = step.status === 'success' ? '✓' :
                     step.status === 'failed' ? '✗' :
                     '○'
        const duration = step.duration ? ` (${step.duration}ms)` : ''
        const stepText = `    ${icon} ${step.name}${duration}`
        console.log(`│${stepText.padEnd(54)}│`)
      })

      if (result.outputs.publishPage) {
        console.log('│                                                     │')
        console.log('│  📄 发布页面:                                       │')
        const pagePath = result.outputs.publishPage
        const truncatedPath = pagePath.length > 45 ? '...' + pagePath.slice(-42) : pagePath
        console.log(`│    ${truncatedPath}${' '.repeat(50 - truncatedPath.length)}│`)
      }

      if (result.outputs.hexoUrl) {
        console.log('│                                                     │')
        console.log('│  🔗 Hexo 博客:                                      │')
        console.log(`│    ${result.outputs.hexoUrl}${' '.repeat(50 - result.outputs.hexoUrl.length)}│`)
      }

      console.log('│                                                     │')
      console.log('└─────────────────────────────────────────────────────┘\n')
    } else {
      console.log('\n┌─────────────────────────────────────────────────────┐')
      console.log('│' + ' '.repeat(17) + '❌ 发布失败' + ' '.repeat(18) + '│')
      console.log('├─────────────────────────────────────────────────────┤')
      console.log('│                                                     │')

      const failedStep = result.steps.find(s => s.status === 'failed')
      if (failedStep) {
        console.log(`│  失败步骤: ${failedStep.name}${' '.repeat(40 - failedStep.name.length)}│`)
        if (failedStep.error) {
          const errorText = failedStep.error.slice(0, 45)
          console.log(`│  错误信息: ${errorText}${' '.repeat(45 - errorText.length)}│`)
        }
      }

      console.log('│                                                     │')
      console.log('└─────────────────────────────────────────────────────┘\n')
    }
  }

  /**
   * 显示下一步操作
   */
  async showNextSteps(result: FullPublishResult): Promise<void> {
    console.log('┌─────────────────────────────────────────────────────┐')
    console.log('│' + ' '.repeat(20) + '📝 下一步操作' + ' '.repeat(20) + '│')
    console.log('├─────────────────────────────────────────────────────┤')
    console.log('│                                                     │')
    console.log('│  1. 📋 复制平台内容                                  │')
    console.log('│     在打开的浏览器中点击"复制内容"按钮              │')
    console.log('│                                                     │')
    console.log('│  2. 🚀 发布到各平台                                  │')
    console.log('│     掘金: https://juejin.cn/editor/drafts/new/new             │')
    console.log('│     微信: https://mp.weixin.qq.com/                 │')
    console.log('│                                                     │')
    console.log('│  3. 🔗 设置平台 URL                                  │')
    console.log(`│     pnpm publish:set-url ${result.postId} --platform juejin --url <URL>`)
    console.log(`│     pnpm publish:set-url ${result.postId} --platform wechat --url <URL>`)
    console.log('│                                                     │')
    console.log('│  4. 📜 查看发布历史                                  │')
    console.log(`│     pnpm publish:history ${result.postId}`)
    console.log('│                                                     │')
    console.log('└─────────────────────────────────────────────────────┘\n')

    this.close()
  }

  /**
   * 显示错误信息
   */
  showError(message: string, error?: Error): void {
    console.log('\n❌ 错误:', message)
    if (error?.message) {
      console.log('   ', error.message)
    }
  }

  /**
   * 显示警告信息
   */
  showWarning(message: string): void {
    console.log('\n⚠️  警告:', message)
  }

  /**
   * 显示信息
   */
  showInfo(message: string): void {
    console.log('\nℹ️  ', message)
  }

  /**
   * 关闭提示管理器
   */
  close(): void {
    this.rl.close()
  }
}

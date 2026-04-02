/**
 * 数据库种子配置模板
 *
 * 此文件为公开模板，包含默认配置
 *
 * 使用说明：
 * 1. 复制此文件为 seed.local.ts
 * 2. 在 seed.local.ts 中填入您的真实配置（如微信token等）
 * 3. seed.local.ts 已在 .gitignore 中，不会被提交到git
 */

export interface SeedConfig {
  main: {
    autoSync: {
      enabled: boolean
      blogPath: string
      commitMessage: string
    }
    cleanup: {
      enabled: boolean
      retainDays: number
    }
    platforms: {
      juejin: {
        enabled: boolean
        autoCopy: boolean
      }
      wechat: {
        enabled: boolean
        autoCopy: boolean
      }
    }
  }

  hexo: {
    blogPath: string
    enabled: boolean
    git: {
      autoCommit: boolean
      autoPush: boolean
      commitMessage: string
      commitAuthor: {
        name: string
        email: string
      }
    }
    deploy: {
      enabled: boolean
      command: string
      timeout: number
    }
    paths: {
      posts: string
      images: string
      assets: string
    }
  }

  imageUpload: {
    wechat: {
      appId: string
      appSecret: string
    }
  }

  theme: {
    platformDefaults: {
      wechat: string
      juejin: string
      html: string
    }
    customThemes: Record<string, any>
  }

  wechatToken: {
    token: string
    expiresAt: string
    updatedAt: string
  }
}

export const defaultSeedConfig: SeedConfig = {
  main: {
    autoSync: {
      enabled: false,
      blogPath: './blog',
      commitMessage: 'docs: sync post from post_waver'
    },
    cleanup: {
      enabled: true,
      retainDays: 30
    },
    platforms: {
      juejin: {
        enabled: true,
        autoCopy: true
      },
      wechat: {
        enabled: true,
        autoCopy: true
      }
    }
  },

  hexo: {
    blogPath: './blog',
    enabled: false,
    git: {
      autoCommit: true,
      autoPush: false,
      commitMessage: 'docs: sync post from post_waver',
      commitAuthor: {
        name: 'Poster Wave',
        email: 'bot@posterwave.com'
      }
    },
    deploy: {
      enabled: false,
      command: 'hexo deploy',
      timeout: 60000
    },
    paths: {
      posts: 'source/_posts',
      images: 'source/images',
      assets: 'source/assets'
    }
  },

  imageUpload: {
    wechat: {
      // 在 seed.local.ts 中填入您的真实 appId 和 appSecret
      appId: '',
      appSecret: ''
    }
  },

  theme: {
    platformDefaults: {
      wechat: 'fresh',
      juejin: 'default',
      html: 'default'
    },
    customThemes: {}
  },

  wechatToken: {
    // 在 seed.local.ts 中填入您的真实 token
    token: '',
    expiresAt: '0',
    updatedAt: '0'
  }
}

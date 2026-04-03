import { ImageUploadConfigManager } from '@content-hub/config'
import { WechatClient } from '@content-hub/engine'

async function main() {
  const args = process.argv.slice(2)
  const command = args[0]

  const configManager = new ImageUploadConfigManager()

  if (command === 'set-wechat') {
    // 配置微信
    const appIdIndex = args.indexOf('--appId')
    const appSecretIndex = args.indexOf('--appSecret')

    if (appIdIndex === -1 || appSecretIndex === -1) {
      console.error('❌ 参数错误')
      console.log('\n用法:')
      console.log('  pnpm image:config:set-wechat --appId <APPID> --appSecret <APPSECRET>')
      console.log('\n获取方式:')
      console.log('  1. 登录微信公众平台 https://mp.weixin.qq.com/')
      console.log('  2. 进入"开发" -> "基本配置"')
      console.log('  3. 查看开发者ID (AppID) 和 开发者密码 (AppSecret)')
      process.exit(1)
    }

    const appId = args[appIdIndex + 1]
    const appSecret = args[appSecretIndex + 1]

    if (!appId || !appSecret) {
      console.error('❌ AppID 和 AppSecret 不能为空')
      process.exit(1)
    }

    // 保存配置
    configManager.setWechatConfig(appId, appSecret)

    console.log('✅ 微信配置已保存')
    console.log(`   AppID: ${appId}`)
    console.log(`   存储位置: 数据库 (Config 表)`)

  } else if (command === 'test-wechat') {
    // 测试微信连接
    const validation = configManager.validateConfig('wechat')

    if (!validation.valid) {
      console.error('❌ 微信配置无效:', validation.error)
      console.log('\n请先运行: pnpm image:config:set-wechat --appId <APPID> --appSecret <APPSECRET>')
      process.exit(1)
    }

    console.log('🔍 测试微信 API 连接...\n')

    const wechatConfig = configManager.getWechatConfig()!
    const client = new WechatClient({
      appId: wechatConfig.appId,
      appSecret: wechatConfig.appSecret,
      apiBaseUrl: 'https://api.weixin.qq.com/cgi-bin'
    })

    try {
      const token = await client.getAccessToken()
      console.log('✅ 连接成功!')
      console.log(`   Access Token: ${token.substring(0, 20)}...`)
      console.log('   微信 API 可用')
    } catch (error) {
      console.error('❌ 连接失败:', error instanceof Error ? error.message : error)
      console.log('\n可能的原因:')
      console.log('  1. AppID 或 AppSecret 配置错误')
      console.log('  2. 网络连接问题')
      console.log('  3. 微信 API 限流')
      process.exit(1)
    }

  } else if (command === 'status') {
    // 查看配置状态
    console.log('📋 图片上传配置状态:\n')

    const wechatConfig = configManager.getWechatConfig()
    if (wechatConfig) {
      console.log('微信公众号:')
      console.log(`  ✅ 已配置`)
      console.log(`  AppID: ${wechatConfig.appId}`)
    } else {
      console.log('微信公众号:')
      console.log(`  ❌ 未配置`)
    }

    const githubConfig = configManager.getGithubConfig()
    if (githubConfig) {
      console.log('\nGitHub 图床:')
      console.log(`  ✅ 已配置`)
    } else {
      console.log('\nGitHub 图床:')
      console.log(`  ❌ 未配置`)
    }

  } else if (command === 'clear') {
    // 清除配置
    const platform = args[1]

    if (platform === 'wechat' || platform === 'github') {
      configManager.clearConfig(platform)
      console.log(`✅ 已清除 ${platform} 配置`)
    } else if (!platform) {
      configManager.clearConfig()
      console.log('✅ 已清除所有配置')
    } else {
      console.error('❌ 未知平台:', platform)
      console.log('支持的平台: wechat, github')
      process.exit(1)
    }

  } else {
    console.error('❌ 未知命令:', command)
    console.log('\n可用命令:')
    console.log('  pnpm image:config set-wechat --appId <ID> --appSecret <SECRET>')
    console.log('  pnpm image:config test-wechat')
    console.log('  pnpm image:config status')
    console.log('  pnpm image:config clear [wechat|github]')
    process.exit(1)
  }
}

main()

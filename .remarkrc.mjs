import remarkPresetLintRecommended from 'remark-preset-lint-recommended'
import { customFrontmatterValidator } from './scripts/remark-lint-custom.js'

export default {
  plugins: [
    // Frontmatter 支持
    remarkFrontmatter,

    // 推荐规则集
    ...remarkPresetLintRecommended,

    // 自定义 Frontmatter 校验
    ['remark-lint-frontmatter-schema', {
      validator: customFrontmatterValidator,
      requiredFields: ['title', 'date', 'tags'],
      rules: {
        title: {
          type: 'string',
          required: true,
          minLength: 1
        },
        date: {
          type: 'string',
          required: true,
          pattern: '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(?:Z|[+-]\\d{2}:\\d{2})$'
        },
        tags: {
          type: 'array',
          required: true,
          minItems: 1
        }
      }
    }]
  ]
}

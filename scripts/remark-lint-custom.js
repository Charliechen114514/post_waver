/**
 * 自定义 Frontmatter 校验器
 */
export function customFrontmatterValidator(frontmatter, file) {
  const errors = []

  // 检查 title
  if (!frontmatter.title) {
    errors.push({
      path: 'title',
      message: 'title 字段必填',
      fatal: true
    })
  }

  // 检查 date
  if (!frontmatter.date) {
    errors.push({
      path: 'date',
      message: 'date 字段必填',
      fatal: true
    })
  } else {
    // 验证 ISO8601 格式
    const datePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:Z|[+-]\d{2}:\d{2})$/
    if (!datePattern.test(frontmatter.date)) {
      errors.push({
        path: 'date',
        message: 'date 必须是 ISO8601 格式（如：2026-04-01T00:00:00Z）',
        fatal: true
      })
    }
  }

  // 检查 tags
  if (!frontmatter.tags) {
    errors.push({
      path: 'tags',
      message: 'tags 字段必填',
      fatal: true
    })
  } else if (!Array.isArray(frontmatter.tags) || frontmatter.tags.length === 0) {
    errors.push({
      path: 'tags',
      message: 'tags 必须是至少包含 1 个元素的数组',
      fatal: true
    })
  }

  return errors
}

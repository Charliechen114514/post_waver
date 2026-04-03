declare module 'juice' {
  interface JuiceOptions {
    removeStyleTags?: boolean
    preserveImportant?: boolean
    preserveMediaQueries?: boolean
    preserveFontFaces?: boolean
    applyWidthAttributes?: boolean
    applyHeightAttributes?: boolean
    applyAttributesTableElements?: boolean
    [key: string]: any
  }

  function juice(html: string, options?: JuiceOptions): string
  export default juice
}

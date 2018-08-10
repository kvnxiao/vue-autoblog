interface Entries {
  description?: string
  date?: string
  title?: string
  categories?: string[]
  tags?: string[]
  path: string
}

declare const entries: Entries[];
export default entries;

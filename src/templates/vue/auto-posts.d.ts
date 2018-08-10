interface Posts {
  title?: string
  id: string
  permalink: string
  description?: string
  date?: string
  categories?: string[]
  tags?: string[]
}

declare const posts: Posts[];
export default posts;

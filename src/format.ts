function pascalToKebab(str: string): string {
  return str
    .match(/($[a-z])|[A-Z][^A-Z]+/g)!
    .join("-")
    .toLowerCase()
}

export default {
  pascalToKebab,
}

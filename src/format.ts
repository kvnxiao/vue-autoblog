import { html_beautify } from "js-beautify"

const beautifyConfig: HTMLBeautifyOptions = {
  end_with_newline: true,
  indent_size: 2,
  unformatted: [
    // https://www.w3.org/TR/html5/dom.html#phrasing-content
    "a", "abbr", "area", "audio", "b", "bdi", "bdo", "br", "button", "canvas", "cite",
    "code", "data", "datalist", "del", "dfn", "em", "embed", "i", "iframe", "img",
    "input", "ins", "kbd", "keygen", "label", "map", "mark", "math", "meter", "noscript",
    "object", "output", "progress", "q", "ruby", "s", "samp", /* "script", */ "select", "small",
    "span", "strong", "sub", "sup", "svg", "textarea", "time", "u", "var",
    "video", "wbr", "text",
    // prexisting - not sure of full effect of removing, leaving in
    "acronym", "address", "big", "dt", "ins", "strike", "tt",
  ],
}

function formatHtml(html: string): string {
  return html_beautify(html, beautifyConfig)
}

function pascalToKebab(str: string): string {
  return str
    .match(/($[a-z])|[A-Z][^A-Z]+/g)!
    .join("-")
    .toLowerCase()
}

export default {
  formatHtml,
  pascalToKebab,
}

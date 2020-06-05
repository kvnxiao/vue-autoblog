import { html_beautify } from "js-beautify"
import * as prettier from "prettier"

const beautifyConfigHTML: HTMLBeautifyOptions = {
  end_with_newline: true,
  /* eslint-disable prettier/prettier */
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
  /* eslint-enable prettier/prettier */
}

function formatHtml(html: string, prettierConfig: prettier.Options): string {
  return html_beautify(html, {
    end_with_newline: beautifyConfigHTML.end_with_newline,
    unformatted: beautifyConfigHTML.unformatted,
    indent_char: prettierConfig.useTabs ? "\t" : " ",
    indent_size: prettierConfig.tabWidth,
  })
}

function formatScript(script: string, prettierConfig: prettier.Options): string {
  return prettier.format(script, prettierConfig)
}

function pascalToKebab(str: string): string {
  if (isAlphaNumeric(str)) {
    return str
      .match(/($[a-zA-Z])|[A-Z][^A-Z]*/g)!
      .join("-")
      .toLowerCase()
  } else {
    return str
  }
}

function isAlphaNumeric(str: string): boolean {
  const len = str.length
  let i = 0
  for (i = 0; i < len; i++) {
    const c = str.charCodeAt(i)
    if (!(c > 47 && c < 58) && !(c > 64 && c < 91) && !(c > 96 && c < 123)) {
      return false
    }
  }
  return true
}

export default {
  formatHtml,
  formatScript,
  pascalToKebab,
}

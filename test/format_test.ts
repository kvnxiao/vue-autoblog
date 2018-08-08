import test from "ava"
import * as path from "path"
import * as prettier from "prettier"
import format from "../src/format"

// set up prettier config
const prettierConfig = prettier.resolveConfig.sync(__filename)!
prettierConfig.parser = "babylon"

test("format html", t => {
  const html = "    <div><p>This is a test</p> \t \n</div>"
  const f = format.formatHtml(html, prettierConfig)
  t.deepEqual(f, `<div>\n  <p>This is a test</p>\n</div>\n`)
})

test("format js script", t => {
  const script = "    function test () {\nconst a = 1;}"
  const f = format.formatScript(script, prettierConfig)
  t.deepEqual(f, `function test() {\n  const a = 1\n}\n`)
})

test("format-pascal case to kebab-case alphanumeric", t => {
  const pascal = "ThisIsAPascalCaseString"
  const f = format.pascalToKebab(pascal)
  t.deepEqual(f, "this-is-a-pascal-case-string")
})

test("format-pascal case to kebab-case non-alphanumeric", t => {
  const pascal = "2017-01-02-test-name-123"
  const f = format.pascalToKebab(pascal)
  t.deepEqual(f, "2017-01-02-test-name-123")
})

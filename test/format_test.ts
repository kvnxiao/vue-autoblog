import test from "ava"
import format from "../src/format"

test("format html", t => {
  const html = "    <div><p>This is a test</p> \t \n</div>"
  const f = format.formatHtml(html)
  t.deepEqual(f, `<div>\n  <p>This is a test</p>\n</div>\n`)
})

test("format js script", t => {
  const script = "    function test () {\nconst a = 1;}"
  const f = format.formatScript(script)
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

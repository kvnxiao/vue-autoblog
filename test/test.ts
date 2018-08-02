import test from "ava"

import autoblog from "../src/autoblog"

test("test", t => {
    autoblog.generate()
    t.pass()
})

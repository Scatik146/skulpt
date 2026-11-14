// Tests for Sk.configure({printLastExpr: true}) — Python mode of «Живой конспект»:
// the value of the last expression of the main program is shown, like in the IDLE shell.
const path = require("path");
const dir = path.resolve(__dirname, "..");
if (require("../support/run/require-skulpt").requireSkulpt(false) === null) process.exit(1);
require(path.join(dir, "dist/skulpt-stdlib.js"));

const cases = [
    ["2 + 3", "5\n"],
    ["x = 7\nx * 6", "42\n"],
    ["'abc'", "'abc'\n"],
    ["[1, 'a']", "[1, 'a']\n"],
    ["print('hi')", "hi\n"],                       // None is not shown
    ["None", ""],
    ["x = 5", ""],                                  // assignment: nothing
    ["2 + 3\nx = 1", ""],                           // not last: nothing
    ["for i in range(2):\n    i", ""],              // inside a loop: nothing
    ["class A:\n    def __repr__(self):\n        return 'A!'\nA()", "A!\n"],
    ["import time\ntime.sleep(0.01)\n'after sleep'", "'after sleep'\n"], // suspension
    ["s = input()\ns.upper()", "'ПРИВЕТ'\n"],     // input via Sk.inputfun
    ["def f():\n    return 3\nf()", "3\n"],
    ["import mymod\nmymod.x", "10\n"],             // mymod.py ends with "x * 100": not shown
];

async function run(src, on) {
    let out = "";
    Sk.configure({
        output: (t) => { out += t; },
        read: (f) => {
            if (f === "./mymod.py" || f === "mymod.py") return "x = 10\nx * 100\n";
            if (Sk.builtinFiles && Sk.builtinFiles.files[f] !== undefined) return Sk.builtinFiles.files[f];
            throw new Error("File not found: " + f);
        },
        inputfun: () => "привет",
        __future__: Sk.python3,
        printLastExpr: on,
    });
    await Sk.misceval.asyncToPromise(() => Sk.importMainWithBody("<stdin>", false, src, true));
    return out;
}

(async () => {
    let bad = 0;
    for (const [src, want] of cases) {
        const got = await run(src, true);
        const off = await run(src, false);
        const wantOff = src.startsWith("print") ? "hi\n" : "";
        const ok = got === want && off === wantOff;
        if (!ok) bad++;
        if (!ok || process.env.VERBOSE) console.log(ok ? "ok  " : "FAIL", JSON.stringify(src), "->", JSON.stringify(got), "| off:", JSON.stringify(off));
    }
    console.log(`printLastExpr: ${cases.length - bad}/${cases.length} passed`);
    process.exit(bad ? 1 : 0);
})();

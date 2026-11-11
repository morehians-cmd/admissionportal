import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = process.cwd();
const failures = [];
const passed = [];

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === ".git" || entry.name === "node_modules" || entry.name === ".github") return [];
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}
function parse(label, source) {
  try {
    new vm.Script(source, { filename: label });
    passed.push(label);
  } catch (error) {
    failures.push({ file: label, message: error.message });
  }
}

const files = walk(root);
const serverFiles = files.filter((file) => file.endsWith(".gs")).sort();
const htmlFiles = files.filter((file) => file.endsWith(".html")).sort();

for (const file of serverFiles) parse(path.relative(root, file), fs.readFileSync(file, "utf8"));
if (serverFiles.length) {
  const combined = serverFiles.map((file) =>
    "\n// ---- " + path.relative(root, file) + " ----\n" + fs.readFileSync(file, "utf8")
  ).join("\n");
  parse("ALL .gs FILES (shared Apps Script global scope)", combined);
}

const browserBlocks = [];
for (const file of htmlFiles) {
  const html = fs.readFileSync(file, "utf8");
  const blocks = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)];
  const inline = [];
  for (let index = 0; index < blocks.length; index++) {
    const attrs = blocks[index][1] || "";
    if (/\bsrc\s*=/i.test(attrs)) continue;
    let code = blocks[index][2].replace(/<\?=[\s\S]*?\?>/g, "null");
    if (/<\?[\s\S]*?\?>/.test(code)) {
      failures.push({ file: path.relative(root, file) + " script " + index,
        message: "Contains an Apps Script control scriptlet that cannot be safely normalized." });
      continue;
    }
    parse(path.relative(root, file) + " inline script " + index, code);
    inline.push("// " + path.relative(root, file) + " script " + index + "\n" + code);
  }
  if (["Index.html", "Script.html"].includes(path.basename(file))) browserBlocks.push(...inline);
}
if (browserBlocks.length) parse("Index.html + Script.html (combined browser global scope)", browserBlocks.join("\n;\n"));

console.log("JavaScript syntax checks passed: " + passed.length);
for (const label of passed) console.log("PASS " + label);
if (failures.length) {
  console.error("\nJavaScript syntax checks failed: " + failures.length);
  for (const failure of failures) console.error("FAIL " + failure.file + ": " + failure.message);
  process.exit(1);
}
console.log("\nAll syntax checks passed.");

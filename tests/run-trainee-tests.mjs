import { build } from "esbuild";
import { mkdtemp, readdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const directory = await mkdtemp(join(tmpdir(), "legacy-trainee-tests-"));
try {
  const testFiles = (await readdir("tests")).filter(name => name.endsWith(".test.tsx")).sort();
  const result = await build({
    stdin: { contents: testFiles.map(name => `import ${JSON.stringify("./" + name)};`).join("\n"),
      resolveDir: resolve("tests"), sourcefile: "test-entry.tsx", loader: "tsx" },
    bundle: true, platform: "node", format: "esm",
    write: false, jsx: "automatic", loader: { ".css": "empty", ".png": "dataurl", ".svg": "dataurl" },
    define: { "import.meta.env.VITE_API_BASE_URL": '""', "process.env.NODE_ENV": '"test"' },
    external: ["node:*"], logLevel: "silent",
    banner: { js: 'import { createRequire } from "node:module"; const require = createRequire(import.meta.url);' },
  });
  const file = join(directory, "tests.mjs");
  await writeFile(file, result.outputFiles[0].contents);
  await import(pathToFileURL(file).href);
} finally {
  await rm(directory, { recursive: true, force: true });
}

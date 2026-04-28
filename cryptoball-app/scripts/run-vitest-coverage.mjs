import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = fileURLToPath(new URL(".", import.meta.url));
const repoRoot = resolve(scriptDir, "..");
const sourceRoot = resolve(repoRoot, "src");
const coverageRoot = resolve(repoRoot, ".vitest-coverage-src");
const customCoverageProvider = resolve(scriptDir, "coverage-provider.mjs");

const ts = await import("typescript");
const { createVitest } = await import("vitest/node");

function rewriteTsImportSpecifiers(code) {
  return code
    .replace(/(from\s+['"])([^'"]+)\.(ts|tsx)(['"])/g, "$1$2.js$4")
    .replace(/(import\(\s*['"])([^'"]+)\.(ts|tsx)(['"]\s*\))/g, "$1$2.js$4");
}

async function copyOrTranspileFile(sourcePath, targetPath) {
  const extension = extname(sourcePath);

  if (sourcePath.endsWith(".d.ts")) {
    return;
  }

  await mkdir(dirname(targetPath), { recursive: true });

  if (extension === ".ts" || extension === ".tsx") {
    const source = await readFile(sourcePath, "utf8");
    const result = ts.transpileModule(source, {
      compilerOptions: {
        jsx: ts.JsxEmit.ReactJSX,
        module: ts.ModuleKind.ESNext,
        sourceMap: false,
        target: ts.ScriptTarget.ES2020,
        inlineSourceMap: true,
        inlineSources: true,
      },
      fileName: sourcePath,
    });

    await writeFile(targetPath.replace(/\.(ts|tsx)$/i, ".js"), rewriteTsImportSpecifiers(result.outputText), "utf8");
    return;
  }

  await mkdir(dirname(targetPath), { recursive: true });
  await rm(targetPath, { force: true }).catch(() => {});
  await writeFile(targetPath, await readFile(sourcePath));
}

async function copyTree(sourceDir, targetDir) {
  await mkdir(targetDir, { recursive: true });
  const entries = await readdir(sourceDir, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = join(sourceDir, entry.name);
    const targetPath = join(targetDir, entry.name);

    if (entry.isDirectory()) {
      await copyTree(sourcePath, targetPath);
      continue;
    }

    if (entry.isFile()) {
      await copyOrTranspileFile(sourcePath, targetPath);
    }
  }
}

let vitest;

try {
  await rm(coverageRoot, { recursive: true, force: true });
  await copyTree(sourceRoot, join(coverageRoot, "src"));

  vitest = await createVitest(
    "test",
    {
      coverage: {
        enabled: true,
        provider: "custom",
        customProviderModule: customCoverageProvider,
      },
      environment: "jsdom",
      globals: true,
      run: true,
      watch: false,
    },
    {
      configFile: false,
      root: coverageRoot,
      dir: join(coverageRoot, "src"),
      plugins: [],
      resolve: {
        preserveSymlinks: true,
      },
      test: {
        coverage: {
          reporter: ["text", "html"],
        },
        environment: "jsdom",
        fileParallelism: false,
        globals: true,
        pool: "threads",
        poolOptions: {
          threads: {
            isolate: true,
            singleThread: true,
          },
        },
        setupFiles: "./src/test/setup.js",
      },
    },
  );

  await vitest.start();
} finally {
  await vitest?.close();
  await rm(coverageRoot, { recursive: true, force: true });
}

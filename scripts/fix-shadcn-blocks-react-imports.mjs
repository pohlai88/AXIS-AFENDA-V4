#!/usr/bin/env node

import { readFile, writeFile, readdir } from "fs/promises";
import { join } from "path";

const BLOCKS_DIR = "C:\\AI-BOS\\NEXIS-AFENDA-V4\\afenda\\packages\\shadcn\\src\\blocks";

const hasReactImport = (content) =>
  /from\s+["']react["']/.test(content) ||
  /import\s+\*\s+as\s+React\s+from\s+["']react["']/.test(content);

async function fixReactImports() {
  try {
    const files = await readdir(BLOCKS_DIR, { recursive: true });
    const componentFiles = files.filter(
      (file) =>
        (file.endsWith(".tsx") || file.endsWith(".ts")) &&
        !file.includes("node_modules")
    );

    let updated = 0;

    for (const file of componentFiles) {
      const filePath = join(BLOCKS_DIR, file);
      let content = await readFile(filePath, "utf-8");

      if (!/\bReact\./.test(content) || hasReactImport(content)) {
        continue;
      }

      const lines = content.split("\n");
      let insertAt = 0;

      if (lines[0]?.trim() === '"use client"') {
        insertAt = 1;
        if (lines[1]?.trim() === "") {
          insertAt = 2;
        }
      }

      lines.splice(insertAt, 0, "import * as React from \"react\"");
      content = lines.join("\n");

      await writeFile(filePath, content, "utf-8");
      console.log(`✓ Added React import to ${file}`);
      updated++;
    }

    console.log("\n✅ React import update complete!");
    console.log(`   Updated: ${updated} files`);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

fixReactImports();
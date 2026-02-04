#!/usr/bin/env node

import { readFile, writeFile, readdir } from "fs/promises";
import { join } from "path";

const CUSTOM_DIR = "C:\\AI-BOS\\NEXIS-AFENDA-V4\\afenda\\packages\\shadcn\\src\\custom";

async function fixCustomImports() {
  try {
    const files = await readdir(CUSTOM_DIR);
    const componentFiles = files.filter(
      (f) => (f.endsWith(".tsx") || f.endsWith(".ts")) && !f.startsWith(".")
    );

    let updated = 0;

    for (const file of componentFiles) {
      const filePath = join(CUSTOM_DIR, file);
      let content = await readFile(filePath, "utf-8");

      // Fix the import path for custom components (they're in custom/ subdirectory)
      if (content.includes('from "../lib/utils"')) {
        content = content.replace(
          /from ["']\.\.\/lib\/utils["']/g,
          'from "../../lib/utils"'
        );

        await writeFile(filePath, content, "utf-8");
        console.log(`✓ Updated ${file}`);
        updated++;
      }
    }

    console.log(`\n✅ Custom imports fixed!`);
    console.log(`   Updated: ${updated} files`);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

fixCustomImports();

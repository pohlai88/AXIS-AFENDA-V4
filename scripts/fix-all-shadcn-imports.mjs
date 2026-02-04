#!/usr/bin/env node

import { readFile, writeFile, readdir } from "fs/promises";
import { join } from "path";

const SHADCN_SRC = "C:\\AI-BOS\\NEXIS-AFENDA-V4\\afenda\\packages\\shadcn\\src";

async function fixAllImports() {
  try {
    const files = await readdir(SHADCN_SRC, { recursive: true });
    const componentFiles = files.filter(
      (f) => (f.endsWith(".tsx") || f.endsWith(".ts")) && !f.includes("node_modules")
    );

    let updated = 0;

    for (const file of componentFiles) {
      const filePath = join(SHADCN_SRC, file);
      let content = await readFile(filePath, "utf-8");
      let changed = false;

      // Fix missing ../ prefix for files in src root
      if (content.includes('from "lib/utils"') && !file.includes("\\")) {
        content = content.replace(/from "lib\/utils"/g, 'from "../lib/utils"');
        changed = true;
      }

      // Fix incorrect single ../ for files in custom subdirectory
      if (content.includes('from "../lib/utils"') && file.includes("custom\\")) {
        content = content.replace(/from "\.\.\/lib\/utils"/g, 'from "../../lib/utils"');
        changed = true;
      }

      if (changed) {
        await writeFile(filePath, content, "utf-8");
        console.log(`✓ Fixed ${file}`);
        updated++;
      }
    }

    console.log(`\n✅ All imports fixed!`);
    console.log(`   Updated: ${updated} files`);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

fixAllImports();

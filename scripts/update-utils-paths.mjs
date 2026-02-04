#!/usr/bin/env node

import { readFile, writeFile, readdir } from "fs/promises";
import { join } from "path";

const SHADCN_SRC = "C:\\AI-BOS\\NEXIS-AFENDA-V4\\afenda\\packages\\shadcn\\src";

async function updateUtilsPaths() {
  try {
    const files = await readdir(SHADCN_SRC, { recursive: true });
    const componentFiles = files.filter(
      (f) => (f.endsWith(".tsx") || f.endsWith(".ts")) && !f.includes("node_modules") && !f.includes("lib\\utils")
    );

    let updated = 0;

    for (const file of componentFiles) {
      const filePath = join(SHADCN_SRC, file);
      let content = await readFile(filePath, "utf-8");
      let changed = false;

      // Update imports for files in src root (from ../lib/utils to ./lib/utils)
      if (content.includes('from "../lib/utils"') && !file.includes("\\")) {
        content = content.replace(/from "\.\.\/lib\/utils"/g, 'from "./lib/utils"');
        changed = true;
      }

      // Update imports for files in custom subdirectory (from ../../lib/utils to ../lib/utils)
      if (content.includes('from "../../lib/utils"') && file.includes("custom\\")) {
        content = content.replace(/from "\.\.\/\.\.\/lib\/utils"/g, 'from "../lib/utils"');
        changed = true;
      }

      if (changed) {
        await writeFile(filePath, content, "utf-8");
        console.log(`✓ Updated ${file}`);
        updated++;
      }
    }

    console.log(`\n✅ Utils paths updated!`);
    console.log(`   Updated: ${updated} files`);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

updateUtilsPaths();

#!/usr/bin/env node

import { readFile, writeFile, readdir } from "fs/promises";
import { join } from "path";

const SHADCN_SRC = "C:\\AI-BOS\\NEXIS-AFENDA-V4\\afenda\\packages\\shadcn\\src";

async function updateImports() {
  try {
    const files = await readdir(SHADCN_SRC, { recursive: true });
    const componentFiles = files.filter(
      (f) => (f.endsWith(".tsx") || f.endsWith(".ts")) && !f.includes("node_modules")
    );

    let updated = 0;

    for (const file of componentFiles) {
      const filePath = join(SHADCN_SRC, file);
      let content = await readFile(filePath, "utf-8");

      // Check if file has the old import
      if (content.includes('from "@/lib/utils"')) {
        // Determine the correct relative path based on nesting
        const depth = file.split("\\").length - 1;
        const relativePath = "../".repeat(depth) + "lib/utils";

        // Replace the import
        content = content.replace(
          /from ["']@\/lib\/utils["']/g,
          `from "${relativePath}"`
        );

        await writeFile(filePath, content, "utf-8");
        console.log(`✓ Updated ${file}`);
        updated++;
      }
    }

    console.log(`\n✅ Import update complete!`);
    console.log(`   Updated: ${updated} files`);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

updateImports();

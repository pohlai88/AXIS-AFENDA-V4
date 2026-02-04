#!/usr/bin/env node

import { readFile, writeFile, readdir } from "fs/promises";
import { join } from "path";

const BLOCKS_DIR = "C:\\AI-BOS\\NEXIS-AFENDA-V4\\afenda\\packages\\shadcn\\src\\blocks";

async function fixBlocksImports() {
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
      let changed = false;

      if (content.includes('from "@/components/ui/')) {
        content = content.replace(
          /from ["']@\/components\/ui\/(.+?)["']/g,
          'from "./$1"'
        );
        changed = true;
      }

      if (content.includes('from "@/components/')) {
        content = content.replace(
          /from ["']@\/components\/(.+?)["']/g,
          'from "./$1"'
        );
        changed = true;
      }

      if (content.includes('from "@/hooks/use-mobile"')) {
        content = content.replace(
          /from ["']@\/hooks\/use-mobile["']/g,
          'from "./use-mobile"'
        );
        changed = true;
      }

      if (content.includes('from "@/lib/utils"')) {
        content = content.replace(
          /from ["']@\/lib\/utils["']/g,
          'from "../lib/utils"'
        );
        changed = true;
      }

      if (changed) {
        await writeFile(filePath, content, "utf-8");
        console.log(`✓ Updated ${file}`);
        updated++;
      }
    }

    console.log("\n✅ Blocks import update complete!");
    console.log(`   Updated: ${updated} files`);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

fixBlocksImports();
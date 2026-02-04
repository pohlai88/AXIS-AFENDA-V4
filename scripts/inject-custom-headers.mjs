#!/usr/bin/env node

import { readFile, writeFile, readdir } from "fs/promises";
import { join, basename } from "path";

const CUSTOM_DIR = "C:\\AI-BOS\\NEXIS-AFENDA-V4\\afenda\\packages\\shadcn\\src\\custom";

// Envelope header for custom components
const createCustomEnvelopeHeader = (componentName, isClient) => {
  const clientDirective = isClient ? '"use client"\n\n' : "";
  return `${clientDirective}/**
 * @domain shared
 * @layer ui
 * @responsibility Custom/extended ${componentName} component - Enhanced UI functionality
 * @owner afenda/shadcn
 * @dependencies
 * - shadcn/ui components
 * - @/lib/utils
 * @exports
 * - ${componentName} component
 */

`;
};

async function injectCustomHeaders() {
  try {
    const files = await readdir(CUSTOM_DIR);
    const componentFiles = files.filter(
      (f) => (f.endsWith(".tsx") || f.endsWith(".ts")) && !f.startsWith(".")
    );

    let updated = 0;
    let skipped = 0;

    for (const file of componentFiles) {
      const filePath = join(CUSTOM_DIR, file);
      const content = await readFile(filePath, "utf-8");

      // Skip if already has envelope header
      if (content.includes("@domain") || content.includes("@layer")) {
        console.log(`⊘ Skipped ${file} (already has envelope header)`);
        skipped++;
        continue;
      }

      const componentName = basename(file, file.endsWith(".tsx") ? ".tsx" : ".ts");
      const hasUseClient = content.trim().startsWith('"use client"');

      // Remove existing "use client" if present (we'll add it in the header)
      let cleanContent = content;
      if (hasUseClient) {
        cleanContent = content.replace(/^"use client"\s*\n+/, "");
      }

      const header = createCustomEnvelopeHeader(componentName, hasUseClient);
      const newContent = header + cleanContent;

      await writeFile(filePath, newContent, "utf-8");
      console.log(`✓ Updated ${file}`);
      updated++;
    }

    console.log(`\n✅ Custom components header injection complete!`);
    console.log(`   Updated: ${updated} files`);
    console.log(`   Skipped: ${skipped} files`);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

injectCustomHeaders();

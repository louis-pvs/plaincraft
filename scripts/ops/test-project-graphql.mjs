#!/usr/bin/env node
/**
 * test-project-graphql.mjs
 * Quick test to verify Project GraphQL fix
 */

import {
  loadProjectCache,
  findProjectItemByFieldValue,
} from "../_lib/github.mjs";

(async () => {
  try {
    console.log("Testing Project GraphQL fix...\n");

    const cache = await loadProjectCache({ cwd: process.cwd() });
    console.log("✅ Project cache loaded:", cache.cache.project.id);
    console.log("✅ Project title:", cache.cache.project.title);
    console.log(
      "✅ Available fields:",
      Object.keys(cache.cache.project.fields).join(", "),
    );

    const idField = cache.cache.project.fields.ID;
    if (!idField) {
      console.log("❌ ID field not found in project");
      process.exit(1);
    }

    console.log("\n✅ ID field found:", idField.id);
    console.log("\nSearching for C-111 in project...");

    const item = await findProjectItemByFieldValue({
      projectId: cache.cache.project.id,
      fieldId: idField.id,
      value: "C-111",
      cwd: process.cwd(),
    });

    if (item) {
      console.log("\n✅ Found item C-111!");
      console.log("  Item ID:", item.item.id);
      console.log("  Content:", item.item.content);
      console.log("\n  Fields:");
      for (const [fieldId, field] of item.fields.entries()) {
        console.log(`    - ${field.name}: ${field.value}`);
      }
      console.log(
        "\n🎉 Project GraphQL fix is working! Field access successful!",
      );
      process.exit(0);
    } else {
      console.log(
        "\n⚠️  Item C-111 not found in project (might not be added yet)",
      );
      console.log(
        "This is OK - the important thing is no GraphQL errors occurred!",
      );
      console.log(
        "\n🎉 Project GraphQL fix is working! No union selection errors!",
      );
      process.exit(0);
    }
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    if (error.message.includes("Selections can't be made directly on unions")) {
      console.error("\n❌ GraphQL union error still present - fix didn't work");
      process.exit(1);
    }
    console.error("\nStack:", error.stack);
    process.exit(1);
  }
})();

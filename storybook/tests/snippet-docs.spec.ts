import { test, expect } from "@playwright/test";

type StorybookIndexEntry = {
  id: string;
  title: string;
  type: string;
};

const STORYBOOK_INDEX_PATH = "index.json";
const SNIPPET_PREFIX = "Snippets/";

test("snippet docs surfaces metadata and renders", async ({
  page,
  request,
  baseURL,
}) => {
  const response = await request.get(STORYBOOK_INDEX_PATH);
  expect(
    response.ok(),
    "storybook index should resolve successfully",
  ).toBeTruthy();

  const data = (await response.json()) as {
    entries?: Record<string, StorybookIndexEntry>;
  };

  if (!data.entries) {
    throw new Error("storybook index missing `entries` payload");
  }

  const snippetDocs = Object.values(data.entries).filter(
    (entry) => entry.type === "docs" && entry.title.startsWith(SNIPPET_PREFIX),
  );

  expect(
    snippetDocs.length,
    "expected at least one snippet docs entry",
  ).toBeGreaterThan(0);

  const origin = baseURL ?? "http://127.0.0.1:6006";

  for (const doc of snippetDocs) {
    await test.step(`docs view renders for ${doc.title}`, async () => {
      const url = new URL("iframe.html", origin);
      url.searchParams.set("id", doc.id);
      url.searchParams.set("viewMode", "docs");

      await page.goto(url.toString(), { waitUntil: "networkidle" });

      const article = page.locator("article");
      await expect(article).toBeVisible();

      const heading = article.locator("h1").first();
      await expect(heading).toHaveText(/.+/);

      const templateRef = page.locator('[data-testid="docs-template-ref"]');
      await expect(templateRef).toHaveText(/.+/);
      await expect(templateRef).not.toHaveText(/missing scaffold_ref/i);

      const ownerHandle = page.locator('[data-testid="docs-owner-handle"]');
      await expect(ownerHandle).toHaveText(/.+/);
      await expect(ownerHandle).not.toHaveText(/unassigned/i);
    });
  }
});

<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from "vue";

import { decodeMermaidCode } from "./decode";

const props = defineProps<{ code: string }>();

const container = ref<HTMLDivElement | null>(null);
let mermaidApi:
  | {
      initialize?: (config: object) => void;
      render: (
        id: string,
        code: string,
      ) => Promise<{ svg: string; bindFunctions?: (element: Element) => void }>;
    }
  | undefined;
let initialized = false;

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const renderMermaid = async () => {
  if (typeof window === "undefined") return;
  if (!container.value) return;

  if (!mermaidApi) {
    const module = await import("mermaid");
    mermaidApi = module.default ?? module;
  }

  if (!initialized && mermaidApi?.initialize) {
    mermaidApi.initialize({ startOnLoad: false });
    initialized = true;
  }

  const code = decodeMermaidCode(props.code).trim();

  if (!code) {
    container.value.innerHTML =
      '<pre class="mermaid-error">Unable to decode Mermaid diagram.</pre>';
    return;
  }

  try {
    const { svg, bindFunctions } = await mermaidApi.render(
      `mermaid-${Math.random().toString(36).slice(2)}`,
      code,
    );

    container.value.innerHTML = svg;
    if (typeof bindFunctions === "function") {
      bindFunctions(container.value);
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown Mermaid render error";
    container.value.innerHTML = `<pre class="mermaid-error">${escapeHtml(
      message,
    )}</pre>`;
  }
};

onMounted(renderMermaid);

watch(
  () => props.code,
  async () => {
    await nextTick();
    await renderMermaid();
  },
);
</script>

<template>
  <div ref="container" class="mermaid-container" />
</template>

<style scoped>
.mermaid-container {
  display: flex;
  justify-content: center;
  overflow: auto;
}

.mermaid-container > svg {
  max-width: 100%;
}

.mermaid-error {
  color: var(--vp-c-danger-2, #f66);
  white-space: pre-wrap;
  font-family: var(
    --vp-font-family-mono,
    "SFMono-Regular",
    Consolas,
    monospace
  );
}
</style>

/// <reference types="vite/client" />

// Vue single-file component module shim for VitePress theme usage
declare module "*.vue" {
  import type { DefineComponent } from "vue";
  // Explicit records + unknown satisfy strictness without using `any`.
  export const component: DefineComponent<
    Record<string, unknown>,
    Record<string, unknown>,
    unknown
  >;
}

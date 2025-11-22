import{j as e}from"./jsx-runtime-BknaRBMW.js";import{useMDXComponents as f}from"./index-Dvug6qLr.js";import{e as x,f as b,h as s,S as r,i as j}from"./blocks-BC6ObMRy.js";import{S as l,B as u,E as y,I as g,R as v}from"./InlineEditLabel.stories-D_94AB_M.js";import"./iframe-JnBWXuYa.js";import"./preload-helper-C1FmrZbK.js";import"./index-Choc0itW.js";const a=`# Inline Edit Label

## When to use

- Ship inline renaming without rebuilding accessibility or optimistic save flows.
- Reuse the proven Storybook narrative and Playbook rationale for consistency.
- Keep UX changes fast by swapping views while the headless controller stays stable.

## Scaffold

\`\`\`bash
pnpm run new:snippet InlineEditLabel -- --dry-run
# scaffold_ref: /templates/snippet-inline-edit-label@v0.1
\`\`\`

## Wire

- Import \`InlineEditLabel\` from \`/snippets/InlineEditLabel/InlineEditLabel\`.
- Provide \`value\`, \`onSave\`, and \`ariaLabel\`; the controller handles focus + keys.
- Switch to \`InlineEditLabelHeadless\` when design needs a custom render function.
- Pass a \`labels\` object to surface tailored UI copy for \`saving\`, \`success\`,
  \`error\`, or \`discarded\` states. Legacy \`*Label\` props still forward to the new
  contract if you need a staggered migration.
- Use \`emptyValuePlaceholder\` when the saved value can start empty to keep the button discoverable.

## Test

\`\`\`bash
pnpm test --filter InlineEditLabel
\`\`\`

## Rollback

\`\`\`bash
git restore snippets/InlineEditLabel
\`\`\`

## Links

- USAGE: /templates/snippet-inline-edit-label/USAGE.md
- Storybook: /storybook/?path=/docs/patterns-inline-edit--docs
- Playbook: /playbook/patterns/inline-edit-label.html

<!-- prettier-ignore -->
_Owner: @lane-c
`,i=a.match(/scaffold_ref:\s*([^\s]+)/i),o=a.match(/^_Owner:\s*(@[^\s]+)/im);var h;const d=((h=i==null?void 0:i[1])==null?void 0:h.trim())??"Missing scaffold_ref";var m;const c=((m=o==null?void 0:o[1])==null?void 0:m.trim())??"Unassigned";function p(t){const n={h2:"h2",p:"p",...f(),...t.components};return e.jsxs(e.Fragment,{children:[e.jsx(x,{of:l}),`
`,e.jsxs("div",{style:{display:"flex",gap:"1rem",marginBottom:"1rem",flexWrap:"wrap"},children:[e.jsxs("div",{children:[e.jsx("div",{style:{fontSize:"0.75rem",letterSpacing:"0.08em",textTransform:"uppercase",color:"var(--text-muted-color)"},children:e.jsx(n.p,{children:"Template"})}),e.jsx("code",{"data-testid":"docs-template-ref",style:d==="Missing scaffold_ref"?{color:"var(--color-danger-text)"}:void 0,children:d})]}),e.jsxs("div",{children:[e.jsx("div",{style:{fontSize:"0.75rem",letterSpacing:"0.08em",textTransform:"uppercase",color:"var(--text-muted-color)"},children:e.jsx(n.p,{children:"Owner"})}),e.jsx("code",{"data-testid":"docs-owner-handle",style:c==="Unassigned"?{color:"var(--color-danger-text)"}:void 0,children:c})]})]}),`
`,e.jsx(b,{children:a}),`
`,e.jsx(n.h2,{id:"interactive",children:"Interactive"}),`
`,e.jsx(s,{children:e.jsx(r,{of:u})}),`
`,e.jsx(n.h2,{id:"empty-state",children:"Empty state"}),`
`,e.jsx(s,{children:e.jsx(r,{of:y})}),`
`,e.jsx(n.h2,{id:"interaction-test",children:"Interaction test"}),`
`,e.jsx(s,{children:e.jsx(r,{of:g})}),`
`,e.jsx(n.h2,{id:"error-path",children:"Error path"}),`
`,e.jsx(s,{children:e.jsx(r,{of:v})}),`
`,e.jsx(n.h2,{id:"props",children:"Props"}),`
`,e.jsx(j,{of:l})]})}function U(t={}){const{wrapper:n}={...f(),...t.components};return n?e.jsx(n,{...t,children:e.jsx(p,{...t})}):p(t)}export{U as default,c as ownerHandle,o as ownerMatch,d as scaffoldRef,i as scaffoldRefMatch};

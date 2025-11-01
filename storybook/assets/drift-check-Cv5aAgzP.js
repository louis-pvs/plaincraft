import{j as e}from"./jsx-runtime-DrddQA2g.js";import{useMDXComponents as t}from"./index-DgU72DYT.js";import{M as r}from"./blocks-B8EYL8HM.js";import"./iframe-EtIushdw.js";import"./preload-helper-C1FmrZbK.js";import"./index-CQ8wcDbC.js";function s(i){const n={a:"a",code:"code",h1:"h1",h2:"h2",li:"li",p:"p",pre:"pre",strong:"strong",ul:"ul",...t(),...i.components};return e.jsxs(e.Fragment,{children:[e.jsx(r,{title:"Governance/Drift Check"}),`
`,e.jsx(n.h1,{id:"drift-check-view",children:"Drift Check (view)"}),`
`,e.jsx(n.p,{children:"Lifecycle drift happens when idea metadata (lane, status) stops matching the GitHub Project record. The drift checker gives every lane a quick sanity scan so we can fix the narrative before pushing."}),`
`,e.jsx(n.h2,{id:"command-contract",children:"Command Contract"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-bash",children:`# Scan all ideas (dry-run only)
pnpm drift:check --output json

# Focus on the idea you just edited
pnpm drift:check -- --paths ideas/ARCH-scripts-first-automation-suite.md --output json
`})}),`
`,e.jsxs(n.ul,{children:[`
`,e.jsx(n.li,{children:"Always run drift before sending a PR review or project status update."}),`
`,e.jsxs(n.li,{children:["CI runs the same command inside ",e.jsx(n.code,{children:"pnpm guardrails"}),"; local noise must be cleared before merge."]}),`
`,e.jsx(n.li,{children:"Output is JSON friendly so you can drop it in a PR comment or status note when calling out clean-up work."}),`
`]}),`
`,e.jsx(n.h2,{id:"typical-fixes",children:"Typical Fixes"}),`
`,e.jsxs(n.ul,{children:[`
`,e.jsxs(n.li,{children:[e.jsxs(n.strong,{children:["Missing ",e.jsx(n.code,{children:"Status:"})," section"]})," — add a status log near the bottom of the idea (",e.jsx(n.code,{children:"- 2025-11-03 – Updated to \\"}),"Branched``)."]}),`
`,e.jsxs(n.li,{children:[e.jsx(n.strong,{children:"Unknown status"})," — align with the canonical list from ",e.jsx(n.code,{children:"scripts/config/lifecycle.json"})," (",e.jsx(n.code,{children:"Draft, Ticketed, Branched, PR Open, In Review, Merged, Archived"}),")."]}),`
`,e.jsxs(n.li,{children:[e.jsx(n.strong,{children:"Lane mismatch"})," — ensure the idea header still begins with ",e.jsx(n.code,{children:"Lane: <letter>"})," so automation can map the card back to the right backlog owner."]}),`
`]}),`
`,e.jsx(n.h2,{id:"links",children:"Links"}),`
`,e.jsxs(n.ul,{children:[`
`,e.jsxs(n.li,{children:["Lifecycle Config (",e.jsx(n.code,{children:"scripts/config/lifecycle.json"}),")"]}),`
`,e.jsxs(n.li,{children:["Guardrail Suite (",e.jsx(n.code,{children:"pnpm guardrails"}),")"]}),`
`,e.jsxs(n.li,{children:["Playbook: ",e.jsx(n.a,{href:"https://louis-pvs.github.io/plaincraft/playbook/patterns/scripts-first-lifecycle-overview.html",rel:"nofollow",children:"Scripts-First Lifecycle Overview"})]}),`
`]})]})}function u(i={}){const{wrapper:n}={...t(),...i.components};return n?e.jsx(n,{...i,children:e.jsx(s,{...i})}):s(i)}export{u as default};

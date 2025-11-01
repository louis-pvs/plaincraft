import{j as e}from"./jsx-runtime-DrddQA2g.js";import{useMDXComponents as r}from"./index-DgU72DYT.js";import{M as i}from"./blocks-B8EYL8HM.js";import"./iframe-EtIushdw.js";import"./preload-helper-C1FmrZbK.js";import"./index-CQ8wcDbC.js";function t(n){const s={code:"code",h1:"h1",h2:"h2",li:"li",p:"p",ul:"ul",...r(),...n.components};return e.jsxs(e.Fragment,{children:[e.jsx(i,{title:"Governance/Script Automation"}),`
`,e.jsx(s.h1,{id:"script-automation-view",children:"Script Automation (view)"}),`
`,e.jsx(s.p,{children:"Scripts orchestrate Plaincraft’s guardrails. Every new helper must ship with the standard CLI contract so teams trust dry-runs and CI outputs."}),`
`,e.jsx(s.h2,{id:"signals-to-watch",children:"Signals to Watch"}),`
`,e.jsxs(s.ul,{children:[`
`,e.jsxs(s.li,{children:["Missing ",e.jsx(s.code,{children:"--dry-run"})," defaults or ",e.jsx(s.code,{children:"--yes"})," gates point to unsafe execution."]}),`
`,e.jsx(s.li,{children:"Scripts over 300 LOC tend to hide untested branches—schedule a refactor."}),`
`,e.jsx(s.li,{children:"Lack of smoke-test coverage means ops commands drift without alerting CI."}),`
`]}),`
`,e.jsx(s.h2,{id:"worked-example",children:"Worked Example"}),`
`,e.jsxs(s.p,{children:[e.jsx(s.code,{children:"consolidate-changelog.mjs"})," pairs the script template with Playbook storytelling. The CLI defaults to preview mode, exposes JSON/text output, and records run IDs for incident reviews. When Lane D ships release notes, the dry-run output is shared before toggling ",e.jsx(s.code,{children:"--yes"}),"."]}),`
`,e.jsx(s.h2,{id:"hand-off-links",children:"Hand-off Links"}),`
`,e.jsxs(s.ul,{children:[`
`,e.jsxs(s.li,{children:["Template README → ",e.jsx(s.code,{children:"/templates/script/README.md"})]}),`
`,e.jsxs(s.li,{children:["Template USAGE → ",e.jsx(s.code,{children:"/templates/script/USAGE.md"})]}),`
`,e.jsxs(s.li,{children:["Guardrail suite → ",e.jsx(s.code,{children:"scripts/checks/policy-lint.mjs"}),", ",e.jsx(s.code,{children:"scripts/checks/smoke.mjs"}),", ",e.jsx(s.code,{children:"scripts/checks/size-check.mjs"})]}),`
`]}),`
`,e.jsx(s.h2,{id:"constraints",children:"Constraints"}),`
`,e.jsxs(s.ul,{children:[`
`,e.jsxs(s.li,{children:["Include the template header (",e.jsx(s.code,{children:"@since"}),", ",e.jsx(s.code,{children:"@version"}),", ",e.jsx(s.code,{children:"Summary"}),") and exit-code semantics."]}),`
`,e.jsxs(s.li,{children:["Keep all writes behind ",e.jsx(s.code,{children:"--yes"}),". Dry-runs must log intended mutations."]}),`
`,e.jsxs(s.li,{children:["Prefer ",e.jsx(s.code,{children:"_lib/"})," helpers for shared logic to keep ops scripts composable."]}),`
`,e.jsxs(s.li,{children:["Run focused tests (",e.jsx(s.code,{children:"pnpm scripts:test -- --filter <script>"}),") before shipping, and always cover the worktree bootstrap spec (",e.jsx(s.code,{children:"--filter create-worktree-pr"}),") when ",e.jsx(s.code,{children:"pnpm gh:worktree"})," behavior shifts."]}),`
`]})]})}function p(n={}){const{wrapper:s}={...r(),...n.components};return s?e.jsx(s,{...n,children:e.jsx(t,{...n})}):t(n)}export{p as default};

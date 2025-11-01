import{j as e}from"./jsx-runtime-DrddQA2g.js";import{useMDXComponents as t}from"./index-DgU72DYT.js";import{M as r}from"./blocks-B8EYL8HM.js";import"./iframe-EtIushdw.js";import"./preload-helper-C1FmrZbK.js";import"./index-CQ8wcDbC.js";function i(s){const n={code:"code",h1:"h1",h2:"h2",li:"li",p:"p",ul:"ul",...t(),...s.components};return e.jsxs(e.Fragment,{children:[e.jsx(r,{title:"Governance/Roadmap Onboarding"}),`
`,e.jsx(n.h1,{id:"roadmap-onboarding-view",children:"Roadmap Onboarding (view)"}),`
`,e.jsx(n.p,{children:"The Plaincraft Roadmap keeps lanes visible across Issues, PRs, and templates. A consistent setup means automation can push cards, enforce WIP limits, and surface metrics without manual cleanup."}),`
`,e.jsx(n.h2,{id:"signals-to-watch",children:"Signals to Watch"}),`
`,e.jsxs(n.ul,{children:[`
`,e.jsx(n.li,{children:"Missing lane labels or mismatched project IDs break CI status mirrors."}),`
`,e.jsx(n.li,{children:"Views without WIP caps invite scope creep for each lane."}),`
`,e.jsx(n.li,{children:"Scripts failing to find the roadmap indicate authentication or project drift."}),`
`]}),`
`,e.jsx(n.h2,{id:"worked-example",children:"Worked Example"}),`
`,e.jsxs(n.p,{children:["During the README migration, Lane D cloned the roadmap template, ran ",e.jsx(n.code,{children:"gh:setup-project"}),", and used the generated output to confirm automation IDs. The project surfaced PB-readme narratives under Lane B while Lane C tracked guardrail scripts under Lane C views."]}),`
`,e.jsx(n.h2,{id:"hand-off-links",children:"Hand-off Links"}),`
`,e.jsxs(n.ul,{children:[`
`,e.jsxs(n.li,{children:["Template README → ",e.jsx(n.code,{children:"/templates/roadmap-project/README.md"})]}),`
`,e.jsxs(n.li,{children:["Template USAGE → ",e.jsx(n.code,{children:"/templates/roadmap-project/USAGE.md"})]}),`
`,e.jsxs(n.li,{children:["Automation scripts → ",e.jsx(n.code,{children:"scripts/ops/setup-project.mjs"}),", ",e.jsx(n.code,{children:"scripts/ops/setup-labels.mjs"})]}),`
`]}),`
`,e.jsx(n.h2,{id:"constraints",children:"Constraints"}),`
`,e.jsxs(n.ul,{children:[`
`,e.jsxs(n.li,{children:["Keep the project name and custom fields aligned with ",e.jsx(n.code,{children:"pipeline-config.json"}),"."]}),`
`,e.jsxs(n.li,{children:["Lane views must filter by ",e.jsx(n.code,{children:"lane:<letter>"})," and honor the WIP limit of 3."]}),`
`,e.jsxs(n.li,{children:["Refresh GitHub CLI tokens with ",e.jsx(n.code,{children:"project"})," scope before running setup scripts."]}),`
`]})]})}function p(s={}){const{wrapper:n}={...t(),...s.components};return n?e.jsx(n,{...s,children:e.jsx(i,{...s})}):i(s)}export{p as default};

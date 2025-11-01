import{j as e}from"./jsx-runtime-DrddQA2g.js";import{useMDXComponents as i}from"./index-DgU72DYT.js";import{M as r}from"./blocks-B8EYL8HM.js";import"./iframe-EtIushdw.js";import"./preload-helper-C1FmrZbK.js";import"./index-CQ8wcDbC.js";function t(n){const s={code:"code",h1:"h1",h2:"h2",li:"li",p:"p",pre:"pre",strong:"strong",ul:"ul",...i(),...n.components};return e.jsxs(e.Fragment,{children:[e.jsx(r,{title:"Governance/Lifecycle Intake"}),`
`,e.jsx(s.h1,{id:"lifecycle-intake-view",children:"Lifecycle Intake (view)"}),`
`,e.jsx(s.p,{children:"Move an approved idea into the Scripts-First lifecycle without rewriting the narrative by hand. Intake keeps the idea file as the content source of truth while the GitHub Project card captures status, lane, and owner fields for reporting."}),`
`,e.jsx(s.h2,{id:"system-of-record",children:"System of Record"}),`
`,e.jsxs(s.ul,{children:[`
`,e.jsxs(s.li,{children:[e.jsx(s.strong,{children:"Content:"})," ",e.jsx(s.code,{children:"/ideas/<ID>-*.md"})," (updated via idea file edits or automation)"]}),`
`,e.jsxs(s.li,{children:[e.jsx(s.strong,{children:"Status:"})," GitHub Projects – ",e.jsx(s.code,{children:"Status"}),", ",e.jsx(s.code,{children:"Lane"}),", ",e.jsx(s.code,{children:"Priority"}),", ",e.jsx(s.code,{children:"Owner"})," fields"]}),`
`,e.jsxs(s.li,{children:[e.jsx(s.strong,{children:"Automation:"})," ",e.jsx(s.code,{children:"pnpm ideas:create <idea>"})," → ",e.jsx(s.code,{children:"scripts/ops/ideas-to-issues.mjs"})]}),`
`]}),`
`,e.jsx(s.h2,{id:"command-contract",children:"Command Contract"}),`
`,e.jsx(s.pre,{children:e.jsx(s.code,{className:"language-bash",children:`# When a PB/ARCH/U idea is ready for work
pnpm ideas:create ideas/PB-scripts-first-lifecycle-rollout.md --yes
`})}),`
`,e.jsxs(s.ul,{children:[`
`,e.jsxs(s.li,{children:["No arguments defaults to dry-run; pass ",e.jsx(s.code,{children:"--yes"})," to write."]}),`
`,e.jsx(s.li,{children:"The script validates headings, acceptance, and metadata before touching GitHub."}),`
`,e.jsx(s.li,{children:"Successful runs create/update the linked Issue and stamp the Project fields."}),`
`]}),`
`,e.jsx(s.h2,{id:"worked-example",children:"Worked Example"}),`
`,e.jsxs(s.p,{children:[e.jsx(s.code,{children:"pnpm ideas:create ideas/PB-scripts-first-lifecycle-rollout.md --yes"})," validates the Playbook idea, syncs the metadata to GitHub, and ensures the Project card is present with ",e.jsx(s.code,{children:"Status = Ticketed"}),". The dry-run output shows the idea diff plus the pending Issue payload so stakeholders can review before execution. Because ",e.jsx(s.code,{children:"scripts/ops/ideas-to-issues.mjs"})," sources the story from the Markdown frontmatter, the Playbook and Projects stay in sync automatically."]}),`
`,e.jsx(s.h2,{id:"constraints",children:"Constraints"}),`
`,e.jsxs(s.ul,{children:[`
`,e.jsxs(s.li,{children:["Keep ",e.jsx(s.code,{children:"Lane"}),", ",e.jsx(s.code,{children:"Priority"}),", and ",e.jsx(s.code,{children:"Owner"})," fields inside the idea frontmatter; automation copies them to the Project card."]}),`
`,e.jsx(s.li,{children:"Acceptance checklists must use GitHub-flavoured markdown checkboxes so the script can sync completion state with the Issue body."}),`
`,e.jsx(s.li,{children:"Avoid editing Project status manually; follow-up commands reconcile the source of truth based on scripted transitions."}),`
`]}),`
`,e.jsx(s.h2,{id:"hand-off-links",children:"Hand-off Links"}),`
`,e.jsxs(s.ul,{children:[`
`,e.jsxs(s.li,{children:["Template README → ",e.jsx(s.code,{children:"/templates/ideas/README.md"})]}),`
`,e.jsxs(s.li,{children:["Template USAGE → ",e.jsx(s.code,{children:"/templates/ideas/USAGE.md"})]}),`
`,e.jsxs(s.li,{children:["Guardrail Script → ",e.jsx(s.code,{children:"/scripts/checks/validate-ideas.mjs"})]}),`
`,e.jsxs(s.li,{children:["Lifecycle Overview → ",e.jsx(s.code,{children:"/storybook/?path=/docs/governance-lifecycle-overview--docs"})]}),`
`]})]})}function u(n={}){const{wrapper:s}={...i(),...n.components};return s?e.jsx(s,{...n,children:e.jsx(t,{...n})}):t(n)}export{u as default};

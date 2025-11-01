import{j as e}from"./jsx-runtime-DrddQA2g.js";import{useMDXComponents as t}from"./index-DgU72DYT.js";import{M as r}from"./blocks-B8EYL8HM.js";import"./iframe-EtIushdw.js";import"./preload-helper-C1FmrZbK.js";import"./index-CQ8wcDbC.js";function n(i){const s={code:"code",h1:"h1",h2:"h2",li:"li",p:"p",ul:"ul",...t(),...i.components};return e.jsxs(e.Fragment,{children:[e.jsx(r,{title:"Governance/Ideas Pipeline"}),`
`,e.jsx(s.h1,{id:"ideas-pipeline-view",children:"Ideas Pipeline (view)"}),`
`,e.jsxs(s.p,{children:["Plaincraft treats ",e.jsx(s.code,{children:"/ideas"})," as the single source of truth for delivery work. Cards seed Issues, PRs, and release notes, so a healthy pipeline keeps automation honest and reviewers in context."]}),`
`,e.jsx(s.h2,{id:"signals-to-watch",children:"Signals to Watch"}),`
`,e.jsxs(s.ul,{children:[`
`,e.jsxs(s.li,{children:["Missing ",e.jsx(s.code,{children:"Lane:"})," metadata or acceptance checklists hints at automation drift."]}),`
`,e.jsxs(s.li,{children:["Parent ideas without ",e.jsx(s.code,{children:"## Sub-Issues"})," make sub-issue progress invisible downstream."]}),`
`,e.jsxs(s.li,{children:["Cards lingering in ",e.jsx(s.code,{children:"/ideas/"})," after merge clog the roadmap audit trail."]}),`
`]}),`
`,e.jsx(s.h2,{id:"worked-example",children:"Worked Example"}),`
`,e.jsxs(s.p,{children:["When ",e.jsx(s.code,{children:"PB-readme-narrative-migration"})," moved into delivery, the idea card anchored the acceptance list. Running ",e.jsx(s.code,{children:"ideas-to-issues"})," synced checklists to GitHub, ",e.jsx(s.code,{children:"pnpm gh:worktree"})," updated the same card to include the new issue number and ",e.jsx(s.code,{children:"status: in-progress"}),", and ",e.jsx(s.code,{children:"merge-subissue-to-parent"})," refreshed the parent PR each time a child branch merged. The card stayed authoritative until archival."]}),`
`,e.jsx(s.h2,{id:"hand-off-links",children:"Hand-off Links"}),`
`,e.jsxs(s.ul,{children:[`
`,e.jsxs(s.li,{children:["Template README → ",e.jsx(s.code,{children:"/templates/ideas/README.md"})]}),`
`,e.jsxs(s.li,{children:["Template USAGE → ",e.jsx(s.code,{children:"/templates/ideas/USAGE.md"})]}),`
`,e.jsxs(s.li,{children:["Ops scripts → ",e.jsx(s.code,{children:"scripts/ops/ideas-to-issues.mjs"}),", ",e.jsx(s.code,{children:"scripts/ops/create-worktree-pr.mjs"}),", ",e.jsx(s.code,{children:"scripts/ops/merge-subissue-to-parent.mjs"})]}),`
`]}),`
`,e.jsx(s.h2,{id:"constraints",children:"Constraints"}),`
`,e.jsxs(s.ul,{children:[`
`,e.jsx(s.li,{children:"Card exists before Issue; automation refuses to run otherwise."}),`
`,e.jsxs(s.li,{children:["Bootstrapping a branch with ",e.jsx(s.code,{children:"pnpm gh:worktree"})," must leave the real idea file at ",e.jsx(s.code,{children:"status: in-progress"})," with the assigned ",e.jsx(s.code,{children:"Issue: #"})," so downstream automation can trust it."]}),`
`,e.jsx(s.li,{children:"Ticket prefixes drive PR titles, changelog slugs, and roadmap cards—keep them aligned."}),`
`,e.jsxs(s.li,{children:["Archive closed ideas promptly to keep the ",e.jsx(s.code,{children:"/ideas"})," directory actionable."]}),`
`]})]})}function p(i={}){const{wrapper:s}={...t(),...i.components};return s?e.jsx(s,{...i,children:e.jsx(n,{...i})}):n(i)}export{p as default};

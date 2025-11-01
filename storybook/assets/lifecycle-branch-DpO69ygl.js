import{j as e}from"./jsx-runtime-DrddQA2g.js";import{useMDXComponents as r}from"./index-DgU72DYT.js";import{M as i}from"./blocks-B8EYL8HM.js";import"./iframe-EtIushdw.js";import"./preload-helper-C1FmrZbK.js";import"./index-CQ8wcDbC.js";function t(s){const n={code:"code",h1:"h1",h2:"h2",li:"li",p:"p",pre:"pre",strong:"strong",ul:"ul",...r(),...s.components};return e.jsxs(e.Fragment,{children:[e.jsx(i,{title:"Governance/Lifecycle Branch"}),`
`,e.jsx(n.h1,{id:"lifecycle-branch-view",children:"Lifecycle Branch (view)"}),`
`,e.jsxs(n.p,{children:["Branch creation is the first irreversible signal that work has started. The ",e.jsx(n.code,{children:"pnpm gh:worktree"})," command keeps the branch, idea file, and draft PR aligned so Projects can promote the ticket without manual edits."]}),`
`,e.jsx(n.h2,{id:"system-of-record",children:"System of Record"}),`
`,e.jsxs(n.ul,{children:[`
`,e.jsxs(n.li,{children:[e.jsx(n.strong,{children:"Content:"})," ",e.jsx(n.code,{children:"/ideas/<ID>-*.md"})," (Issue number + status written during bootstrap)"]}),`
`,e.jsxs(n.li,{children:[e.jsx(n.strong,{children:"Status:"})," GitHub Projects – ",e.jsx(n.code,{children:"Status"})," moves from ",e.jsx(n.code,{children:"Ticketed"})," → ",e.jsx(n.code,{children:"Branched"})]}),`
`,e.jsxs(n.li,{children:[e.jsx(n.strong,{children:"Automation:"})," ",e.jsx(n.code,{children:"pnpm gh:worktree <issue>"})," → ",e.jsx(n.code,{children:"scripts/ops/create-worktree-pr.mjs"})]}),`
`]}),`
`,e.jsx(n.h2,{id:"command-contract",children:"Command Contract"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-bash",children:`# Bootstrap a worktree + branch for issue #91
pnpm gh:worktree 91 --yes
`})}),`
`,e.jsxs(n.ul,{children:[`
`,e.jsx(n.li,{children:"Dry-run prints the planned branch name, idea diff, and PR metadata."}),`
`,e.jsxs(n.li,{children:[e.jsx(n.code,{children:"--yes"})," creates the worktree, pushes a bootstrap commit, and opens a draft PR."]}),`
`,e.jsxs(n.li,{children:[e.jsx(n.code,{children:"--base <branch>"})," lets you pivot off something other than ",e.jsx(n.code,{children:"main"}),"."]}),`
`]}),`
`,e.jsx(n.h2,{id:"worked-example",children:"Worked Example"}),`
`,e.jsxs(n.p,{children:[e.jsx(n.code,{children:"pnpm gh:worktree 91 --yes"})," finds the Playbook idea, writes ",e.jsx(n.code,{children:"Issue: #91"})," and ",e.jsx(n.code,{children:"Status: in-progress"})," into the frontmatter, and commits the change so the branch exists before code lands. The command opens a draft PR with the acceptance checklist pulled from the idea and bumps the Project item to ",e.jsx(n.code,{children:"Branched"}),". Dry-run JSON is attached to status updates so stakeholders can follow along even before the first commit lands."]}),`
`,e.jsx(n.h2,{id:"constraints",children:"Constraints"}),`
`,e.jsxs(n.ul,{children:[`
`,e.jsxs(n.li,{children:["Leave ",e.jsx(n.code,{children:"Issue"})," and ",e.jsx(n.code,{children:"Status"})," lines in the idea frontmatter; the script mutates them in-place."]}),`
`,e.jsxs(n.li,{children:["Keep idea titles prefixed with ",e.jsx(n.code,{children:"[ID]"})," so the command can locate the source document."]}),`
`,e.jsx(n.li,{children:"Do not hand-create branches that bypass the bootstrap commit—PR creation relies on the scripted branch push."}),`
`]}),`
`,e.jsx(n.h2,{id:"hand-off-links",children:"Hand-off Links"}),`
`,e.jsxs(n.ul,{children:[`
`,e.jsxs(n.li,{children:["Unit README → ",e.jsx(n.code,{children:"/scripts/ops/README.md"})]}),`
`,e.jsxs(n.li,{children:["Unit Script → ",e.jsx(n.code,{children:"/scripts/ops/create-worktree-pr.mjs"})]}),`
`,e.jsxs(n.li,{children:["Template README → ",e.jsx(n.code,{children:"/templates/script/README.md"})]}),`
`,e.jsxs(n.li,{children:["Template USAGE → ",e.jsx(n.code,{children:"/templates/script/USAGE.md"})]}),`
`]})]})}function m(s={}){const{wrapper:n}={...r(),...s.components};return n?e.jsx(n,{...s,children:e.jsx(t,{...s})}):t(s)}export{m as default};

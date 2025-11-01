import{j as e}from"./jsx-runtime-DrddQA2g.js";import{useMDXComponents as t}from"./index-DgU72DYT.js";import{M as c}from"./blocks-B8EYL8HM.js";import"./iframe-EtIushdw.js";import"./preload-helper-C1FmrZbK.js";import"./index-CQ8wcDbC.js";function o(s){const n={code:"code",h1:"h1",h2:"h2",li:"li",p:"p",pre:"pre",strong:"strong",ul:"ul",...t(),...s.components};return e.jsxs(e.Fragment,{children:[e.jsx(c,{title:"Governance/Lifecycle Closeout"}),`
`,e.jsx(n.h1,{id:"lifecycle-closeout-view",children:"Lifecycle Closeout (view)"}),`
`,e.jsxs(n.p,{children:["Closeout ties the branch, changelog, and idea archive together so the lifecycle finishes cleanly. Use the lifecycle closeout command to archive the idea, update the changelog, and promote the Project card to ",e.jsx(n.code,{children:"Merged"}),", then publish the governance snapshot."]}),`
`,e.jsx(n.h2,{id:"system-of-record",children:"System of Record"}),`
`,e.jsxs(n.ul,{children:[`
`,e.jsxs(n.li,{children:[e.jsx(n.strong,{children:"Content:"})," ",e.jsx(n.code,{children:"/ideas/<ID>-*.md"})," (final status and archive location)"]}),`
`,e.jsxs(n.li,{children:[e.jsx(n.strong,{children:"Status:"})," GitHub Projects – ",e.jsx(n.code,{children:"Status"})," moves from ",e.jsx(n.code,{children:"In Review"})," → ",e.jsx(n.code,{children:"Merged"})," → ",e.jsx(n.code,{children:"Archived"})]}),`
`,e.jsxs(n.li,{children:[e.jsx(n.strong,{children:"Automation:"})," ",e.jsx(n.code,{children:"pnpm ops:closeout -- --id <ID> --yes"})," + ",e.jsx(n.code,{children:"pnpm ops:report -- --yes"})]}),`
`]}),`
`,e.jsx(n.h2,{id:"command-contract",children:"Command Contract"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-bash",children:`# Archive lifecycle artifacts and publish governance snapshot
pnpm ops:closeout -- --id ARCH-123 --yes
pnpm ops:report -- --yes
`})}),`
`,e.jsxs(n.ul,{children:[`
`,e.jsxs(n.li,{children:[e.jsx(n.code,{children:"ops:closeout"})," archives the idea (optional), appends the changelog entry, and updates the Project status to ",e.jsx(n.code,{children:"Merged"}),"."]}),`
`,e.jsxs(n.li,{children:[e.jsx(n.code,{children:"ops:report"})," writes ",e.jsx(n.code,{children:"artifacts/lifecycle/status.json"})," and appends a summary to ",e.jsx(n.code,{children:"$GITHUB_STEP_SUMMARY"})," when running in CI."]}),`
`,e.jsxs(n.li,{children:["Both commands default to dry-run; capture and attach the transcripts before running with ",e.jsx(n.code,{children:"--yes"}),"."]}),`
`]}),`
`,e.jsx(n.h2,{id:"worked-example",children:"Worked Example"}),`
`,e.jsxs(n.p,{children:["After the branch merges, ",e.jsx(n.code,{children:"pnpm ops:closeout -- --id ARCH-123 --yes"})," moves the idea file under ",e.jsx(n.code,{children:"/ideas/_archive/<year>/"}),", appends the closeout note to ",e.jsx(n.code,{children:"CHANGELOG.md"}),", and flips the Project card to ",e.jsx(n.code,{children:"Merged"}),". Finally, ",e.jsx(n.code,{children:"pnpm ops:report -- --yes"})," refreshes ",e.jsx(n.code,{children:"artifacts/lifecycle/status.json"})," so governance dashboards pick up the new schema snapshot. Attach both dry-run transcripts to the Project note for future audits."]}),`
`,e.jsx(n.h2,{id:"constraints",children:"Constraints"}),`
`,e.jsxs(n.ul,{children:[`
`,e.jsxs(n.li,{children:["Keep ",e.jsx(n.code,{children:"_tmp/"})," entries under version control so dry-run diffs capture pending release notes (closeout automatically appends the consolidated entry)."]}),`
`,e.jsxs(n.li,{children:[e.jsx(n.code,{children:"ops:closeout"})," expects the idea filename to match the Issue ID; do not rename files after intake."]}),`
`,e.jsxs(n.li,{children:["Run closeout commands from the main worktree or sandbox worktree so git history and changelog diffs stay accurate. For CI, run ",e.jsx(n.code,{children:"pnpm scripts:lifecycle-smoke --execute --sandbox <path>"})," before invoking the write-mode scripts."]}),`
`]}),`
`,e.jsx(n.h2,{id:"hand-off-links",children:"Hand-off Links"}),`
`,e.jsxs(n.ul,{children:[`
`,e.jsxs(n.li,{children:["Lifecycle Closeout Script → ",e.jsx(n.code,{children:"/scripts/ops/closeout.mjs"})]}),`
`,e.jsxs(n.li,{children:["Lifecycle Report Script → ",e.jsx(n.code,{children:"/scripts/ops/report.mjs"})]}),`
`,e.jsxs(n.li,{children:["Template README → ",e.jsx(n.code,{children:"/templates/changelog/README.md"})]}),`
`,e.jsxs(n.li,{children:["Playbook Pattern → ",e.jsx(n.code,{children:"/playbook/patterns/release-changelog-automation.html"})]}),`
`]})]})}function p(s={}){const{wrapper:n}={...t(),...s.components};return n?e.jsx(n,{...s,children:e.jsx(o,{...s})}):o(s)}export{p as default};

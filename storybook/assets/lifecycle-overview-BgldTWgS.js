import{j as e}from"./jsx-runtime-DrddQA2g.js";import{useMDXComponents as i}from"./index-DgU72DYT.js";import{M as t}from"./blocks-B8EYL8HM.js";import"./iframe-EtIushdw.js";import"./preload-helper-C1FmrZbK.js";import"./index-CQ8wcDbC.js";function r(s){const n={code:"code",h1:"h1",h2:"h2",li:"li",ol:"ol",p:"p",strong:"strong",ul:"ul",...i(),...s.components};return e.jsxs(e.Fragment,{children:[e.jsx(t,{title:"Governance/Lifecycle Overview"}),`
`,e.jsx(n.h1,{id:"scripts-first-lifecycle-overview-view",children:"Scripts-First Lifecycle Overview (view)"}),`
`,e.jsx(n.p,{children:"The Scripts-First lifecycle keeps ideas, branches, PRs, and releases aligned through four sanctioned commands. Each stage honours two sources of truth:"}),`
`,e.jsxs(n.ul,{children:[`
`,e.jsxs(n.li,{children:[e.jsx(n.strong,{children:"Content SoT:"})," the idea file under ",e.jsx(n.code,{children:"/ideas/"})]}),`
`,e.jsxs(n.li,{children:[e.jsx(n.strong,{children:"Status SoT:"})," the GitHub Project item for that ID"]}),`
`]}),`
`,e.jsx(n.p,{children:"Automation bridges the two so humans never hand-edit status fields."}),`
`,e.jsx(n.h2,{id:"command-map",children:"Command Map"}),`
`,e.jsxs(n.p,{children:[`| Stage     | Command / Shortcut                           | Primary Script                                 | Status Transition      |
| --------- | --------------------------------------------- | ---------------------------------------------- | ---------------------- |
| Intake    | `,e.jsx(n.code,{children:"pnpm ideas:create <idea>"}),"                    | ",e.jsx(n.code,{children:"scripts/ops/ideas-to-issues.mjs"}),`              | Draft → Ticketed       |
| Branch    | `,e.jsx(n.code,{children:"pnpm gh:worktree <issue>"}),"                    | ",e.jsx(n.code,{children:"scripts/ops/create-worktree-pr.mjs"}),`           | Ticketed → Branched    |
| PR Refresh| `,e.jsx(n.code,{children:"pnpm pr:generate --yes"})," (+ ",e.jsx(n.code,{children:"pnpm pr:verify"}),") | ",e.jsx(n.code,{children:"scripts/ops/generate-pr-content.mjs"}),`          | Branched → PR Open     |
| Closeout  | `,e.jsx(n.code,{children:"pnpm changelog -- --yes"})," + archive command   | ",e.jsx(n.code,{children:"scripts/ops/consolidate-changelog.mjs"})," + ",e.jsx(n.code,{children:"archive-idea-for-issue.mjs"})," | In Review → Archived   |"]}),`
`,e.jsx(n.h2,{id:"signals-to-watch",children:"Signals to Watch"}),`
`,e.jsxs(n.ul,{children:[`
`,e.jsx(n.li,{children:"Dry-run output attaches to project status notes; if a command lacks a dry-run transcript, the stage likely happened manually."}),`
`,e.jsx(n.li,{children:"Status fields in GitHub Projects should only change after the corresponding command runs. Manual edits are reconciled back to the scripted value during the next run."}),`
`,e.jsxs(n.li,{children:["Idea files must keep ",e.jsx(n.code,{children:"Issue"})," and ",e.jsx(n.code,{children:"Status"})," lines in frontmatter so automation can stamp transitions without merge conflicts."]}),`
`]}),`
`,e.jsx(n.h2,{id:"recovery-play",children:"Recovery Play"}),`
`,e.jsx(n.p,{children:"If a branch must be backed out after promotion:"}),`
`,e.jsxs(n.ol,{children:[`
`,e.jsxs(n.li,{children:["Run ",e.jsx(n.code,{children:"node scripts/ops/remove-worktree.mjs <issue> --yes"})," to clean up local worktrees."]}),`
`,e.jsxs(n.li,{children:["Re-run ",e.jsx(n.code,{children:"pnpm gh:worktree <issue>"})," in dry-run mode to confirm the idea file still reflects the previous status."]}),`
`,e.jsxs(n.li,{children:["Use ",e.jsx(n.code,{children:"pnpm pr:generate"})," to refresh the PR body if the rollback involves checklist resets."]}),`
`,e.jsx(n.li,{children:"Attach the dry-run transcripts to the Playbook rollback pattern for auditing."}),`
`]}),`
`,e.jsx(n.h2,{id:"hand-off-links",children:"Hand-off Links"}),`
`,e.jsxs(n.ul,{children:[`
`,e.jsxs(n.li,{children:["Intake View → ",e.jsx(n.code,{children:"/storybook/?path=/docs/governance-lifecycle-intake--docs"})]}),`
`,e.jsxs(n.li,{children:["Branch View → ",e.jsx(n.code,{children:"/storybook/?path=/docs/governance-lifecycle-branch--docs"})]}),`
`,e.jsxs(n.li,{children:["PR Refresh View → ",e.jsx(n.code,{children:"/storybook/?path=/docs/governance-lifecycle-pr-refresh--docs"})]}),`
`,e.jsxs(n.li,{children:["Closeout View → ",e.jsx(n.code,{children:"/storybook/?path=/docs/governance-lifecycle-closeout--docs"})]}),`
`,e.jsxs(n.li,{children:["Playbook Pattern → ",e.jsx(n.code,{children:"/playbook/patterns/scripts-first-lifecycle-overview.html"})]}),`
`]})]})}function p(s={}){const{wrapper:n}={...i(),...s.components};return n?e.jsx(n,{...s,children:e.jsx(r,{...s})}):r(s)}export{p as default};

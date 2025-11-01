import{j as e}from"./jsx-runtime-DrddQA2g.js";import{useMDXComponents as r}from"./index-DgU72DYT.js";import{M as t}from"./blocks-B8EYL8HM.js";import"./iframe-EtIushdw.js";import"./preload-helper-C1FmrZbK.js";import"./index-CQ8wcDbC.js";function i(n){const s={code:"code",h1:"h1",h2:"h2",li:"li",p:"p",pre:"pre",strong:"strong",ul:"ul",...r(),...n.components};return e.jsxs(e.Fragment,{children:[e.jsx(t,{title:"Governance/Commit Guard"}),`
`,e.jsx(s.h1,{id:"commit-guard-view",children:"Commit Guard (view)"}),`
`,e.jsx(s.p,{children:"Commit messages are the trust signal that ties branches, PRs, changelog entries, and automation together. The commit guard hook enforces ticket prefixes so the lifecycle scripts can reconcile work across ideas, Projects, and releases without guessing."}),`
`,e.jsx(s.h2,{id:"system-of-record",children:"System of Record"}),`
`,e.jsxs(s.ul,{children:[`
`,e.jsxs(s.li,{children:[e.jsx(s.strong,{children:"Ticket IDs:"})," Idea filenames under ",e.jsx(s.code,{children:"/ideas/"})," (e.g., ",e.jsx(s.code,{children:"PB-scripts-first-lifecycle-rollout.md"}),")"]}),`
`,e.jsxs(s.li,{children:[e.jsx(s.strong,{children:"Branch / PR metadata:"})," Derived from the ticket prefix injected by ",e.jsx(s.code,{children:"pnpm gh:worktree"})]}),`
`,e.jsxs(s.li,{children:[e.jsx(s.strong,{children:"Automation:"})," ",e.jsx(s.code,{children:"scripts/ops/commit-msg-hook.mjs"})," (installed via ",e.jsx(s.code,{children:"simple-git-hooks"}),")"]}),`
`]}),`
`,e.jsx(s.h2,{id:"command-contract",children:"Command Contract"}),`
`,e.jsx(s.pre,{children:e.jsx(s.code,{className:"language-bash",children:`# Install hooks locally
pnpm install-hooks

# Validate an entire PR range
pnpm commit:guard -- --range origin/main..HEAD

# Re-run the validator against a message
node scripts/ops/commit-msg-hook.mjs .git/COMMIT_EDITMSG --dry-run
`})}),`
`,e.jsxs(s.ul,{children:[`
`,e.jsxs(s.li,{children:["The hook runs automatically on every commit unless ",e.jsx(s.code,{children:"SKIP_SIMPLE_GIT_HOOKS=1"}),"."]}),`
`,e.jsxs(s.li,{children:["Messages must start with ",e.jsx(s.code,{children:"[ID-slug]"})," (e.g., ",e.jsx(s.code,{children:"[PB-scripts-first-lifecycle-rollout] chore: update docs"}),")."]}),`
`,e.jsx(s.li,{children:"Merge and revert commits bypass validation; all others must pass."}),`
`]}),`
`,e.jsx(s.h2,{id:"worked-example",children:"Worked Example"}),`
`,e.jsxs(s.p,{children:["After branching with ",e.jsx(s.code,{children:"pnpm gh:worktree 91 --yes"}),", developers commit changes with ",e.jsx(s.code,{children:"[PB-scripts-first-lifecycle-rollout] chore: hydrate lifecycle docs"}),". The hook confirms the Playbook ID matches the branch ticket, enforces the space after the prefix, and warns if the slug casing drifts. Because the hook ran, the PR generator and changelog scripts can confidently map follow-up work to the same ticket without additional metadata."]}),`
`,e.jsx(s.h2,{id:"constraints",children:"Constraints"}),`
`,e.jsxs(s.ul,{children:[`
`,e.jsxs(s.li,{children:["Keep ticket slugs lowercase; the hook warns when camelCase sneaks into ",e.jsx(s.code,{children:"[ID-slug]"}),"."]}),`
`,e.jsxs(s.li,{children:["Never bypass the guardrail during normal work—dry-run outputs (",e.jsx(s.code,{children:"--dry-run"}),") should accompany status notes if a validation tweak is needed."]}),`
`,e.jsxs(s.li,{children:["Preserve the ",e.jsx(s.code,{children:"[skip ci]"})," suffix only after the required ticket prefix; the hook expects the prefix at column zero."]}),`
`,e.jsxs(s.li,{children:["Set ",e.jsx(s.code,{children:"SKIP_SIMPLE_GIT_HOOKS=1"})," only for automation bootstrap commits (the ",e.jsx(s.code,{children:"gh:worktree"})," script does this intentionally); clear it before committing real changes."]}),`
`,e.jsxs(s.li,{children:["CI runs ",e.jsx(s.code,{children:"pnpm commit:guard"}),"; local pushes must keep the range clean or guardrails will block the pipeline."]}),`
`]}),`
`,e.jsx(s.h2,{id:"hand-off-links",children:"Hand-off Links"}),`
`,e.jsxs(s.ul,{children:[`
`,e.jsxs(s.li,{children:["Hook Script → ",e.jsx(s.code,{children:"/scripts/ops/commit-msg-hook.mjs"})]}),`
`,e.jsxs(s.li,{children:["Lifecycle Overview → ",e.jsx(s.code,{children:"/storybook/?path=/docs/governance-lifecycle-overview--docs"})]}),`
`,e.jsxs(s.li,{children:["Playbook Pattern → ",e.jsx(s.code,{children:"/playbook/patterns/scripts-first-lifecycle-overview.html"})]}),`
`,e.jsxs(s.li,{children:["Template README → ",e.jsx(s.code,{children:"/templates/script/README.md"})]}),`
`]})]})}function m(n={}){const{wrapper:s}={...r(),...n.components};return s?e.jsx(s,{...n,children:e.jsx(i,{...n})}):i(n)}export{m as default};

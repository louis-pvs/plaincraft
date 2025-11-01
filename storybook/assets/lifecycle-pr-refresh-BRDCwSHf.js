import{j as e}from"./jsx-runtime-DrddQA2g.js";import{useMDXComponents as t}from"./index-DgU72DYT.js";import{M as i}from"./blocks-B8EYL8HM.js";import"./iframe-EtIushdw.js";import"./preload-helper-C1FmrZbK.js";import"./index-CQ8wcDbC.js";function s(r){const n={code:"code",h1:"h1",h2:"h2",li:"li",p:"p",pre:"pre",strong:"strong",ul:"ul",...t(),...r.components};return e.jsxs(e.Fragment,{children:[e.jsx(i,{title:"Governance/Lifecycle PR Refresh"}),`
`,e.jsx(n.h1,{id:"lifecycle-pr-refresh-view",children:"Lifecycle PR Refresh (view)"}),`
`,e.jsxs(n.p,{children:["Refreshing the PR body keeps reviewers synced with the latest acceptance state and makes sure automation can reconcile checklists. Use the ",e.jsx(n.code,{children:"pnpm pr:generate"})," helper alongside the verification guardrail so the Playbook, Issue, and PR always agree."]}),`
`,e.jsx(n.h2,{id:"system-of-record",children:"System of Record"}),`
`,e.jsxs(n.ul,{children:[`
`,e.jsxs(n.li,{children:[e.jsx(n.strong,{children:"Content:"})," ",e.jsx(n.code,{children:"/ideas/<ID>-*.md"})," (acceptance checklist + context copied into PR)"]}),`
`,e.jsxs(n.li,{children:[e.jsx(n.strong,{children:"Status:"})," GitHub Projects – promotion from ",e.jsx(n.code,{children:"Branched"})," → ",e.jsx(n.code,{children:"PR Open"})]}),`
`,e.jsxs(n.li,{children:[e.jsx(n.strong,{children:"Automation:"})," ",e.jsx(n.code,{children:"pnpm pr:generate"})," → ",e.jsx(n.code,{children:"scripts/ops/generate-pr-content.mjs"})]}),`
`]}),`
`,e.jsx(n.h2,{id:"command-contract",children:"Command Contract"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-bash",children:`# Refresh PR body for the active branch
pnpm pr:generate --yes
pnpm pr:verify    # optional: confirm checklist sync
`})}),`
`,e.jsxs(n.ul,{children:[`
`,e.jsx(n.li,{children:"Default dry-run prints the proposed PR body diff."}),`
`,e.jsxs(n.li,{children:["Pass ",e.jsx(n.code,{children:"--head <branch>"})," or ",e.jsx(n.code,{children:"--issue <number>"})," to target a specific lifecycle item."]}),`
`,e.jsxs(n.li,{children:["Pair with ",e.jsx(n.code,{children:"pnpm pr:verify"})," (runs ",e.jsx(n.code,{children:"scripts/checks/pr-requirements.mjs --verify-pr"}),") before requesting review."]}),`
`]}),`
`,e.jsx(n.p,{children:"When you need the automation to write back to GitHub, run:"}),`
`,e.jsx(n.pre,{children:e.jsx(n.code,{className:"language-bash",children:`# Promote idea content + labels into the draft PR and sync Project status
pnpm ops:open-or-update-pr -- --id ARCH-123 --branch feat/ARCH-123-foo --yes
`})}),`
`,e.jsxs(n.ul,{children:[`
`,e.jsxs(n.li,{children:[e.jsx(n.code,{children:"ops:open-or-update-pr"})," sources Purpose / Problem / Proposal + checklist from the idea, applies lifecycle labels, toggles draft state, and moves the Project item to ",e.jsx(n.code,{children:"PR Open"}),"."]}),`
`,e.jsxs(n.li,{children:["Always capture a dry-run transcript first (",e.jsx(n.code,{children:"--dry-run --output json"}),") and attach it to the Project card before the ",e.jsx(n.code,{children:"--yes"})," run."]}),`
`,e.jsxs(n.li,{children:["Requires a GitHub token with ",e.jsx(n.code,{children:"repo"})," + ",e.jsx(n.code,{children:"project"})," scopes. Fallback to ",e.jsx(n.code,{children:"--dry-run"})," if the sandbox bot lacks permissions."]}),`
`]}),`
`,e.jsx(n.h2,{id:"worked-example",children:"Worked Example"}),`
`,e.jsxs(n.p,{children:["After landing design feedback, run ",e.jsx(n.code,{children:"pnpm pr:generate --yes"})," to rehydrate the PR body from the idea file. Once the branch is ready, promote the changes with ",e.jsx(n.code,{children:"pnpm ops:open-or-update-pr -- --id ARCH-123 --yes"})," so the PR title/body, labels, and Project status all match the idea. ",e.jsx(n.code,{children:"pnpm pr:verify"})," confirms the merged checklist state and flags any missing reviewer tasks before you re-request review, preventing status drift in Projects."]}),`
`,e.jsx(n.h2,{id:"constraints",children:"Constraints"}),`
`,e.jsxs(n.ul,{children:[`
`,e.jsx(n.li,{children:"Acceptance checklist items must be GitHub checkboxes; the generator toggles them to match Issue progress."}),`
`,e.jsxs(n.li,{children:["Keep idea metadata (",e.jsx(n.code,{children:"Lane"}),", ",e.jsx(n.code,{children:"Owner"}),", ",e.jsx(n.code,{children:"Priority"}),") current—PR refresh picks them up for the header."]}),`
`,e.jsx(n.li,{children:"Do not edit the generated PR body by hand; rerun the generator so automation sees the change and dry-run history stays auditable."}),`
`,e.jsxs(n.li,{children:["Record the automation in the Project status note (",e.jsx(n.code,{children:"Automation: pnpm ops:open-or-update-pr -- --id … --yes"}),") along with the dry-run transcript for auditability."]}),`
`]}),`
`,e.jsx(n.h2,{id:"hand-off-links",children:"Hand-off Links"}),`
`,e.jsxs(n.ul,{children:[`
`,e.jsxs(n.li,{children:["Unit Script → ",e.jsx(n.code,{children:"/scripts/ops/generate-pr-content.mjs"})]}),`
`,e.jsxs(n.li,{children:["Verification Script → ",e.jsx(n.code,{children:"/scripts/checks/pr-requirements.mjs"})]}),`
`,e.jsxs(n.li,{children:["Template README → ",e.jsx(n.code,{children:"/templates/script/README.md"})]}),`
`,e.jsxs(n.li,{children:["Lifecycle Branch View → ",e.jsx(n.code,{children:"/storybook/?path=/docs/governance-lifecycle-branch--docs"})]}),`
`]})]})}function p(r={}){const{wrapper:n}={...t(),...r.components};return n?e.jsx(n,{...r,children:e.jsx(s,{...r})}):s(r)}export{p as default};

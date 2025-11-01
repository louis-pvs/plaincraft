import{j as e}from"./jsx-runtime-DrddQA2g.js";import{useMDXComponents as r}from"./index-DgU72DYT.js";import{M as t}from"./blocks-B8EYL8HM.js";import"./iframe-EtIushdw.js";import"./preload-helper-C1FmrZbK.js";import"./index-CQ8wcDbC.js";function i(s){const n={code:"code",h1:"h1",h2:"h2",li:"li",p:"p",ul:"ul",...r(),...s.components};return e.jsxs(e.Fragment,{children:[e.jsx(t,{title:"Governance/Release Changelog"}),`
`,e.jsx(n.h1,{id:"release-changelog-view",children:"Release Changelog (view)"}),`
`,e.jsxs(n.p,{children:["Release storytelling runs through ",e.jsx(n.code,{children:"_tmp/"})," summaries promoted by ",e.jsx(n.code,{children:"consolidate-changelog.mjs"}),". The goal is to keep highlights business-ready while automation enforces formatting."]}),`
`,e.jsx(n.h2,{id:"signals-to-watch",children:"Signals to Watch"}),`
`,e.jsxs(n.ul,{children:[`
`,e.jsxs(n.li,{children:[e.jsx(n.code,{children:"_tmp/"})," backlog growing past three files suggests release drift."]}),`
`,e.jsx(n.li,{children:"Missing ticket slugs in summaries breaks changelog traceability."}),`
`,e.jsxs(n.li,{children:["Skipped ",e.jsx(n.code,{children:"--dry-run"})," previews leave stakeholders blind to wording changes."]}),`
`]}),`
`,e.jsx(n.h2,{id:"worked-example",children:"Worked Example"}),`
`,e.jsxs(n.p,{children:[e.jsx(n.code,{children:"PB-readme-narrative-migration"})," shipped its release copy by drafting ",e.jsx(n.code,{children:"_tmp/102-readme-migration.md"}),", running ",e.jsx(n.code,{children:"pnpm changelog -- --dry-run"}),", and sharing the diff before promoting with ",e.jsx(n.code,{children:"--yes"}),". The Playbook pattern captures the stakeholder story; the README links bring engineers back to executable docs."]}),`
`,e.jsx(n.h2,{id:"hand-off-links",children:"Hand-off Links"}),`
`,e.jsxs(n.ul,{children:[`
`,e.jsxs(n.li,{children:["Template README → ",e.jsx(n.code,{children:"/templates/changelog/README.md"})]}),`
`,e.jsxs(n.li,{children:["Template USAGE → ",e.jsx(n.code,{children:"/templates/changelog/USAGE.md"})]}),`
`,e.jsxs(n.li,{children:["Ops script → ",e.jsx(n.code,{children:"scripts/ops/consolidate-changelog.mjs"})]}),`
`,e.jsxs(n.li,{children:["Playbook narrative → ",e.jsx(n.code,{children:"/playbook/patterns/release-changelog-automation.html"})]}),`
`]}),`
`,e.jsx(n.h2,{id:"constraints",children:"Constraints"}),`
`,e.jsxs(n.ul,{children:[`
`,e.jsx(n.li,{children:"Every summary must reference a ticket ID; the script fails fast otherwise."}),`
`,e.jsxs(n.li,{children:["Keep ",e.jsx(n.code,{children:"_tmp/"})," under version control so CI catches stale entries."]}),`
`,e.jsx(n.li,{children:"Publish the Playbook highlight within 24 hours of promoting the changelog entry."}),`
`]})]})}function g(s={}){const{wrapper:n}={...r(),...s.components};return n?e.jsx(n,{...s,children:e.jsx(i,{...s})}):i(s)}export{g as default};

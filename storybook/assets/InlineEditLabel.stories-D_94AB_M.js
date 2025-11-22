import{j as s}from"./jsx-runtime-BknaRBMW.js";import{r as o}from"./iframe-JnBWXuYa.js";function ue({value:a,maxLength:r,onSave:n,labels:t={}}){const e=t.saving??"Saving…",u=t.success??"Saved",c=t.error??"Save failed. Try again.",i=t.discarded??"Changes discarded.",[g,v]=o.useState(a),[E,y]=o.useState(a),[p,b]=o.useState("idle"),[C,m]=o.useState(""),[f,w]=o.useState(!1),h=o.useId(),x=o.useRef(null),S=o.useRef(!1),I=o.useRef(a);o.useEffect(()=>{v(a),I.current=a},[a]),o.useEffect(()=>{f||y(a)},[f,a]),o.useEffect(()=>{if(!f)return;const l=requestAnimationFrame(()=>{var k,P;(k=x.current)==null||k.focus(),(P=x.current)==null||P.select()});return()=>cancelAnimationFrame(l)},[f]),o.useEffect(()=>{if(p!=="success")return;const l=window.setTimeout(()=>{b("idle"),m("")},1600);return()=>window.clearTimeout(l)},[p]);const O=()=>{m(""),y(g),w(!0)},A=()=>{S.current=!0,w(!1),b("idle"),m(i),y(g)},ce=l=>{(l.key==="Enter"||l.key===" ")&&(l.preventDefault(),O())},me=l=>{y(l.slice(0,r))},V=async()=>{if(!f)return;const l=E.trim();if(l.length>r){b("error"),m(`Keep it under ${r} characters.`);return}if(l===g){w(!1),m("");return}const k=I.current;b("saving"),m(e),v(l);try{await n(l),I.current=l,b("success"),m(u),w(!1),y(l)}catch{b("error"),m(c),v(k),y(k),w(!0),requestAnimationFrame(()=>{var $,F;($=x.current)==null||$.focus(),(F=x.current)==null||F.select()})}},ge=l=>{l.key==="Enter"&&(l.preventDefault(),V()),l.key==="Escape"&&(l.preventDefault(),A())},ve=()=>{if(S.current){S.current=!1;return}V()};return{displayValue:g,draft:E,isEditing:f,status:p,message:C,messageTone:p==="error"?"error":p==="success"?"success":"info",inputId:h,inputRef:x,inputProps:{id:h,value:E,maxLength:r,disabled:p==="saving","aria-busy":p==="saving","aria-describedby":`${h}-hint`},beginEditing:O,saveDraft:V,cancelEditing:A,updateDraft:me,handleDisplayKeyDown:ce,handleInputKeyDown:ge,handleBlur:ve}}function de({controller:a,ariaLabel:r="Edit label",maxLength:n,emptyValuePlaceholder:t="Add label"}){const{displayValue:e,draft:u,isEditing:c,status:i,message:g,inputId:v,inputRef:E,beginEditing:y,updateDraft:p,handleDisplayKeyDown:b,handleInputKeyDown:C,handleBlur:m}=a,f=i==="error"?"text-rose-600":i==="success"?"text-emerald-600":"text-slate-700",h=e.trim().length===0,x=h?t:e;return s.jsxs("div",{className:"w-full max-w-sm space-y-2 text-slate-950",children:[s.jsx("div",{className:"text-xs font-medium uppercase tracking-wide text-slate-700",children:"Inline label"}),!c&&s.jsxs("div",{role:"button",tabIndex:0,"aria-label":r,onClick:y,onKeyDown:b,className:"flex items-center justify-between rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm transition outline-none focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2",children:[s.jsx("span",{className:`truncate ${h?"text-slate-400 italic":""}`,children:x}),s.jsx("span",{className:"ml-3 text-xs text-slate-500",children:"Enter to edit"})]}),c&&s.jsxs("div",{className:"relative",children:[s.jsx("input",{ref:E,id:v,value:u,onChange:S=>p(S.target.value),onBlur:m,onKeyDown:C,maxLength:n,disabled:i==="saving","aria-busy":i==="saving","aria-describedby":`${v}-hint`,"aria-label":r,className:"w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:cursor-wait disabled:bg-slate-100",placeholder:"Update label"}),i==="saving"&&s.jsx("div",{className:"pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-500",children:s.jsxs("svg",{className:"h-4 w-4 animate-spin",viewBox:"0 0 24 24",fill:"none","aria-hidden":"true",children:[s.jsx("circle",{className:"opacity-25",cx:"12",cy:"12",r:"10",stroke:"currentColor",strokeWidth:"3"}),s.jsx("path",{className:"opacity-75",d:"M4 12a8 8 0 018-8",stroke:"currentColor",strokeWidth:"3",strokeLinecap:"round"})]})})]}),s.jsx("div",{id:`${v}-hint`,className:"text-xs text-slate-700","aria-live":"polite",children:c?"Enter to save, Esc to cancel, clicks outside save.":h?`Press Enter or click to add a label. Max ${n} characters.`:`Press Enter or click to edit. Max ${n} characters.`}),g&&s.jsx("div",{className:`${f} text-xs`,role:i==="error"?"alert":"status","aria-live":i==="error"?"assertive":"polite",children:g})]})}de.__docgenInfo={description:"",methods:[],displayName:"InlineEditLabelView",props:{controller:{required:!0,tsType:{name:"signature",type:"object",raw:`{
  // Display and draft state
  displayValue: string;
  draft: string;
  isEditing: boolean;

  // Save lifecycle
  status: SaveStatus;
  message: string;
  messageTone: "error" | "success" | "info";

  // Refs for imperative control
  inputId: string;
  inputRef: React.RefObject<HTMLInputElement>;

  // Derived props for input
  inputProps: {
    id: string;
    value: string;
    maxLength: number;
    disabled: boolean;
    "aria-busy": boolean;
    "aria-describedby": string;
  };

  // Actions
  beginEditing: () => void;
  saveDraft: () => Promise<void>;
  cancelEditing: () => void;
  updateDraft: (value: string) => void;
  handleDisplayKeyDown: (event: React.KeyboardEvent<HTMLElement>) => void;
  handleInputKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  handleBlur: () => void;
}`,signature:{properties:[{key:"displayValue",value:{name:"string",required:!0}},{key:"draft",value:{name:"string",required:!0}},{key:"isEditing",value:{name:"boolean",required:!0}},{key:"status",value:{name:"union",raw:'"idle" | "saving" | "success" | "error"',elements:[{name:"literal",value:'"idle"'},{name:"literal",value:'"saving"'},{name:"literal",value:'"success"'},{name:"literal",value:'"error"'}],required:!0}},{key:"message",value:{name:"string",required:!0}},{key:"messageTone",value:{name:"union",raw:'"error" | "success" | "info"',elements:[{name:"literal",value:'"error"'},{name:"literal",value:'"success"'},{name:"literal",value:'"info"'}],required:!0}},{key:"inputId",value:{name:"string",required:!0}},{key:"inputRef",value:{name:"ReactRefObject",raw:"React.RefObject<HTMLInputElement>",elements:[{name:"HTMLInputElement"}],required:!0}},{key:"inputProps",value:{name:"signature",type:"object",raw:`{
  id: string;
  value: string;
  maxLength: number;
  disabled: boolean;
  "aria-busy": boolean;
  "aria-describedby": string;
}`,signature:{properties:[{key:"id",value:{name:"string",required:!0}},{key:"value",value:{name:"string",required:!0}},{key:"maxLength",value:{name:"number",required:!0}},{key:"disabled",value:{name:"boolean",required:!0}},{key:"aria-busy",value:{name:"boolean",required:!0}},{key:"aria-describedby",value:{name:"string",required:!0}}]},required:!0}},{key:"beginEditing",value:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}},required:!0}},{key:"saveDraft",value:{name:"signature",type:"function",raw:"() => Promise<void>",signature:{arguments:[],return:{name:"Promise",elements:[{name:"void"}],raw:"Promise<void>"}},required:!0}},{key:"cancelEditing",value:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}},required:!0}},{key:"updateDraft",value:{name:"signature",type:"function",raw:"(value: string) => void",signature:{arguments:[{type:{name:"string"},name:"value"}],return:{name:"void"}},required:!0}},{key:"handleDisplayKeyDown",value:{name:"signature",type:"function",raw:"(event: React.KeyboardEvent<HTMLElement>) => void",signature:{arguments:[{type:{name:"ReactKeyboardEvent",raw:"React.KeyboardEvent<HTMLElement>",elements:[{name:"HTMLElement"}]},name:"event"}],return:{name:"void"}},required:!0}},{key:"handleInputKeyDown",value:{name:"signature",type:"function",raw:"(event: React.KeyboardEvent<HTMLInputElement>) => void",signature:{arguments:[{type:{name:"ReactKeyboardEvent",raw:"React.KeyboardEvent<HTMLInputElement>",elements:[{name:"HTMLInputElement"}]},name:"event"}],return:{name:"void"}},required:!0}},{key:"handleBlur",value:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}},required:!0}}]}},description:""},ariaLabel:{required:!1,tsType:{name:"string"},description:"",defaultValue:{value:'"Edit label"',computed:!1}},maxLength:{required:!0,tsType:{name:"number"},description:""},emptyValuePlaceholder:{required:!1,tsType:{name:"string"},description:"",defaultValue:{value:'"Add label"',computed:!1}}}};function pe({value:a,maxLength:r,onSave:n,labels:t,children:e}){const u=ue({value:a,maxLength:r,onSave:n,labels:t});return e(u)}function j({value:a,maxLength:r,onSave:n,ariaLabel:t="Edit label",savingLabel:e,successLabel:u,errorLabel:c,labels:i,emptyValuePlaceholder:g="Add label"}){const v=ue({value:a,maxLength:r,onSave:n,labels:{saving:(i==null?void 0:i.saving)??e,success:(i==null?void 0:i.success)??u,error:(i==null?void 0:i.error)??c,discarded:i==null?void 0:i.discarded}});return s.jsx(de,{controller:v,ariaLabel:t,maxLength:r,emptyValuePlaceholder:g})}j.__docgenInfo={description:"",methods:[],displayName:"InlineEditLabel",props:{value:{required:!0,tsType:{name:"string"},description:""},maxLength:{required:!0,tsType:{name:"number"},description:""},onSave:{required:!0,tsType:{name:"signature",type:"function",raw:"(nextValue: string) => Promise<void> | void",signature:{arguments:[{type:{name:"string"},name:"nextValue"}],return:{name:"union",raw:"Promise<void> | void",elements:[{name:"Promise",elements:[{name:"void"}],raw:"Promise<void>"},{name:"void"}]}}},description:"Seam: inject the save handler from the parent."},ariaLabel:{required:!1,tsType:{name:"string"},description:"Accessible label announced while the text is in read-only mode.",defaultValue:{value:'"Edit label"',computed:!1}},savingLabel:{required:!1,tsType:{name:"string"},description:"@deprecated Use `labels.saving` instead"},successLabel:{required:!1,tsType:{name:"string"},description:"@deprecated Use `labels.success` instead"},errorLabel:{required:!1,tsType:{name:"string"},description:"@deprecated Use `labels.error` instead"},labels:{required:!1,tsType:{name:"signature",type:"object",raw:`{
  saving?: string;
  success?: string;
  error?: string;
  discarded?: string;
}`,signature:{properties:[{key:"saving",value:{name:"string",required:!1}},{key:"success",value:{name:"string",required:!1}},{key:"error",value:{name:"string",required:!1}},{key:"discarded",value:{name:"string",required:!1}}]}},description:"Optional label overrides for different states"},emptyValuePlaceholder:{required:!1,tsType:{name:"string"},description:"Placeholder shown when the current value is empty.",defaultValue:{value:'"Add label"',computed:!1}}}};const{expect:K,within:H,userEvent:d}=__STORYBOOK_MODULE_TEST__,M=a=>new Promise(r=>setTimeout(r,a)),q={delay:40},_=a=>new RegExp(a??"Edit label","i"),ye={title:"Snippets/InlineEditLabel",component:j,args:{value:"Team charter",maxLength:32,ariaLabel:"Edit project headline",onSave:async()=>{await M(150)}},render:a=>{const[r,n]=o.useState(a.value);o.useEffect(()=>{n(a.value)},[a.value]);const t=async e=>{await a.onSave(e),n(e)};return s.jsx(j,{...a,value:r,onSave:t})},parameters:{a11y:{disable:!1}}},L={},T={args:{value:"",emptyValuePlaceholder:"Add label"}},D={play:async({canvasElement:a,args:r})=>{const n=H(a),t=_(r.ariaLabel);await d.click(n.getByRole("button",{name:t}));const e=await n.findByRole("textbox",{name:t});await d.clear(e),await d.type(e,"Product strategy",q),await d.keyboard("{Enter}"),await n.findByText("Saved"),await K(n.getByRole("button",{name:t})).toHaveTextContent("Product strategy")}},N={args:{maxLength:32,value:"Original value",ariaLabel:"Edit text"},play:async({canvasElement:a,args:r})=>{const n=H(a),t=_(r.ariaLabel);await d.click(n.getByRole("button",{name:t}));const e=await n.findByRole("textbox",{name:t});await d.clear(e),await d.type(e,"Changed value",q),await d.keyboard("{Escape}"),await n.findByText("Changes discarded.");const u=await n.findByRole("button",{name:t});await K(u).toHaveTextContent("Original value")}},R={args:{value:"Launch plan",maxLength:16,errorLabel:"Save failed. Retry to continue.",ariaLabel:"Edit launch label"},render:a=>{const[r,n]=o.useState(a.value),[t,e]=o.useState(!0);o.useEffect(()=>{n(a.value)},[a.value]);const u=async c=>{if(await M(120),t)throw e(!1),new Error("Simulated failure");n(c)};return s.jsx(j,{...a,value:r,onSave:u})},play:async({canvasElement:a,args:r})=>{const n=H(a),t=_(r.ariaLabel),e=await n.findByRole("button",{name:t});await d.click(e);const u=await n.findByRole("textbox",{name:t});await d.clear(u),await d.type(u,"Launch update",q),await d.keyboard("{Enter}"),await n.findByText("Save failed. Retry to continue."),await d.clear(u),await d.type(u,"Launch retry",q),await d.keyboard("{Enter}"),await n.findByText("Saved");const c=await n.findByRole("button",{name:t});await K(c).toHaveTextContent(/Launch retry/)}},B={args:{value:"Custom styled",maxLength:32},render:a=>{const[r,n]=o.useState(a.value);o.useEffect(()=>{n(a.value)},[a.value]);const t=async e=>{await M(150),n(e)};return s.jsx(pe,{value:r,maxLength:a.maxLength,onSave:t,labels:{saving:"⏳ Saving...",success:"✅ Done!",error:"❌ Error",discarded:"🚫 Cancelled"},children:e=>s.jsxs("div",{className:"space-y-3 rounded-lg border-2 border-indigo-200 bg-indigo-50 p-4",children:[s.jsx("div",{className:"text-sm font-semibold text-indigo-900",children:"Custom Headless Implementation"}),!e.isEditing&&s.jsxs("button",{onClick:e.beginEditing,onKeyDown:e.handleDisplayKeyDown,className:"w-full rounded-lg bg-indigo-600 px-4 py-3 text-left text-white shadow-md transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2",children:[s.jsx("span",{className:"font-medium",children:e.displayValue}),s.jsx("span",{className:"ml-2 text-xs text-indigo-200",children:"Click to edit"})]}),e.isEditing&&s.jsxs("div",{className:"space-y-2",children:[s.jsx("input",{ref:e.inputRef,value:e.draft,onChange:u=>e.updateDraft(u.target.value),onBlur:e.handleBlur,onKeyDown:e.handleInputKeyDown,disabled:e.status==="saving",className:"w-full rounded-lg border-2 border-indigo-300 bg-white px-4 py-3 text-indigo-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100",placeholder:"Enter new value..."}),s.jsxs("div",{className:"flex gap-2 text-xs",children:[s.jsx("button",{onClick:()=>e.saveDraft(),disabled:e.status==="saving",className:"rounded bg-indigo-600 px-3 py-1 text-white hover:bg-indigo-700 disabled:bg-gray-400",children:"Save"}),s.jsx("button",{onClick:e.cancelEditing,disabled:e.status==="saving",className:"rounded bg-gray-200 px-3 py-1 text-gray-700 hover:bg-gray-300 disabled:bg-gray-100",children:"Cancel"})]})]}),e.message&&s.jsx("div",{className:`text-sm font-medium ${e.messageTone==="error"?"text-red-600":e.messageTone==="success"?"text-green-600":"text-indigo-600"}`,children:e.message})]})})}};var Y,U,W;L.parameters={...L.parameters,docs:{...(Y=L.parameters)==null?void 0:Y.docs,source:{originalSource:"{}",...(W=(U=L.parameters)==null?void 0:U.docs)==null?void 0:W.source}}};var z,G,J;T.parameters={...T.parameters,docs:{...(z=T.parameters)==null?void 0:z.docs,source:{originalSource:`{
  args: {
    value: "",
    emptyValuePlaceholder: "Add label"
  }
}`,...(J=(G=T.parameters)==null?void 0:G.docs)==null?void 0:J.source}}};var Q,X,Z;D.parameters={...D.parameters,docs:{...(Q=D.parameters)==null?void 0:Q.docs,source:{originalSource:`{
  play: async ({
    canvasElement,
    args
  }) => {
    const canvas = within(canvasElement);
    const labelName = labelMatcher(args.ariaLabel);
    await userEvent.click(canvas.getByRole("button", {
      name: labelName
    }));
    const input = await canvas.findByRole("textbox", {
      name: labelName
    });
    await userEvent.clear(input);
    await userEvent.type(input, "Product strategy", TYPE_SPEED);
    await userEvent.keyboard("{Enter}");
    await canvas.findByText("Saved");
    await expect(canvas.getByRole("button", {
      name: labelName
    })).toHaveTextContent("Product strategy");
  }
}`,...(Z=(X=D.parameters)==null?void 0:X.docs)==null?void 0:Z.source}}};var ee,ae,ne;N.parameters={...N.parameters,docs:{...(ee=N.parameters)==null?void 0:ee.docs,source:{originalSource:`{
  args: {
    maxLength: 32,
    value: "Original value",
    ariaLabel: "Edit text"
  },
  play: async ({
    canvasElement,
    args
  }) => {
    const canvas = within(canvasElement);
    const labelName = labelMatcher(args.ariaLabel);
    await userEvent.click(canvas.getByRole("button", {
      name: labelName
    }));
    const input = await canvas.findByRole("textbox", {
      name: labelName
    });
    await userEvent.clear(input);
    await userEvent.type(input, "Changed value", TYPE_SPEED);
    await userEvent.keyboard("{Escape}");
    // Should show "Changes discarded" message
    await canvas.findByText("Changes discarded.");
    // And the button should still show original value
    const button = await canvas.findByRole("button", {
      name: labelName
    });
    await expect(button).toHaveTextContent("Original value");
  }
}`,...(ne=(ae=N.parameters)==null?void 0:ae.docs)==null?void 0:ne.source}}};var te,se,re;R.parameters={...R.parameters,docs:{...(te=R.parameters)==null?void 0:te.docs,source:{originalSource:`{
  args: {
    value: "Launch plan",
    maxLength: 16,
    errorLabel: "Save failed. Retry to continue.",
    ariaLabel: "Edit launch label"
  },
  render: args => {
    const [value, setValue] = useState(args.value);
    const [shouldFail, setShouldFail] = useState(true);
    useEffect(() => {
      setValue(args.value);
    }, [args.value]);
    const handleSave = async (nextValue: string) => {
      await delay(120);
      if (shouldFail) {
        setShouldFail(false);
        throw new Error("Simulated failure");
      }
      setValue(nextValue);
    };
    return <InlineEditLabel {...args} value={value} onSave={handleSave} />;
  },
  play: async ({
    canvasElement,
    args
  }) => {
    const canvas = within(canvasElement);
    const labelName = labelMatcher(args.ariaLabel);
    const launchButton = await canvas.findByRole("button", {
      name: labelName
    });
    await userEvent.click(launchButton);
    const input = await canvas.findByRole("textbox", {
      name: labelName
    });
    await userEvent.clear(input);
    await userEvent.type(input, "Launch update", TYPE_SPEED);
    await userEvent.keyboard("{Enter}");
    await canvas.findByText("Save failed. Retry to continue.");
    await userEvent.clear(input);
    await userEvent.type(input, "Launch retry", TYPE_SPEED);
    await userEvent.keyboard("{Enter}");
    await canvas.findByText("Saved");
    const button = await canvas.findByRole("button", {
      name: labelName
    });
    await expect(button).toHaveTextContent(/Launch retry/);
  }
}`,...(re=(se=R.parameters)==null?void 0:se.docs)==null?void 0:re.source}}};var ie,le,oe;B.parameters={...B.parameters,docs:{...(ie=B.parameters)==null?void 0:ie.docs,source:{originalSource:`{
  args: {
    value: "Custom styled",
    maxLength: 32
  },
  render: args => {
    const [value, setValue] = useState(args.value);
    useEffect(() => {
      setValue(args.value);
    }, [args.value]);
    const handleSave = async (nextValue: string) => {
      await delay(150);
      setValue(nextValue);
    };
    return <InlineEditLabelHeadless value={value} maxLength={args.maxLength} onSave={handleSave} labels={{
      saving: "⏳ Saving...",
      success: "✅ Done!",
      error: "❌ Error",
      discarded: "🚫 Cancelled"
    }}>
        {controller => <div className="space-y-3 rounded-lg border-2 border-indigo-200 bg-indigo-50 p-4">
            <div className="text-sm font-semibold text-indigo-900">
              Custom Headless Implementation
            </div>
            {!controller.isEditing && <button onClick={controller.beginEditing} onKeyDown={controller.handleDisplayKeyDown} className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-left text-white shadow-md transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                <span className="font-medium">{controller.displayValue}</span>
                <span className="ml-2 text-xs text-indigo-200">
                  Click to edit
                </span>
              </button>}
            {controller.isEditing && <div className="space-y-2">
                <input ref={controller.inputRef} value={controller.draft} onChange={e => controller.updateDraft(e.target.value)} onBlur={controller.handleBlur} onKeyDown={controller.handleInputKeyDown} disabled={controller.status === "saving"} className="w-full rounded-lg border-2 border-indigo-300 bg-white px-4 py-3 text-indigo-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100" placeholder="Enter new value..." />
                <div className="flex gap-2 text-xs">
                  <button onClick={() => controller.saveDraft()} disabled={controller.status === "saving"} className="rounded bg-indigo-600 px-3 py-1 text-white hover:bg-indigo-700 disabled:bg-gray-400">
                    Save
                  </button>
                  <button onClick={controller.cancelEditing} disabled={controller.status === "saving"} className="rounded bg-gray-200 px-3 py-1 text-gray-700 hover:bg-gray-300 disabled:bg-gray-100">
                    Cancel
                  </button>
                </div>
              </div>}
            {controller.message && <div className={\`text-sm font-medium \${controller.messageTone === "error" ? "text-red-600" : controller.messageTone === "success" ? "text-green-600" : "text-indigo-600"}\`}>
                {controller.message}
              </div>}
          </div>}
      </InlineEditLabelHeadless>;
  }
}`,...(oe=(le=B.parameters)==null?void 0:le.docs)==null?void 0:oe.source}}};const be=["Basic","EmptyState","Interaction","CancelsWithEscape","RetryOnError","HeadlessCustomView"],we=Object.freeze(Object.defineProperty({__proto__:null,Basic:L,CancelsWithEscape:N,EmptyState:T,HeadlessCustomView:B,Interaction:D,RetryOnError:R,__namedExportsOrder:be,default:ye},Symbol.toStringTag,{value:"Module"}));export{L as B,T as E,D as I,R,we as S};

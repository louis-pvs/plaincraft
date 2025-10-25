import React from "react";

// Import demos by referencing the Demo export in each snippet file
// Example import below remains commented until a real snippet exists
// import { Demo as CopyToClipboardDemo } from "../../snippets/CopyToClipboard/CopyToClipboard";

export function App() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          UX Snippets Demo
        </h1>
        <p className="text-slate-700">
          Each card renders the Demo exported from its snippet file. Keyboard
          and screen reader paths are supported.
        </p>
      </header>
      <section className="grid gap-4 sm:grid-cols-2">
        {/* <DemoCard title="CopyToClipboard">
          <CopyToClipboardDemo />
        </DemoCard> */}
        <DemoCard title="Getting Started" className="border-dashed bg-slate-50">
          <EmptyState />
        </DemoCard>
      </section>
    </div>
  );
}

function DemoCard(props: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  const cardClass = ["rounded-md border border-slate-300 p-4", props.className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={cardClass}>
      <div className="mb-2 text-sm font-medium text-slate-700">
        {props.title}
      </div>
      <div>{props.children}</div>
    </div>
  );
}

function EmptyState() {
  return (
    <p className="text-slate-700">
      No snippets yet. Run{" "}
      <code className="bg-slate-100 px-1 font-mono">
        pnpm new:snippet YourName
      </code>{" "}
      then import its Demo here.
    </p>
  );
}

export function Header() {
  return (
    <header className="sticky top-0 z-10 flex items-center gap-sp-md border-b border-border-subtle bg-bg-base px-sp-md py-sp-sm backdrop-blur">
      <h1 className="text-2xl font-semibold tracking-tight text-text-primary">shaders.art</h1>

      <div className="ml-auto flex items-center gap-sp-sm">
        <button>検索</button>
        <button>Submit</button>
        <button>🌙</button>
      </div>
    </header>
  );
}

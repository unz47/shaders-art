import { Button } from "@frost-ui/react/atoms/button";

export function Header() {
  return (
    <header className="sticky top-0 z-10 flex items-center gap-sp-md border-b border-border-subtle bg-bg-base px-sp-md py-sp-sm backdrop-blur">
      <h1 className="text-2xl font-semibold tracking-tight text-text-primary">shaders.art</h1>

      <div className="ml-auto flex items-center gap-sp-sm">
        <Button variant="ghost" size="sm">
          検索
        </Button>
        <Button variant="primary" size="sm">
          Submit
        </Button>
        <Button variant="ghost" size="icon">
          🌙
        </Button>
      </div>
    </header>
  );
}

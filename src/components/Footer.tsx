// 仕様: Figma "Home / Desktop 1440" > Footer / Statement(node 10:263)
export function Footer() {
  return (
    <footer className="px-sp-xl pb-sp-xl pt-24">
      <div className="flex items-baseline gap-sp-md border-t border-border-subtle pt-sp-sm">
        <div className="flex items-baseline gap-sp-xs whitespace-nowrap">
          <span className="text-sm font-medium text-text-primary">shaders.art</span>
          <span className="text-xs tracking-wide text-text-muted">a museum of fragment shaders</span>
        </div>
        <div className="flex-1" />
        <div className="flex items-baseline gap-sp-md whitespace-nowrap text-sm">
          <span className="text-text-secondary">GitHub</span>
          <span className="text-text-secondary">Submit</span>
          <span className="text-text-secondary">Licenses</span>
          <span className="text-xs tracking-wide text-text-muted">© 2026 · one WebGL context · no backend</span>
        </div>
      </div>
    </footer>
  );
}

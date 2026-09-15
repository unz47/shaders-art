export default function Home() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-sp-lg px-sp-md">
      <div className="h-[2px] w-16 bg-accent-default" />
      <h1 className="text-display-size font-semibold leading-[1.1] tracking-[-0.02em]">
        shaders.art
      </h1>
      <p className="text-body-lg-size text-text-secondary">a museum of fragment shaders</p>
    </main>
  );
}

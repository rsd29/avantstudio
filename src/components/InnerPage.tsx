export default function InnerPage({
  title,
  lede,
  children,
}: {
  title: string;
  lede: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col px-[var(--page-px)] pt-[calc(var(--page-px)+5.75rem)] pb-16 md:pb-24">
      <header className="max-w-4xl">
        <h1 className="text-[clamp(3rem,8vw,6.5rem)] leading-[0.9] tracking-tight">
          {title}
        </h1>
        <p className="mt-6 max-w-2xl text-[clamp(1rem,2.2vw,1.5rem)] leading-snug tracking-tight text-zinc-600">
          {lede}
        </p>
      </header>
      <div className="mt-14 flex max-w-2xl flex-col gap-5 text-[0.95rem] leading-relaxed tracking-tight text-zinc-700 md:mt-16 md:text-base">
        {children}
      </div>
    </div>
  );
}

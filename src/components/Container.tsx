export default function Container({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`w-full px-[var(--page-px)] ${className}`.trim()}>
      {children}
    </div>
  );
}

export default function Container({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`w-full px-6 md:px-10 lg:px-12 ${className}`.trim()}>
      {children}
    </div>
  );
}

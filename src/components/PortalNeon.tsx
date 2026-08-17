type PortalLineProps = {
  facing: "left" | "right";
  opacityVar: "--hero-portal-line" | "--header-portal-line";
  leftVar?: "--header-clip-left";
  span?: "cap" | "full";
};

export default function PortalNeon({
  facing,
  opacityVar,
  leftVar,
  span = "cap",
}: PortalLineProps) {
  return (
    <div
      aria-hidden="true"
      className={`portal-line portal-line--${facing} portal-line--${span}`}
      style={{
        opacity: `var(${opacityVar}, 0)`,
        ...(leftVar ? { left: `var(${leftVar}, 100%)` } : {}),
      }}
    />
  );
}

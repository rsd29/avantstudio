import Container from "@/components/Container";

const menuLinks = [
  { href: "/", label: "Home" },
  { href: "#work", label: "Work" },
  { href: "#services", label: "Services" },
  { href: "#about", label: "About" },
  { href: "#contact", label: "Contact" },
];

function FooterWordmark() {
  return (
    <div className="px-[var(--page-px)]">
      <p className="font-logo text-3xl tracking-normal text-zinc-900 uppercase md:text-4xl">
        AVANT
      </p>
    </div>
  );
}

export default function Footer() {
  return (
    <footer id="contact" className="bg-white">
      <div className="pt-10 md:pt-14">
        <FooterWordmark />
      </div>
      <Container className="pt-10 pb-14 md:pt-14 md:pb-20">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-3 lg:gap-16">
          <div>
            <p className="mb-5 text-xs tracking-wide text-zinc-400">Menu</p>
            <ul className="space-y-2">
              {menuLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-base tracking-tight text-zinc-900 transition-opacity hover:opacity-50"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-5 text-xs tracking-wide text-zinc-400">Contact</p>
            <p className="text-base tracking-tight text-zinc-900">
              Melbourne, Australia
            </p>
            <p className="mt-1 text-base tracking-tight text-zinc-900">
              41 Stewart Street, Richmond VIC 3121
            </p>
          </div>

          <div>
            <p className="mb-5 text-xs tracking-wide text-zinc-400">Emails</p>
            <ul className="space-y-2">
              <li>
                <a
                  href="mailto:hello@avantstudio.com"
                  className="text-base tracking-tight text-zinc-900 transition-opacity hover:opacity-50"
                >
                  hello@avantstudio.com
                </a>
              </li>
              <li>
                <a
                  href="mailto:jobs@avantstudio.com"
                  className="text-base tracking-tight text-zinc-900 transition-opacity hover:opacity-50"
                >
                  jobs@avantstudio.com
                </a>
              </li>
            </ul>
          </div>
        </div>
      </Container>
    </footer>
  );
}

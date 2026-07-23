import Link from "next/link";
import Container from "@/components/Container";
import Hero from "@/components/Hero";

const services = [
  {
    title: "Brand & Design",
    description:
      "Identity systems, UI/UX, and visual storytelling tailored to your audience.",
  },
  {
    title: "Web Development",
    description:
      "Fast, accessible websites and web apps built with modern frameworks.",
  },
  {
    title: "Strategy",
    description:
      "Research-driven positioning and launch planning to set you up for growth.",
  },
];

const featuredProjects = [
  {
    title: "Northline Brand Refresh",
    category: "Branding",
    year: "2025",
  },
  {
    title: "Pulse Health App",
    category: "Product Design",
    year: "2025",
  },
];

export default function Home() {
  return (
    <>
      <Hero />

      <section className="border-t border-zinc-200 bg-zinc-50">
        <Container className="grid gap-8 py-20 md:grid-cols-3">
          {services.map((service) => (
            <div key={service.title}>
              <h2 className="text-lg uppercase tracking-tight text-zinc-900">
                {service.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                {service.description}
              </p>
            </div>
          ))}
        </Container>
      </section>

      <section className="border-t border-zinc-200">
        <Container className="py-20">
          <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-4 text-sm uppercase tracking-[0.2em] text-zinc-500">
                Selected Work
              </p>
              <h2 className="text-3xl uppercase tracking-tight text-zinc-900 md:text-4xl">
                Recent projects
              </h2>
            </div>
            <Link
              href="/projects"
              className="text-sm uppercase tracking-wide text-zinc-600 transition-colors hover:text-zinc-900"
            >
              View all →
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {featuredProjects.map((project) => (
              <article
                key={project.title}
                className="rounded-2xl border border-zinc-200 bg-white p-8"
              >
                <div className="mb-6 aspect-[16/10] rounded-xl bg-zinc-100" />
                <div className="flex items-center justify-between text-sm text-zinc-500">
                  <span>{project.category}</span>
                  <span>{project.year}</span>
                </div>
                <h3 className="mt-3 text-xl uppercase tracking-tight text-zinc-900">
                  {project.title}
                </h3>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-t border-zinc-200 bg-zinc-900">
        <Container className="py-20 text-center">
          <p className="mb-4 text-sm uppercase tracking-[0.2em] text-zinc-400">
            Let&apos;s work together
          </p>
          <h2 className="text-3xl uppercase tracking-tight text-white md:text-4xl">
            Ready to start your next project?
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-zinc-400">
            Tell us about your goals and we&apos;ll help you bring them to life.
          </p>
          <a
            href="mailto:hello@avantstudio.com"
            className="mt-8 inline-block rounded-full bg-white px-8 py-3.5 text-sm uppercase tracking-wide text-zinc-900 transition-colors hover:bg-zinc-200"
          >
            Get in touch
          </a>
        </Container>
      </section>
    </>
  );
}

import type { Metadata } from "next";
import Container from "@/components/Container";

export const metadata: Metadata = {
  title: "Projects | Avant Studio",
  description: "Selected work from Avant Studio.",
};

const projects = [
  {
    title: "Northline Brand Refresh",
    category: "Branding",
    year: "2025",
    description:
      "Full identity overhaul and marketing site for a sustainable fashion label.",
  },
  {
    title: "Pulse Health App",
    category: "Product Design",
    year: "2025",
    description:
      "Mobile-first wellness platform with onboarding, dashboards, and habit tracking.",
  },
  {
    title: "Atlas Architecture",
    category: "Web Development",
    year: "2024",
    description:
      "Portfolio website with case study templates and a CMS-driven project gallery.",
  },
  {
    title: "Summit Conference",
    category: "Campaign",
    year: "2024",
    description:
      "Event landing page, registration flow, and social assets for a tech summit.",
  },
];

export default function ProjectsPage() {
  return (
    <Container className="flex-1 py-20">
      <div className="mb-16 w-full">
        <p className="mb-4 text-sm font-medium uppercase tracking-widest text-zinc-500">
          Our Work
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 md:text-5xl">
          Projects
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-zinc-600">
          A selection of recent engagements across branding, product, and web.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {projects.map((project) => (
          <article
            key={project.title}
            className="group rounded-2xl border border-zinc-200 bg-white p-8 transition-shadow hover:shadow-md"
          >
            <div className="mb-6 aspect-[16/10] rounded-xl bg-zinc-100" />
            <div className="flex items-center justify-between text-sm text-zinc-500">
              <span>{project.category}</span>
              <span>{project.year}</span>
            </div>
            <h2 className="mt-3 text-xl font-semibold text-zinc-900">
              {project.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600">
              {project.description}
            </p>
          </article>
        ))}
      </div>
    </Container>
  );
}

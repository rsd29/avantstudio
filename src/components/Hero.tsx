import Link from "next/link";
import Container from "@/components/Container";

export default function Hero() {
  return (
    <section className="relative flex min-h-dvh flex-col justify-center">
      <Container>
        <p className="mb-6 text-sm uppercase tracking-[0.2em] text-zinc-500">
          Creative Agency
        </p>
        <h1 className="w-full text-5xl uppercase leading-[0.95] tracking-tight text-zinc-900 md:text-7xl lg:text-8xl">
          We craft digital experiences that move brands forward.
        </h1>
        <p className="mt-8 w-full text-base leading-relaxed text-zinc-600 md:text-lg">
          Avant Studio is a design and development agency helping ambitious
          companies build products, websites, and campaigns that stand out.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            href="/projects"
            className="rounded-full bg-zinc-900 px-8 py-3.5 text-sm uppercase tracking-wide text-white transition-colors hover:bg-zinc-700"
          >
            View our work
          </Link>
          <a
            href="mailto:hello@avantstudio.com"
            className="rounded-full border border-zinc-300 px-8 py-3.5 text-sm uppercase tracking-wide text-zinc-900 transition-colors hover:border-zinc-900"
          >
            Get in touch
          </a>
        </div>
      </Container>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <span className="text-xs uppercase tracking-[0.25em] text-zinc-400">
          Scroll
        </span>
      </div>
    </section>
  );
}

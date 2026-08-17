import type { Metadata } from "next";
import InnerPage from "@/components/InnerPage";

export const metadata: Metadata = {
  title: "About | Avant Studio",
  description:
    "Avant Studio is a Melbourne practice for digital products, websites and ideas built with purpose.",
};

export default function AboutPage() {
  return (
    <InnerPage
      title="About"
      lede="A Melbourne studio for digital products, websites and ideas built with purpose."
    >
      <p>
        Avant Studio is a small practice grounded in UX, shaped by design, and
        informed by years of building for the web. The work is quiet on purpose
        — systems that hold space for the product instead of competing with it.
      </p>
      <p>
        We work with labels, product teams, and cultural organisations that want
        the interface to feel considered. Brand, product, and web sit in the
        same room so the result has one rhythm, not three.
      </p>
      <p>
        This page is a placeholder. A fuller studio story, people, and process
        will live here.
      </p>
    </InnerPage>
  );
}

import type { Metadata } from "next";
import InnerPage from "@/components/InnerPage";

export const metadata: Metadata = {
  title: "Contact | Avant Studio",
  description: "Get in touch with Avant Studio in Melbourne.",
};

export default function ContactPage() {
  return (
    <InnerPage
      title="Contact"
      lede="New work, collaborations, and conversations. Melbourne time."
    >
      <p>
        41 Stewart Street
        <br />
        Richmond VIC 3121
        <br />
        Australia
      </p>
      <p>
        <a
          href="mailto:hello@avantstudio.com"
          className="transition-opacity hover:opacity-50"
        >
          hello@avantstudio.com
        </a>
        <br />
        <a
          href="mailto:jobs@avantstudio.com"
          className="transition-opacity hover:opacity-50"
        >
          jobs@avantstudio.com
        </a>
      </p>
      <p>
        A contact form will live here. Until then, email is the fastest way
        through.
      </p>
    </InnerPage>
  );
}

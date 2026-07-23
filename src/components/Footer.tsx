import Container from "@/components/Container";

export default function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-white">
      <Container className="flex items-center justify-between py-8">
        <p className="text-sm text-zinc-500">
          &copy; {new Date().getFullYear()} Avant Studio. All rights reserved.
        </p>
        <p className="text-sm text-zinc-500">hello@avantstudio.com</p>
      </Container>
    </footer>
  );
}

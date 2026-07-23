import type { Metadata } from "next";
import { Special_Gothic_Expanded_One } from "next/font/google";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import SmoothScroll from "@/components/SmoothScroll";
import "./globals.css";

const specialGothic = Special_Gothic_Expanded_One({
  variable: "--font-special-gothic",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Avant Studio | Creative Agency",
  description:
    "Avant Studio is a creative agency specializing in brand design, web development, and digital strategy.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${specialGothic.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-white font-sans text-zinc-900">
        <SmoothScroll>
          <Header />
          <main className="flex flex-1 flex-col">{children}</main>
          <Footer />
        </SmoothScroll>
      </body>
    </html>
  );
}

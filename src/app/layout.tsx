import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import localFont from "next/font/local";
import FluidTrail from "@/components/FluidTrail";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import IntroProvider from "@/components/IntroProvider";
import SmoothScroll from "@/components/SmoothScroll";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});

const helveticaNow = localFont({
  src: [
    {
      path: "../fonts/HelveticaNowText-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/HelveticaNowText-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../fonts/HelveticaNowText-Medium.woff2",
      weight: "600",
      style: "normal",
    },
  ],
  variable: "--font-helvetica-now",
  display: "swap",
});

const baunk = localFont({
  src: "../fonts/Baunk.ttf",
  variable: "--font-baunk",
  display: "swap",
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
      className={`${helveticaNow.variable} ${baunk.variable} ${dmSans.variable} h-full antialiased`}
    >
      <body className="relative flex min-h-full flex-col bg-white font-sans text-zinc-900">
        <IntroProvider>
          <SmoothScroll>
            <Header />
            <main className="flex flex-1 flex-col">{children}</main>
            <Footer />
          </SmoothScroll>
        </IntroProvider>
        <FluidTrail />
      </body>
    </html>
  );
}

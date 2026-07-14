import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Velora Cabs | Premium Taxi & Corporate Travel",
  description:
    "Book Local Taxi, Airport Transfer, Outstation Taxi, Ride Sharing & Corporate Transport with Velora Cabs.",
  keywords: [
    "Taxi",
    "Cab",
    "Noida Taxi",
    "Delhi Taxi",
    "Airport Taxi",
    "Corporate Taxi",
    "Ride Sharing",
    "Velora Cabs",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#050816] text-white">
        {children}
      </body>
    </html>
  );
}

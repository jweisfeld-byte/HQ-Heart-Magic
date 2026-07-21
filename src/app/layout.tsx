import type { Metadata } from "next";
import { Alice, Poppins, Josefin_Sans } from "next/font/google";
import "./globals.css";

const alice = Alice({
  variable: "--font-alice",
  weight: "400",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
});

const josefin = Josefin_Sans({
  variable: "--font-josefin",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Heart Magic HQ",
  description: "The operating system for Heart Magic.",
};

// Applies the saved theme preference (Settings → Profile) before first
// paint, so there's no flash of the wrong theme. Falls back to the
// automatic prefers-color-scheme behavior in globals.css when no
// preference has been saved (localStorage empty/"system").
const THEME_INIT_SCRIPT = `
(function () {
  try {
    var theme = localStorage.getItem("hm-theme");
    if (theme === "dark" || theme === "light") {
      document.documentElement.setAttribute("data-theme", theme);
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${alice.variable} ${poppins.variable} ${josefin.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

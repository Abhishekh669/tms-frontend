import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";
import QueryProvider from "@/providers/QueryProvider";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ghar mai Sikshya - Best Home Tuition & Teacher Recruitment Platform",
  description:
    "Find qualified home tuition teachers in your area. Ghar mai Sikshya connects parents with experienced tutors for personalized home tuition. Best platform for teacher recruitment and home tutoring services.",
  keywords: [
    "home tuition",
    "home tutor",
    "teacher recruitment",
    "tuition teacher",
    "private tutor",
    "home tutoring services",
    "ghar mai tuition",
    "tuition classes",
    "qualified teachers",
    "home education"
  ],
  authors: [{ name: "Abhishekh Group" }],
  creator: "Abhishekh Group",
  publisher: "Abhishekh Group",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  applicationName: "Ghar mai Sikshya",
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${poppins.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-poppins">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            {children}
            <Toaster position="top-right" richColors closeButton />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
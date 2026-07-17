import type { ReactNode } from "react";
import "../src/styles.css";

export const metadata = {
  title: "MethaneLens",
  description: "Explainable methane-plume analysis for synthetic hyperspectral imagery.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

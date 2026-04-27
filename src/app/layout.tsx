import type { Metadata } from "next";
import "./globals.css";
import Navigation from '@/components/Navigation';

export const metadata: Metadata = {
  title: "Registrador Web",
  description: "Sistema de registro de ventas, gastos y comisiones.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <Navigation />
        <main className="container">
          {children}
        </main>
      </body>
    </html>
  );
}

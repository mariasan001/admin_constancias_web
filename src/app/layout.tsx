import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Poppins } from "next/font/google";

export const metadata = {
  title: "Portal | Iniciar Sesión",
  description: "Acceso al sistema",
};

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["100","200","300","400","500","600","700","800","900"],
  style: ["normal","italic"],
  display: "swap",
  variable: "--font-poppins",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-MX" className={poppins.variable}>
      <body className="app-body">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

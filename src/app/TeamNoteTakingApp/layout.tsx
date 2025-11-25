
import { LanguageProvider } from "./context/LanguageContext";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <main lang="en">
      
        <LanguageProvider>{children}</LanguageProvider>
      
    </main>
  );
}

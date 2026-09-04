import "./globals.css";

export const metadata = {
  title: "The Lenny Growth Assistant",
  description: "Enterprise-grade RAG and Agentic Assistant for Product & Growth Leaders",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full antialiased text-slate-900 bg-slate-50 flex flex-col">
        {children}
      </body>
    </html>
  );
}

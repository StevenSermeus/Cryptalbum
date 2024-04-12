import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { type AppType } from "next/app";
import { Inter } from "next/font/google";
import { ToastContainer } from "react-toastify";
import { Navigation } from "@/components/Navigation";
import "react-toastify/dist/ReactToastify.css";
import { api } from "@/utils/api";

import "@/styles/globals.css";
import { CommandMenu } from "@/components/CommandMenu";
import { ThemeProvider } from "@/components/ThemeProvider";
import { useState } from "react";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  const [open, setOpen] = useState(false);
  return (
    <SessionProvider session={session}>
      <main className={`font-sans ${inter.variable}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <Navigation />
          <ToastContainer />
          <Component {...pageProps} />
        </ThemeProvider>
      </main>
    </SessionProvider>
  );
};

export default api.withTRPC(MyApp);

import { useState, useEffect } from "react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { MoonIcon, SunIcon } from "@radix-ui/react-icons";
import { useTheme } from "next-themes";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { LogIn, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const session = useSession();

  const router = useRouter();
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <>
      <Button
        variant="outline"
        className={cn(
          "relative h-8 w-full justify-start rounded-[0.5rem] bg-background text-sm font-normal text-muted-foreground shadow-none sm:pr-12 md:w-40 lg:w-48",
        )}
        onClick={() => setOpen(true)}
      >
        <span className="hidden lg:inline-flex">Search something...</span>
        <span className="inline-flex lg:hidden">Search...</span>
        <CommandKey />
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Suggestions">
            {session.data ? (
              <CommandItem
                onSelect={() => {
                  setOpen(false);
                  signOut();
                }}
              >
                <LogOut className="mr-2" />
                Sign out
              </CommandItem>
            ) : (
              <CommandItem
                onSelect={() => {
                  setOpen(false);
                  router.push("/auth/signin");
                }}
              >
                <LogIn className="mr-2" />
                Sign in
              </CommandItem>
            )}
            <CommandItem
              onSelect={() => {
                setTheme(theme === "dark" ? "light" : "dark");
                setOpen(false);
              }}
            >
              {theme === "dark" ? (
                <SunIcon className="mr-2" />
              ) : (
                <MoonIcon className="mr-2" />
              )}
              Toggle theme
            </CommandItem>
          </CommandGroup>
          <NavigationCommandGroup setOpen={setOpen} />
        </CommandList>
      </CommandDialog>
    </>
  );
}

interface NavigationCommandGroupProps {
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

function NavigationCommandGroup({ setOpen }: NavigationCommandGroupProps) {
  const router = useRouter();
  return (
    <CommandGroup heading="Navigation">
      <CommandItem
        onSelect={() => {
          router.push("/");
          setOpen(false);
        }}
      >
        Home
      </CommandItem>
      <CommandItem
        onSelect={() => {
          router.push("/gallery");
          setOpen(false);
        }}
      >
        Gallery
      </CommandItem>
    </CommandGroup>
  );
}

function CommandKey() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  return (
    <kbd className="pointer-events-none absolute right-[0.3rem] top-[0.3rem] hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
      <span className="text-xs">
        {isClient && navigator.userAgent.includes("Mac OS X") ? "⌘" : "Ctrl"}
      </span>
      k
    </kbd>
  );
}

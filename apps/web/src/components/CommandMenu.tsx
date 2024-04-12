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
import { LogIn, LogOut, User } from "lucide-react";

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
            }}
          >
            {theme === "dark" ? <SunIcon /> : <MoonIcon />} Toggle theme
          </CommandItem>
          <CommandItem
            onSelect={() => {
              setOpen(false);
            }}
          >
            Close Command Menu
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

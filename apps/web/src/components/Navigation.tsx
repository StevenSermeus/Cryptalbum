"use client";
import * as React from "react";
import Link from "next/link";

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { CommandMenu } from "./CommandMenu";
import { useSession } from "next-auth/react";

export function Navigation() {
  const session = useSession();
  return (
    <NavigationMenu className="mx-auto">
      <NavigationMenuList>
        <NavigationMenuItem>
          {session.data ? (
            <Link href="/" className="font-bold">
              Welcome, {session.data.user.name}
            </Link>
          ) : (
            <></>
          )}
          <NavigationMenuLink
            href="/"
            className="font-bold"
          ></NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <Link href="/" legacyBehavior passHref>
            <NavigationMenuLink className={navigationMenuTriggerStyle()}>
              Home
            </NavigationMenuLink>
          </Link>
        </NavigationMenuItem>
        <NavigationMenuItem>
          {session.data ? (
            <Link href="/gallery" legacyBehavior passHref>
              <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                Gallery
              </NavigationMenuLink>
            </Link>
          ) : (
            <></>
          )}
        </NavigationMenuItem>
        <NavigationMenuItem>
          {session.data ? (
            <Link href="/auth/device" legacyBehavior passHref>
              <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                Devices Management
              </NavigationMenuLink>
            </Link>
          ) : (
            <></>
          )}
        </NavigationMenuItem>
        <NavigationMenuItem>
          {session.data ? (
            <></>
          ) : (
            <Link href="/auth/addDevice" legacyBehavior passHref>
              <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                Add a device
              </NavigationMenuLink>
            </Link>
          )}
        </NavigationMenuItem>
        <NavigationMenuItem>
          {session.data ? (
            <></>
          ) : (
            <Link href="/auth/register" legacyBehavior passHref>
              <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                Register
              </NavigationMenuLink>
            </Link>
          )}
        </NavigationMenuItem>
        <NavigationMenuItem>
          {session.data ? (
            <></>
          ) : (
            <Link href="/auth/signin" legacyBehavior passHref>
              <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                Sign in
              </NavigationMenuLink>
            </Link>
          )}
        </NavigationMenuItem>
        <NavigationMenuItem>
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <CommandMenu />
          </div>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}

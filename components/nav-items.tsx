"use client"

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import path from "path";
import React from 'react'


const navItems = [
    { label: 'Home', href: '/' },
    { label: 'My Journey', href: '/my-journey' },
    { label: 'Companions', href: '/companions' },
]
const NavItems = () => {

    const pathName = usePathname();
  return (
      <nav className="flex items-center gap-4">
          {
              navItems.map(({ label, href }) => (
                  <Link key={label} href={href} className={cn(pathName === href && 'text-primary font-semibold')}>
                      {label}
                  </Link>
              ))
          }
    </nav>
  )
}

export default NavItems
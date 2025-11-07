"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

const navItems = [
    { label: "Home", href: "/" },
    { label: "Companions", href: "/companions" },
    { label: "My Journey", href: "/my-journey" },
];

const NavItems = () => {
    const pathname = usePathname();

    return (
        <nav className="flex items-center gap-6">
            {navItems.map(({ label, href }) => (
                <Link
                    key={label}
                    href={href}
                    className={cn(
                        "transition-colors hover:text-primary font-medium",
                        pathname === href ? "text-primary font-semibold" : "text-gray-700"
                    )}
                >
                    {label}
                </Link>
            ))}
        </nav>
    );
};

export default NavItems;
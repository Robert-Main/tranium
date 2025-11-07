import Image from "next/image";
import Link from "next/link";
import React from "react";
import NavItems from "../nav-items";
import { SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import MobileNav from "./mobile-navbar";

const Navbar = () => {
    return (
        <nav className="navbar">
            <Link href="/">
                <div className="flex items-center gap-1 cursor-pointer rounded-full">
                    <Image src="/images/TRANIUM-l.png" alt="logo" width={60} height={60} className="rounded-full mr-0" />
                    <p className="font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                        Tranium
                    </p>
                </div>
            </Link>

            <div className="hidden md:flex items-center gap-8">
                <NavItems />
                <SignedOut>
                    <SignInButton>
                        <button className="btn-signin">Sign In</button>
                    </SignInButton>
                </SignedOut>
                <UserButton />
            </div>

            <div className="flex md:hidden items-center gap-4">
                <SignedOut>
                    <SignInButton>
                        <button className="btn-signin text-sm px-4 py-2">Sign In</button>
                    </SignInButton>
                </SignedOut>
                <UserButton />
                <MobileNav />
            </div>
        </nav>
    );
};

export default Navbar;

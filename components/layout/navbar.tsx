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
                <div className="flex items-center gap-2.5 cursor-pointer">
                    <Image src="/images/logo.svg" alt="logo" width={46} height={44} />
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
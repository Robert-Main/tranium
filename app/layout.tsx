import type { Metadata } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/navbar";
import { ClerkProvider} from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";
import NetworkErrorToast from "@/components/common/network-error-toast";

const bricolage = Bricolage_Grotesque({
    variable: "--font-bricolage",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Tranium",
    description: "Real-time AI Teaching Platform",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={`${bricolage.variable} antialiased`}>
                <ClerkProvider appearance={{ variables: { colorPrimary: "fe5933" } }}>
                    <Toaster />
                    <NetworkErrorToast />
                    <Navbar />
                    {children}
                </ClerkProvider>
            </body>
        </html>
    );
}

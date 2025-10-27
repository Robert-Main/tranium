"use client";

import React, { useState } from "react";
import { Button } from "./ui/button";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { addUserBookmarks, removeUserBookmarks } from "@/lib/actions/companion.action";
import { toast } from "sonner";

interface CompanionCardProps {
    id: string;
    name: string;
    topic: string;
    subject: string;
    duration: number;
    color: string;
    bookmarked: boolean;
}

const CompanionCard = ({
    id,
    name,
    topic,
    subject,
    duration,
    color,
    bookmarked: initialBookmarked,
}: CompanionCardProps) => {
    const pathname = usePathname();
    const [bookmarked, setBookmarked] = useState(initialBookmarked);

    const handleBookmark = async () => {

        if (bookmarked) {
            const res = await removeUserBookmarks(id, pathname);
            if (res.success) {
                setBookmarked(false);
                console.log("bookmark removed successfully:");
                toast.success("Bookmark removed successfully!");
            } else {
                console.error("Failed to remove bookmark:", res.error);
                toast.error("Failed to remove bookmark");
            }
        } else {
            const res = await addUserBookmarks(id, pathname);
            if (res.success) {
                setBookmarked(true);
                console.log("Bookmark saved successfully:", res.data);
                toast.success("Bookmark saved successfully!");
            } else {
                console.error("Failed to save bookmark:", res.error);
                toast.error("Failed to save bookmark");
            }
        }

    };

    return (
        <article className="companion-card" style={{ backgroundColor: color }}>
            <div className="flex justify-between items-center">
                <div className="subject-badge">{subject}</div>
                <button className="companion-bookmark" onClick={handleBookmark}>
                    <Image
                        src={bookmarked ? "/icons/bookmark-filled.svg" : "/icons/bookmark.svg"}
                        alt="bookmark"
                        width={12.5}
                        height={15}
                    />
                </button>
            </div>

            <h2 className="text-2xl font-bold">{name}</h2>
            <p className="text-sm">{topic}</p>
            <div className="flex items-center gap-2">
                <Image src="/icons/clock.svg" alt="duration" width={13.5} height={13.5} />
                <p className="text-sm">{duration} minutes</p>
            </div>

            <Link href={`/companions/${id}`} className="w-full">
                <button className="btn-primary w-full justify-center">Launch Lesson</button>
            </Link>
        </article>
    );
};

export default CompanionCard;

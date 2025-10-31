"use client";

import React, { useState } from "react";
import { Button } from "./ui/button";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { addUserBookmarks, deleteCompanion, removeUserBookmarks } from "@/lib/actions/companion.action";
import { toast } from "sonner";
import { Edit, Trash2, TrashIcon } from "lucide-react";

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
    const router = useRouter();
    const [bookmarked, setBookmarked] = useState(initialBookmarked);
    const [isDeleting, setIsDeleting] = useState(false);

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

    const handleDelete = async (id: string) => {
        setIsDeleting(true);
        const res = await deleteCompanion(id);
        if (res.success) {
            toast.success("Companion deleted successfully!");
            router.refresh();
        } else {
            toast.error("Failed to delete companion", { description: res.error });
        }
        setIsDeleting(false);
    };

    return (
        <article className="companion-card" style={{ backgroundColor: color }}>
            <div className="flex justify-between items-center">
                <div className="subject-badge">{subject}</div>
                <div className="flex gap-2 items-center">
                    <button className="companion-bookmark" onClick={handleBookmark}>
                        <Image
                            src={bookmarked ? "/icons/bookmark-filled.svg" : "/icons/bookmark.svg"}
                            alt="bookmark"
                            width={12.5}
                            height={12.5}
                        />
                    </button>
                    <Link href={`/companions/${id}/edit`}>
                        <button className="companion-bookmark">
                            <Edit className="text-green-400 size-3.5" />
                        </button>
                    </Link>
                    <button className="companion-bookmark" onClick={() => handleDelete(id)}>
                        <Trash2 className="text-primary size-3.5" />
                    </button>
                </div>
            </div>

            <h2 className="text-2xl font-bold">{name}</h2>
            <p className="text-sm truncate">{topic}</p>
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

"use client";

import React, { useState } from "react";
import { Button } from "./ui/button";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { addUserBookmarks, deleteCompanion, removeUserBookmarks } from "@/lib/actions/companion.action";
import { toast } from "sonner";
import { Edit, Trash2, Clock, Play, Bookmark, BookmarkCheck } from "lucide-react";
import ConfirmModal from "./confirm-modal";
import { cn } from "@/lib/utils";

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
                toast.success("Bookmark removed successfully!");
            } else {
                console.error("Failed to remove bookmark:", res.error);
                toast.error("Failed to remove bookmark");
            }
        } else {
            const res = await addUserBookmarks(id, pathname);
            if (res.success) {
                setBookmarked(true);
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
        <article className="group relative flex flex-col rounded-3xl border-2 border-gray-200 bg-white overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 hover:border-gray-300">
            <div
                className="relative h-32 flex items-center justify-center overflow-hidden"
                style={{ backgroundColor: color }}
            >
                <div className="relative z-10">
                    <Image
                        src={`/icons/${subject}.svg`}
                        alt={subject}
                        width={60}
                        height={60}
                        className="transition-transform duration-300 group-hover:scale-110"
                    />
                </div>

                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="absolute top-3 right-3 flex gap-2">
                    <button
                        onClick={handleBookmark}
                        className={cn(
                            "p-2 rounded-full backdrop-blur-sm transition-all duration-200",
                            bookmarked
                                ? "bg-white/90 text-yellow-500 hover:bg-white"
                                : "bg-white/70 text-gray-700 hover:bg-white/90"
                        )}
                        title={bookmarked ? "Remove bookmark" : "Add bookmark"}
                    >
                        {bookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4 cursor-pointer" />}
                    </button>
                </div>

                <div className="absolute bottom-3 left-3">
                    <div className="bg-black/80 backdrop-blur-sm text-white rounded-full text-xs px-3 py-1.5 font-medium capitalize">
                        {subject}
                    </div>
                </div>
            </div>

            <div className="flex flex-col flex-grow p-5 gap-4">
                <Link href={`/companions/${id}`}>
                    <h2 className="text-xl font-bold text-gray-900 line-clamp-2 hover:text-primary transition-colors duration-200">
                        {name}
                    </h2>
                </Link>

                <p className="text-sm text-gray-600 line-clamp-2 flex-grow min-h-[2.5rem]">{topic}</p>

                <div className="flex items-center gap-2 text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm font-medium">{duration} minutes</span>
                </div>

                <div className="border-t border-gray-200" />

                <div className="flex gap-2 items-center">
                    <Link href={`/companions/${id}`} className="flex-1">
                        <button className="cursor-pointer group w-full bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg px-4 py-2.5 flex items-center justify-center gap-2">
                            <Play className="w-4 h-4 transition-transform group-hover:scale-110 cursor-pointer" />
                            Launch Lesson
                        </button>
                    </Link>

                    <Link href={`/companions/${id}/edit`}>
                        <button
                            className="cursor-pointer p-2.5 rounded-xl border-2 border-gray-200 hover:bg-green-50 hover:border-green-500 hover:text-green-600 transition-all duration-200 bg-white"
                            title="Edit companion"
                        >
                            <Edit className="w-4 h-4 " />
                        </button>
                    </Link>

                    <ConfirmModal
                        trigger={
                            <button
                                className="cursor-pointer p-2.5 rounded-xl border-2 border-gray-200 hover:bg-red-50 hover:border-red-500 hover:text-red-600 transition-all duration-200 bg-white"
                                title="Delete companion"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        }
                        title="Delete companion?"
                        description="This action cannot be undone. This will permanently delete this companion."
                        confirmText={isDeleting ? "Deleting..." : "Delete"}
                        onConfirm={() => handleDelete(id)}
                    />
                </div>
            </div>
        </article>
    );
};

export default CompanionCard;

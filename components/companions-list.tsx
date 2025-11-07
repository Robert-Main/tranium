"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { cn, getSubjectColor } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Airplay, Ellipsis, Trash, Clock, Play } from "lucide-react";
import { deleteSessionHistory } from "@/lib/actions/companion.action";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import ConfirmModal from "./confirm-modal";

interface CompanionsListProps {
    title?: string;
    companions?: Companion[];
    className?: string;
    isSessionHistory?: boolean;
}

const CompanionsList = ({ title, companions, className, isSessionHistory = false }: CompanionsListProps) => {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = React.useState(false);

    const handleDelete = async (sessionId: string) => {
        if (!sessionId) {
            toast.error("Session ID is missing");
            return;
        }

        setIsDeleting(true);
        const res = await deleteSessionHistory(sessionId);
        if (res.success) {
            toast.success("Session deleted successfully!");
            router.refresh();
        } else {
            toast.error("Failed to delete session", { description: res.error });
        }
        setIsDeleting(false);
    };

    return (
        <article className={cn("bg-white rounded-3xl border-2 border-gray-200 p-6 shadow-sm", className)}>
            {title && (
                <h2 className="font-bold text-2xl mb-6 text-gray-900">{title}</h2>
            )}

            <div className="space-y-3">
                {companions?.map((companion, index) => (
                    <div
                        key={companion.id || index}
                        className="group flex items-center gap-4 p-4 rounded-2xl border-2 border-gray-100 bg-white hover:border-gray-300 hover:shadow-md transition-all duration-200 max-md:flex-col max-md:items-start"
                    >
                        <Link
                            href={`/companions/${companion.id}`}
                            className="flex items-center gap-4 flex-1 min-w-0 max-md:w-full"
                        >
                            <div
                                className="size-16 flex items-center justify-center rounded-xl flex-shrink-0 transition-transform duration-200 group-hover:scale-105"
                                style={{ backgroundColor: getSubjectColor(companion.subject) }}
                            >
                                <Image
                                    src={`/icons/${companion.subject}.svg`}
                                    alt={companion.subject}
                                    width={32}
                                    height={32}
                                />
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <h3 className="font-bold text-lg text-gray-900 group-hover:text-primary transition-colors">
                                        {companion.name}
                                    </h3>
                                    <span className="bg-black text-white rounded-full text-xs px-2.5 py-1 font-medium capitalize">
                                        {companion.subject}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 line-clamp-1">
                                    {companion.topic}
                                </p>
                            </div>
                        </Link>

                        <div className="flex items-center gap-3 max-md:w-full max-md:justify-between max-md:pl-20">
                            <div className="flex items-center gap-2 text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                                <Clock className="w-4 h-4" />
                                <span className="text-sm font-medium whitespace-nowrap">
                                    {companion.duration} mins
                                </span>
                            </div>

                            <DropdownMenu>
                                <DropdownMenuTrigger className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                    <Ellipsis className="w-5 h-5 text-gray-600" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuItem asChild>
                                        <Link
                                            href={`/companions/${companion.id}`}
                                            className="flex items-center gap-2 cursor-pointer"
                                        >
                                            <Play className="w-4 h-4 text-green-500" />
                                            <span className="font-medium">Start Lesson</span>
                                        </Link>
                                    </DropdownMenuItem>

                                    {isSessionHistory && (
                                        <ConfirmModal
                                            trigger={
                                                <DropdownMenuItem
                                                    onSelect={(e) => e.preventDefault()}
                                                    className="text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer"
                                                >
                                                    <Trash className="w-4 h-4" />
                                                    <span className="font-medium">Delete Session</span>
                                                </DropdownMenuItem>
                                            }
                                            title="Delete session?"
                                            description="This action cannot be undone. This will permanently delete this session."
                                            confirmText={isDeleting ? "Deleting..." : "Delete"}
                                            onConfirm={() => handleDelete(companion.sessionId)}
                                        />
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                ))}

                {(!companions || companions.length === 0) && (
                    <div className="text-center py-12 text-gray-500">
                        <p className="text-lg">No companions found</p>
                        <p className="text-sm mt-1">Create your first companion to get started!</p>
                    </div>
                )}
            </div>
        </article>
    );
};

export default CompanionsList;
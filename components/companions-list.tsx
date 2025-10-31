"use client";

import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";
import Image from "next/image";
import { cn, getSubjectColor } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Airplay, Ellipsis, Trash } from "lucide-react";
import {  deleteSessionHistory } from "@/lib/actions/companion.action";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface CompanionsListProps {
    title?: string;
    companions?: Companion[];
    className?: string;
    isSessionHistory?: boolean
}

const CompanionsList = ({ title, companions, className, isSessionHistory = false }: CompanionsListProps) => {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = React.useState(false);
    const handleDelete = async (sessionId: string) => {
        console.log("Attempting to delete session with ID:", sessionId);

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
    }
    return (
        <article className={cn("companion-list", className)}>
            <h2 className="font-bold text-3xl">{title}</h2>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="text-lg w-2/3">Lessons</TableHead>
                        <TableHead className="text-lg ">Subject</TableHead>
                        <TableHead className="text-right text-lg">Duration</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {companions?.map((companion, index) => (
                        <TableRow key={index}>
                            <TableCell className="font-medium">
                                <Link href={`/companions/${companion.id}`} className="hover:underline">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="size-[72px] flex items-center justify-center rounded-lg max-md:hidden "
                                            style={{
                                                backgroundColor: getSubjectColor(companion.subject),
                                            }}
                                        >
                                            <Image
                                                src={`/icons/${companion.subject}.svg`}
                                                alt={companion.subject}
                                                width={35}
                                                height={35}
                                                className="rounded-full"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <p className="font-bold text-xl">{companion.name}</p>
                                            <p className="text-medium line-clamp-2 w-full max-w-[400px]">{companion.topic}</p>
                                        </div>
                                    </div>
                                </Link>
                            </TableCell>
                            <TableCell>
                                <div className="subject-badge w-fit">{companion.subject} </div>
                                <div
                                    className="flex items-center justify-center rounded-lg w-fit p-2 md:hidden"
                                    style={{ backgroundColor: getSubjectColor(companion.subject) }}
                                >
                                    <Image
                                        src={`/icons/${companion.subject}.svg`}
                                        alt={companion.subject}
                                        width={18}
                                        height={18}
                                        className="rounded-full"
                                    />
                                </div>
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex items-center gap-2 w-full text-right justify-end">
                                    <p className="text-2xl">
                                        {companion.duration} <span className="max-md:hidden">mins</span>
                                    </p>
                                    <Image
                                        src="/icons/clock.svg"
                                        alt="clock"
                                        width={13.5}
                                        height={13.5}
                                        className="md:hidden"
                                    />
                                </div>
                            </TableCell>
                            <TableCell className="text-right">
                                 <DropdownMenu>
                                    <DropdownMenuTrigger>
                                        <Ellipsis className="cursor-pointer"/>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuItem className="text-green-500">
                                            <Airplay />
                                            <Link
                                                href={`/companions/${companion.id}`}
                                                className="font-medium"
                                            >
                                                Start Lesson
                                            </Link>
                                        </DropdownMenuItem>
                                        {isSessionHistory &&  (
                                            <DropdownMenuItem
                                                disabled={isDeleting}
                                                onClick={() => handleDelete(companion.sessionId)}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <Trash className="text-red-400" />
                                                Delete session
                                            </DropdownMenuItem>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </article>
    );
};

export default CompanionsList;

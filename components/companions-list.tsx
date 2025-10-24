import React from "react";
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import Image from "next/image";
import { cn, getSubjectColor } from "@/lib/utils";


interface CompanionsListProps {
    title?: string;
    companions?: Companion[];
    className?: string;
}

const CompanionsList = ({ title, companions, className }: CompanionsListProps) => {
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
                    {companions?.map((companion) => (
                        <TableRow key={companion.id}>
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
                                            <p className="font-bold text-2xl">{companion.name}</p>
                                            <p className="text-lg">{companion.topic}</p>
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
                                <div className="flex items-center gap-2 w-full">
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
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </article>
    );
};

export default CompanionsList;

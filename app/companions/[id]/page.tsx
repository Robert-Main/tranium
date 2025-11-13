import CompanionComponents from "@/components/companion-components";
import { getCompanionById } from "@/lib/actions/companion.action";
import { getSubjectColor } from "@/lib/utils";
import { currentUser } from "@clerk/nextjs/server";
import Image from "next/image";
import { redirect } from "next/navigation";
import React from "react";
import { Clock, BookOpen, StickyNote } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import NotesSection from "@/components/notes-section";
import { listNotesByCompanion } from "@/lib/actions/notes.action";

interface CompanionSessionProps {
    params: Promise<{ id: string }>;
}

const CompanionSession = async ({ params }: CompanionSessionProps) => {
    const { id } = await params;
    const companionRes = await getCompanionById(id);
    const user = await currentUser();

    if (!user) redirect("/sign-in");
    if (!companionRes || !companionRes.success || !companionRes.data) redirect("/companions");

    const { subject, name, duration, topic, author } = companionRes.data;

    if (author && user.id !== author) {
        redirect("/companions");
    }

    const notes  = await listNotesByCompanion(id);

    return (
        <main className="max-w-[1600px] mx-auto px-4 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <article className="relative overflow-hidden rounded-3xl border border-gray-200/60 bg-gradient-to-br from-white via-gray-50/30 to-white shadow-xl backdrop-blur-sm">
                        <div
                            className="absolute top-0 right-0 w-96 h-96 rounded-full blur-[100px] opacity-10"
                            style={{ backgroundColor: getSubjectColor(subject) }}
                        />
                        <div
                            className="absolute bottom-0 left-0 w-64 h-64 rounded-full blur-[80px] opacity-5"
                            style={{ backgroundColor: getSubjectColor(subject) }}
                        />

                        <div className="relative z-10 p-8 max-md:p-5">
                            <div className="flex items-start gap-6 max-md:flex-col">
                                <div
                                    className="size-24 flex items-center justify-center rounded-3xl shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl max-md:size-20 ring-4 ring-white/50"
                                    style={{ backgroundColor: getSubjectColor(subject) }}
                                >
                                    <Image
                                        src={`/icons/${subject}.svg`}
                                        alt={subject}
                                        width={48}
                                        height={48}
                                        className="max-md:w-10 max-md:h-10 drop-shadow-sm"
                                    />
                                </div>

                                <div className="flex flex-col gap-4 flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-4 flex-wrap">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <h1 className="text-4xl font-bold text-gray-900 max-md:text-2xl tracking-tight">
                                                    {name}
                                                </h1>
                                                <Badge
                                                    className="capitalize text-sm font-semibold px-4 py-1.5 shadow-sm"
                                                    style={{
                                                        backgroundColor: getSubjectColor(subject),
                                                        color: 'black'
                                                    }}
                                                >
                                                    {subject}
                                                </Badge>
                                            </div>
                                        </div>

                                        <div className="hidden md:flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-2xl px-5 py-3 border border-gray-200 shadow-md">
                                            <Clock className="h-5 w-5 text-gray-700" />
                                            <div className="text-center">
                                                <span className="text-2xl font-bold text-gray-900">{duration}</span>
                                                <span className="text-sm text-gray-500 font-medium ml-1">min</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3 p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-200/50">
                                        <BookOpen className="h-5 w-5 text-gray-600 mt-0.5 flex-shrink-0" />
                                        <p className="text-base text-gray-700 leading-relaxed">
                                            {topic}
                                        </p>
                                    </div>

                                    <div className="flex md:hidden items-center gap-2 text-gray-600 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200/50 w-fit">
                                        <Clock className="h-5 w-5" />
                                        <span className="text-sm font-medium">
                                            {duration} minutes
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </article>

                    <CompanionComponents
                        {...companionRes.data}
                        companionId={id}
                        userName={user.firstName!}
                        userImage={user.imageUrl!}
                    />
                </div>

                <div className="lg:col-span-1">
                    <div className="sticky top-6 space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                            <StickyNote className="h-6 w-6 text-gray-700" />
                            <h2 className="text-2xl font-bold text-gray-900">Notes</h2>
                        </div>
                        <NotesSection initialNotes={notes} companionId={id} path={`/companions/${id}`} />
                    </div>
                </div>
            </div>
        </main>
    );
};

export default CompanionSession;
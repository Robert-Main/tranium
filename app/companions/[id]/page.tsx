import CompanionComponents from "@/components/companion-components";
import { getCompanionById } from "@/lib/actions/companion.action";
import { getSubjectColor } from "@/lib/utils";
import { currentUser } from "@clerk/nextjs/server";
import Image from "next/image";
import { redirect } from "next/navigation";
import React from "react";
import { Clock, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CompanionSessionProps {
    params: Promise<{ id: string }>;
}

const CompanionSession = async ({ params }: CompanionSessionProps) => {
    const { id } = await params;
    const companionRes = await getCompanionById(id);
    const user = await currentUser();

    if (!user) redirect("/sign-in");
    if (!companionRes || !companionRes.success || !companionRes.data) redirect("/companions");

    const { subject, name, duration, topic, voice, style } = companionRes.data;

    return (
        <main className="max-w-[1400px]">
            {/* Enhanced Header Card */}
            <article className="relative overflow-hidden rounded-3xl border-2 border-gray-200 bg-gradient-to-br from-white to-gray-50 shadow-lg">
                {/* Decorative Background Pattern */}
                <div
                    className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-20"
                    style={{ backgroundColor: getSubjectColor(subject) }}
                />

                <div className="relative z-10 p-8 max-md:p-6">
                    <div className="flex justify-between items-start gap-6 max-md:flex-col">
                        {/* Left Section - Companion Info */}
                        <div className="flex items-start gap-6 flex-1">
                            {/* Subject Icon */}
                            <div
                                className="size-20 flex items-center justify-center rounded-2xl shadow-md transition-transform hover:scale-105 max-md:size-16"
                                style={{ backgroundColor: getSubjectColor(subject) }}
                            >
                                <Image
                                    src={`/icons/${subject}.svg`}
                                    alt={subject}
                                    width={40}
                                    height={40}
                                    className="max-md:w-8 max-md:h-8"
                                />
                            </div>

                            {/* Companion Details */}
                            <div className="flex flex-col gap-3 flex-1">
                                <div className="flex items-center gap-3 flex-wrap">
                                    <h1 className="text-3xl font-bold text-gray-900 max-md:text-2xl">
                                        {name}
                                    </h1>
                                    <Badge
                                        className="capitalize text-sm font-medium px-3 py-1"
                                        style={{
                                            backgroundColor: getSubjectColor(subject),
                                            color: 'white'
                                        }}
                                    >
                                        {subject}
                                    </Badge>
                                </div>

                                <div className="flex items-start gap-2">
                                    <BookOpen className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
                                    <p className="text-base text-gray-700 leading-relaxed">
                                        {topic}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 text-gray-600">
                                    <Clock className="h-5 w-5" />
                                    <span className="text-sm font-medium">
                                        Estimated duration: {duration} minutes
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Right Section - Duration Badge (Desktop) */}
                        <div className="hidden md:flex flex-col items-center gap-2 bg-white rounded-2xl px-6 py-4 border-2 border-gray-200 shadow-sm min-w-[120px]">
                            <Clock className="h-8 w-8 text-primary" />
                            <div className="text-center">
                                <p className="text-3xl font-bold text-gray-900">{duration}</p>
                                <p className="text-sm text-gray-500 font-medium">minutes</p>
                            </div>
                        </div>
                    </div>
                </div>
            </article>

            {/* Companion Components */}
            <CompanionComponents
                {...companionRes.data}
                companionId={id}
                userName={user.firstName!}
                userImage={user.imageUrl!}
            />
        </main>
    );
};

export default CompanionSession;
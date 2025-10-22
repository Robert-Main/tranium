import { getCompanionById } from "@/lib/actions/companion.action";
import { getSubjectColor } from "@/lib/utils";
import { currentUser } from "@clerk/nextjs/server";
import Image from "next/image";
import { redirect } from "next/navigation";
import React from "react";

interface ComapnionSessionProps {
    params: Promise<{ id: string }>;
}
const CompanionSession = async ({ params }: ComapnionSessionProps) => {
    const { id } = await params;
    const companionRes = await getCompanionById(id);
    const user = await currentUser();

    if (!user) redirect("/sign-in");
    if (!companionRes || !companionRes.success || !companionRes.data) redirect("/companions");

    const { subject, name, duration, topic, voice, style } = companionRes.data;

    return (
        <main>
            <article className="flex rounded-border justify-between p-6 max-md:flex-col">
                <div className="flex items-center gap-2">
                    <div
                        className="size-[72px] flex items-cente justify-center rounded-lg max-md:hidden"
                        style={{ backgroundColor: getSubjectColor(subject) }}
                    >
                        <Image
                            src={`/icons/${subject}.svg`}
                            alt={subject}
                            width={35}
                            height={35}
                            className="rounded-full"
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <p className="text-2xl font-bold ">{name}</p>
                            <div className="subject-badge max-sm:hidden">{subject}</div>
                        </div>
                        <p className="text-lg">{topic}</p>
                    </div>
                </div>
                <div className="items-start text-xl max-md:hidden">{duration} mins</div>
            </article>
        </main>
    );
};

export default CompanionSession;

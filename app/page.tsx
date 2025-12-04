import React from "react";
import CompanionCard from "@/components/companion-card";
import CompanionsList from "@/components/companions-list";
import CTA from "@/components/CTA";
import { getAllCompanions, getSessionHistories } from "@/lib/actions/companion.action";
import { getSubjectColor } from "@/lib/utils";
import { currentUser } from "@clerk/nextjs/server";

const Page = async () => {
        const user = await currentUser();

    const companionsData = await getAllCompanions({ limit: 5, page: 1 });
    const companions = companionsData;
    const recentSessionsData = await getSessionHistories(10);
    const sessionHistory = Array.from(
        new Map(
            recentSessionsData
                .flatMap((item: any) => item.companions)
                .map((companion: any) => [companion.id, companion])
        ).values()
    );

    // const recentSessions = recentSessionsData.map((item: any) => item.companions);

    return (
        <main >
            <h1 className="text-xl ">Popular Companions</h1>
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 ">
                {companions?.data?.slice(0, 4).map((companion: Companion) => (
                    <CompanionCard {...companion} key={companion.id} color={getSubjectColor(companion.subject)} />
                ))}
            </section>

            <section className="home-section">
                <CompanionsList
                    title="Recent Companions"
                    companions={sessionHistory}
                    isSessionHistory={true}
                    className="w-2/3 max-lg:w-full"
                />
                <CTA />
            </section>
        </main>
    );
};

export default Page;

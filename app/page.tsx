import React from "react";
import CompanionCard from "@/components/companion-card";
import CompanionsList from "@/components/companions-list";
import CTA from "@/components/CTA";
import { recentSessions } from "@/constants";
import { getAllCompanions, getSessionHistories } from "@/lib/actions/companion.action";
import { getSubjectColor } from "@/lib/utils";

const Page = async() => {

    const companionsData = await getAllCompanions({ limit: 5, page: 1 });
    const companions = companionsData;
    const recentSessionsData = await getSessionHistories(10);

    // Transform the data to extract companions from nested structure
    const recentSessions = recentSessionsData.map((item: any) => item.companions);
    return (
        <main>
            <h1 className="text-2xl ">Popular Companions</h1>
            <section className="home-section">
                {
                    companions.data?.map((companion: Companion) => (
                        <CompanionCard
                            {...companion}
                            key={companion.id}
                            color={getSubjectColor(companion.subject)}
                        />
                    ))
                }
            </section>

            <section className="home-section">
          <CompanionsList
            title="Recent Companions"
            companions={recentSessions}
            className="w-2/3 max-lg:w-full"
          />
                <CTA />
            </section>
        </main>
    );
};

export default Page;

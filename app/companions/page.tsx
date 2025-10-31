import { getAllCompanions } from "@/lib/actions/companion.action";
import React from "react";
import CompanionCard from "@/components/companion-card";
import { getSubjectColor } from "@/lib/utils";
import SearchIput from "@/components/search-input";
import SubjectFilters from "@/components/subject-filters";
import { unstable_noStore as noStore } from "next/cache";

const CompanionsLibrary = async ({ searchParams }: SearchParams) => {
    noStore(); // Prevent caching

    const filters = await searchParams;
    const subject = filters.subject ? filters.subject : "";
    const topic = filters.topic ? filters.topic : "";

    const result = await getAllCompanions({ subject, topic });
    const companions = result?.success ? result.data : [];

    return (
        <main className="">
            <section className="flex items-center justify-between flex-row gap-4 max-sm:flex-col ">
                <h1 className="flex-1">Companion Library</h1>
                <div className="flex gap-4 flex-row max-sm:flex-col w-full flex-1/3">
                    <SearchIput />
                    <SubjectFilters />
                </div>
            </section>
            <section className="companions-grid">
                {companions && companions.length > 0 ? (
                    companions.map((companion: any) => (
                        <CompanionCard
                            key={companion.id}
                            id={companion.id}
                            name={companion.name}
                            topic={companion.topic}
                            subject={companion.subject}
                            duration={companion.duration}
                            bookmarked={companion.bookmarked ?? false}
                            color={getSubjectColor(companion.subject)}
                        />
                    ))
                ) : (
                    <p>No companions found.</p>
                )}
            </section>
        </main>
    );
};

export default CompanionsLibrary;
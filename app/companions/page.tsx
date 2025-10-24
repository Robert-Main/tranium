import { getAllCompanions } from "@/lib/actions/companion.action";
import React from "react";
import CompanionCard from "@/components/companion-card";
import { getSubjectColor } from "@/lib/utils";
import SearchIput from "@/components/search-input";
import SubjectFilters from "@/components/subject-filters";

const CompanionsLibrary = async ({ searchParams }: SearchParams) => {
    const filters = await searchParams;
    const subject = filters.subject ? filters.subject : "";
    const topic = filters.topic ? filters.topic : "";

    const result = await getAllCompanions({ subject, topic });
    const companions = Array.isArray(result) ? result : result?.data ?? [];

    return (
        <main>
            <section className="flex items-center justify-between gap-4 max-sm:flex-col">
                <h1>Companion Library</h1>
          <div className="flex gap-4 flex-row max-sm:flex-col w-full">
            <SearchIput />
            <SubjectFilters />
                </div>
            </section>
            <section className="companions-grid">
                {companions && companions.length > 0 ? (
                    companions.map((companion: any) => <CompanionCard key={companion.id} {...companion} color={getSubjectColor(companion.subject)} />)
                ) : (
                    <p>No companions found.</p>
                )}
            </section>
        </main>
    );
};

export default CompanionsLibrary;

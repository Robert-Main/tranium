import { getAllCompanions } from "@/lib/actions/companion.action";
import React from "react";
import CompanionCard from "@/components/companion-card";
import { getSubjectColor } from "@/lib/utils";
import SearchIput from "@/components/search-input";
import SubjectFilters from "@/components/subject-filters";
import { unstable_noStore as noStore } from "next/cache";
import Link from "next/link";
import { Plus } from "lucide-react";

const CompanionsLibrary = async ({ searchParams }: SearchParams) => {
    noStore(); // Prevent caching

    const filters = await searchParams;
    const subject = filters.subject ? filters.subject : "";
    const topic = filters.topic ? filters.topic : "";

    const result = await getAllCompanions({ subject, topic });
    const companions = result?.success ? result.data : [];

    return (
        <main className="p-4 max-w-8xl mx-auto">
            <section >
                 <div className="flex items-center justify-between mb-6 gap-4">
                    <h1 className="text-xl sm:text-3xl font-bold">Companions Library</h1>
                    <Link
                        href="/companions/new"
                        className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg transition-colors whitespace-nowrap font-medium shadow-sm text-sm sm:text-base"
                    >
                        <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span className="hidden xs:inline">Add Companion</span>
                        <span className="xs:hidden">Add</span>
                    </Link>
                </div>
                <div className="flex gap-4 md:justify-between flex-col sm:flex-row sm:items-center">
                    <div className="flex-1 max-w-md">
                        <SearchIput />
                    </div>
                    <SubjectFilters />
                </div>
            </section>
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
                            author={companion.author}
                        />
                    ))
                ) : (
                    <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <Plus className="w-10 h-10 text-gray-400" />
                        </div>
                        <p className="text-gray-600 text-lg mb-2">No companions found</p>
                        <p className="text-gray-400 text-sm">Try adjusting your filters or create a new companion</p>
                    </div>
                )}
            </section>
        </main>
    );
};

export default CompanionsLibrary;
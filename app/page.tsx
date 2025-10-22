import React from "react";
import CompanionCard from "@/components/companion-card";
import CompanionsList from "@/components/companions-list";
import CTA from "@/components/CTA";
import { recentSessions } from "@/constants";

const Page = () => {
    return (
        <main>
            <h1 className="text-2xl ">Popular Companions</h1>
            <section className="home-section">
                <CompanionCard
                    id="12"
                    name="John Doe"
                    topic="An adventurous companion who loves hiking and outdoor activities."
                    subject="Hiking"
                    duration={14}
                    color="blue"
                />
                <CompanionCard
                    id="5"
                    name="Countcy the numder wizard"
                    topic="Directives and integral."
                    subject="math"
                    duration={45}
                    color="red"
                />
                <CompanionCard
                    id="9"
                    name="Verbal and vocabulary Builder."
                    topic="Language skills improvement."
                    subject="English"
                    duration={30}
                    color="green"
                />
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

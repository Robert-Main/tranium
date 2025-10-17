import CompanionCard from "@/components/companion-card";
import CompanionsList from "@/components/companions-list";
import CTA from "@/components/CTA";
import React from "react";

const Profile = () => {
    return (
        <div>
            <h1 className="text-2xl ">Popular Companions</h1>
            <section className="home-section">
                <CompanionCard />
                <CompanionCard />
                <CompanionCard />
            </section>

            <section className="home-sections">
                <CompanionsList />
                <CTA />
            </section>
        </div>
    );
};

export default Profile;

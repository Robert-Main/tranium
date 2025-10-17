import Image from "next/image";
import React from "react";
import { Button } from "./ui/button";
import Link from "next/link";

const CTA = () => {
    return (
        <section className="cta-section">
            <div className="cta-badge">Start learing your way</div>
            <h2 className="text-3xl font-bold">Build and personaize learning companion</h2>
            <p className="cta">
                Pick an name,subject,voice & personality - and start learing through voice conversation that feel
                natural and fun
            </p>
            <Image src="/images/cta.svg" alt="cta-image" width={360} height={230} />
            <Button className="btn-primary cta-button">
                <Image src="/icons/plus.svg" alt="plus-icon" width={12} height={12} />
                <Link href="/companions/new">Create your companion</Link>
            </Button>
        </section>
    );
};

export default CTA;

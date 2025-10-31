import { CompanionForm } from "@/components/companion-form";
import { getCompanionById, newCompanionPermission } from "@/lib/actions/companion.action";
import { auth } from "@clerk/nextjs/server";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

interface ComapnionSessionProps {
    params: Promise<{ id: string }>;
}
const NewCompanionPage = async ({ params }: ComapnionSessionProps) => {
    const { id } = await params;

    const { userId } = await auth();

    if (!userId) redirect("/sign-in");

    const canCreateCompanion = await newCompanionPermission();
    const companionRes = await getCompanionById(id);


    return (
        <main className="min-lg:w-1/3 min-md:h-2/3  justify-center items-center px-4 py-8">
            {canCreateCompanion ? (
                <article className="w-full flex flex-col gap-4">
                    <h1 className="text-2xl font-bold">Companion builder</h1>
                    <CompanionForm companion={companionRes.data} />
                </article>
            ) : (
                <article className="companion-limit">
                    <Image src="/images/limit.svg" alt="companion-limit" width={360} height={230} />
                    <div className="cta-badge ">Upgrade your plan</div>
                    <h2 className="text-2xl font-bold">Companion Creation Limit Reached</h2>
                    <p className="text-sm text-muted-foreground w-fit mx-auto text-center">
                        You have reached the limit for creating companions with your current plan. Please upgrade your
                        subscription to create more companions.
                    </p>
                    <Link href="/subscription" className="btn-primary w-fit justify-center">
                        Upgrade Now
                    </Link>
                </article>
            )}
        </main>
    );
};
export default NewCompanionPage;

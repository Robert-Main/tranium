import { CompanionForm } from "@/components/companion-form";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

const NewCompanionPage = async () => {
    const { userId } = await auth();

    if (!userId) redirect("/sign-in");

    return (
        <main className="flex items-center justify-center min-h-screen p-4">
            <article className="w-full max-w-2xl flex flex-col gap-4">
                <h1 className="text-2xl font-bold">Companion builder</h1>
                <CompanionForm />
            </article>
        </main>
    );
};
export default NewCompanionPage;

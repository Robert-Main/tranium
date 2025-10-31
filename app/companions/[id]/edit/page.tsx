import { CompanionForm } from "@/components/companion-form";
import { getCompanionById } from "@/lib/actions/companion.action";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

interface ComapnionSessionProps {
    params: Promise<{ id: string }>;
}
const EditCompanionPage = async ({ params }: ComapnionSessionProps) => {
    const { id } = await params;

    const { userId } = await auth();

    if (!userId) redirect("/sign-in");

    const companionRes = await getCompanionById(id);
    return (
        <main className="min-lg:w-1/3 min-md:h-2/3  justify-center items-center px-4 py-8">
                <article className="w-full flex flex-col gap-4">
                    <h1 className="text-2xl font-bold">Edit your Companion builder</h1>
                    <CompanionForm companion={companionRes.data} />
                </article>

        </main>
    );
};
export default EditCompanionPage;

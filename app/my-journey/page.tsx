import CompanionsList from "@/components/companions-list";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { getBookmarkedCompanions, getUserCompanions, getUserSession } from "@/lib/actions/companion.action";
import { currentUser } from "@clerk/nextjs/server";
import Image from "next/image";
import { redirect } from "next/navigation";
import React from "react";

const Profile = async () => {
    const user = await currentUser();
    if (!user) redirect("/sign-in");

    const companions = await getUserCompanions(user.id);
    const sessionHistoryData = await getUserSession(user.id);
    const sessionHistory = sessionHistoryData.map((item: any) => item.companions);
    const bookmarkedCompanions = await getBookmarkedCompanions(user.id);

    console.log(bookmarkedCompanions);

    return (
        <main className="min-lg:w-2/3">
            <section className="flex justify-between gap-4 max-sm:flex-col items-center">
                <div className="flex gap-4 items-center">
                    <Image src={user.imageUrl} alt="user-image" width={110} height={110} className="rounded-xl" />
                    <div className="flex flex-col gap-2">
                        <h1 className="text-xl font-semibold mt-4">{user.firstName}</h1>
                        <p className="text-sm text-muted-foreground">{user.emailAddresses[0]?.emailAddress}</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="border border-black rounded-lg p-3 gap-2 flex flex-col h-fit">
                        <div className="flex gap-2 items-center">
                            <Image src="/icons/check.svg" alt="checkmark" width={22} height={22} />
                            <p className="font-medium text-2xl">{sessionHistory?.length}</p>
                        </div>
                        <div className="">Lesson Completed</div>
                    </div>
                    <div className="border border-black rounded-lg p-3 gap-2 flex flex-col h-fit">
                        <div className="flex gap-2 items-center">
                            <Image src="/icons/cap.svg" alt="checkmark" width={22} height={22} />
                            <p className="font-medium text-2xl">{companions?.length}</p>
                        </div>
                        <div className="">Companion Created</div>
                    </div>
                    <div className="border border-black rounded-lg p-3 gap-2 flex flex-col h-fit">
                        <div className="flex gap-2 items-center">
                            <Image src="/icons/bookmark.svg" alt="bookmark" width={22} height={22} className="text-primary"/>
                            <p className="font-medium text-2xl">{bookmarkedCompanions?.length}</p>
                        </div>
                        <div className="">Bookmarked Companions</div>
                    </div>
                </div>
            </section>
            <Accordion type="multiple" className="w-full" defaultValue={["item-1"]}>
                <AccordionItem value="bookmarks">
                    <AccordionTrigger className="text-xl font-semibold">
                        Bookmarked Companions {bookmarkedCompanions?.length}
                    </AccordionTrigger>
                    <AccordionContent className="flex flex-col gap-4 text-balance">
                        {<CompanionsList title="My Companions" companions={bookmarkedCompanions} />}
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="Companions">
                    <AccordionTrigger className="text-xl font-semibold">
                        My Companion {companions?.length}
                    </AccordionTrigger>
                    <AccordionContent className="flex flex-col gap-4 text-balance">
                        {<CompanionsList title="My Companions" companions={companions} />}
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="recent">
                    <AccordionTrigger className="text-xl font-semibold">Recent Sessions</AccordionTrigger>
                    <AccordionContent className="flex flex-col gap-4 text-balance">
                        {<CompanionsList title="Recent Sessions" companions={sessionHistory} className="w-full" />}
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </main>
    );
};

export default Profile;

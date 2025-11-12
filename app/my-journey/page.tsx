import CompanionCard from "@/components/companion-card";
import { getBookmarkedCompanions, getUserCompanions, getUserSession } from "@/lib/actions/companion.action";
import { currentUser } from "@clerk/nextjs/server";
import Image from "next/image";
import { redirect } from "next/navigation";
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getSubjectColor } from "@/lib/utils";

const Profile = async () => {
    const user = await currentUser();
    if (!user) redirect("/sign-in");

    const companions = await getUserCompanions(user.id);
    const sessionHistoryData = await getUserSession(user.id);
    const sessionHistory = Array.from(
        new Map(
            sessionHistoryData
                .flatMap((item: any) => item.companions)
                .map((companion: any) => [companion.id, companion])
        ).values()
    );

    const bookmarkedCompanions = await getBookmarkedCompanions(user.id);

    return (
        <main className="flex flex-col mx-auto px-4 py-4">
            <section className="flex justify-between gap-6 max-lg:flex-col items-start lg:items-center ">
                <div className="hidden sm:flex gap-6 items-center">
                    <Image
                        src={user.imageUrl}
                        alt="user-image"
                        width={100}
                        height={100}
                        className="rounded-2xl border-4 border-white sm:w-[80px] sm:h-[80px] shadow-lg"
                    />
                    <div className="flex flex-col gap-2">
                        <h1 className="text-3xl font-bold">
                            {user.firstName} {user.lastName}
                        </h1>
                        <p className="text-sm text-muted-foreground">{user.emailAddresses[0]?.emailAddress}</p>
                    </div>
                </div>

                <div className="flex gap-4 max-sm:flex-col max-sm:w-full">
                    <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-5 flex flex-col gap-3 min-w-[160px]">
                        <div className="flex gap-3 items-center">
                            <div className="bg-green-500 rounded-full p-2">
                                <Image src="/icons/check.svg" alt="checkmark" width={20} height={20} />
                            </div>
                            <p className="font-bold text-3xl text-green-700">{sessionHistory?.length}</p>
                        </div>
                        <p className="text-sm font-medium text-green-700">Lessons Completed</p>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-5 flex flex-col gap-3 min-w-[160px]">
                        <div className="flex gap-3 items-center">
                            <div className="bg-blue-500 rounded-full p-2">
                                <Image src="/icons/cap.svg" alt="cap" width={20} height={20} />
                            </div>
                            <p className="font-bold text-3xl text-blue-700">{companions?.length}</p>
                        </div>
                        <p className="text-sm font-medium text-blue-700">Companions Created</p>
                    </div>
                </div>
            </section>

            <Tabs defaultValue="companions" className="">
                <TabsList className="grid  grid-cols-3 h-10 cursor-pointer ">
                    <TabsTrigger value="companions" className="text-base cursor-pointer">
                        Companions ({companions?.length || 0})
                    </TabsTrigger>
                    <TabsTrigger value="bookmarks" className="text-base cursor-pointer">
                        Bookmarks ({bookmarkedCompanions?.length || 0})
                    </TabsTrigger>
                    <TabsTrigger value="sessions" className="text-base cursor-pointer">
                        Sessions ({sessionHistory?.length || 0})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="companions" className="mt-6">
                    {companions && companions.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {companions.map((companion) => (
                                <CompanionCard
                                    key={companion.id}
                                    id={companion.id}
                                    name={companion.name}
                                    topic={companion.topic}
                                    subject={companion.subject}
                                    duration={companion.duration}
                                    color={getSubjectColor(companion.subject)}
                                    bookmarked={companion.bookmarked || false}
                                    author={companion.author}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 text-muted-foreground">
                            <p className="text-lg">No companions created yet</p>
                            <p className="text-sm mt-2">Start by creating your first companion!</p>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="bookmarks" className="mt-6">
                    {bookmarkedCompanions && bookmarkedCompanions.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {bookmarkedCompanions.map((companion, index) => (
                                <CompanionCard
                                    key={companion.id || index}
                                    id={companion.id}
                                    name={companion.name}
                                    topic={companion.topic}
                                    subject={companion.subject}
                                    duration={companion.duration}
                                    color={getSubjectColor(companion.subject)}
                                    bookmarked={companion.bookmarked || false}
                                    author={companion.author}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 text-muted-foreground">
                            <p className="text-lg">No bookmarked companions</p>
                            <p className="text-sm mt-2">Bookmark companions to find them easily!</p>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="sessions" className="mt-6">
                    {sessionHistory && sessionHistory.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {sessionHistory.map((companion, index) => (
                                <CompanionCard
                                    key={index}
                                    id={companion.id}
                                    name={companion.name}
                                    topic={companion.topic}
                                    subject={companion.subject}
                                    duration={companion.duration}
                                    color={getSubjectColor(companion.subject)}
                                    bookmarked={companion.bookmarked || false}
                                    author={companion.author}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 text-muted-foreground">
                            <p className="text-lg">No session history</p>
                            <p className="text-sm mt-2">Complete lessons to see your history!</p>
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </main>
    );
};

export default Profile;

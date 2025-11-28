"use client";

import { formUrlQuery, removeKeysFromUrlQuery } from "@jsmastery/utils";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";

const SearchIput = () => {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const delayedQueryUpdate = setTimeout(() => {
            if (searchQuery) {
                const newUrl = formUrlQuery({
                    params: searchParams.toString(),
                    key: "topic",
                    value: searchQuery,
                });

                router.push(newUrl, { scroll: false });
            } else {
                if (pathname === "/companions") {
                    const newUrl = removeKeysFromUrlQuery({
                        params: searchParams.toString(),
                        keysToRemove: ["topic"],
                    });
                    router.push(newUrl, { scroll: false });
                }
            }
        }, 500);

        return () => clearTimeout(delayedQueryUpdate);
    }, [searchQuery, router, pathname, searchParams]);

    return (
        <div className="relative border border-black rounded-lg items-center flex gap-2 px-2 py-1 h-fit">
            <Image src="/icons/search.svg" alt="search-icon" width={15} height={15} />
            <input
                type="text"
                placeholder="Search by topic"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="outline-none placeholder:text-black2/50 w-full max-w-[450px]"
            />
        </div>
    );
};

export default SearchIput;

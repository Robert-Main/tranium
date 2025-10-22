"use client";

import React from "react";
import { subjects } from "@/constants";
import { getSubjectColor } from "@/lib/utils";
import { formUrlQuery, removeKeysFromUrlQuery } from "@jsmastery/utils";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const SubjectFilters = () => {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentSubject = (searchParams.get("subject") || "").toString();

  const setSubject = (subject: string) => {
    if (subject && subject === currentSubject) {
      const newUrl = removeKeysFromUrlQuery({
        params: searchParams.toString(),
        keysToRemove: ["subject"],
      });
      router.push(newUrl, { scroll: false });
      return;
    }

    if (!subject) {
      const newUrl = removeKeysFromUrlQuery({
        params: searchParams.toString(),
        keysToRemove: ["subject"],
      });
      router.push(newUrl, { scroll: false });
      return;
    }

    const newUrl = formUrlQuery({
      params: searchParams.toString(),
      key: "subject",
      value: subject,
    });
    router.push(newUrl, { scroll: false });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => setSubject("")}
        className={`px-3 py-1 rounded-full border text-sm whitespace-nowrap flex flex-wrap ${
          currentSubject === "" ? "bg-black text-white" : "bg-white"
        }`}
      >
        All
      </button>
      {subjects.map((s) => {
        const active = currentSubject === s;
        const color = getSubjectColor(s);
        return (
          <button
            key={s}
            type="button"
            onClick={() => setSubject(s)}
            className={`px-3 py-1 rounded-full border text-sm capitalize whitespace-nowrap transition-colors ${
              active ? "text-black" : "text-gray-800"
            }`}
            style={{
              backgroundColor: active ? color : undefined,
              borderColor: color,
            }}
            aria-pressed={active}
          >
            {s}
          </button>
        );
      })}
    </div>
  );
};

export default SubjectFilters;
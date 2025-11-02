"use client";

import { ArrowLeft } from "lucide-react";

export const BackButton = () => {
  const handleRedirect = () => {
    window.history.back();
  };

  return (
    <p className="flex items-center gap-2 cursor-pointer" onClick={handleRedirect}>
      <ArrowLeft className="w-6 h-6" /> back
    </p>
  );
};

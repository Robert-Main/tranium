"use client";

import { useEffect } from "react";
import { toast } from "sonner";


const NetworkErrorToast = () => {
  useEffect(() => {
    const handleOffline = () => {
      toast.error("You are offline. Connect to the internet and try again.");
    };
    const handleOnline = () => {
      toast.success("Back online 👌");
    };

    if (typeof window !== "undefined" && typeof navigator !== "undefined") {
      if (!navigator.onLine) {
        handleOffline();
      }
      window.addEventListener("offline", handleOffline);
      window.addEventListener("online", handleOnline);
    }

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  return null;
};

export default NetworkErrorToast;

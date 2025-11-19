"use client";

import { useEffect } from "react";
import { toast } from "sonner";

// Headless listener component that shows a toast when network goes offline/online
// Mount this once globally (e.g., in app/layout.tsx)
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

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export function useRazorpay({ timeoutMs = 15000 } = {}) {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // If already loaded
    if ((window as any).Razorpay) {
      setIsReady(true);
      return;
    }

    let timeoutId: NodeJS.Timeout;

    const checkRazorpay = () => {
      if ((window as any).Razorpay) {
        clearTimeout(timeoutId);
        setIsReady(true);
      }
    };

    // Poll until available
    const intervalId = setInterval(checkRazorpay, 100);

    // Timeout guard
    timeoutId = setTimeout(() => {
      clearInterval(intervalId);
      const err = new Error(`Razorpay SDK not available after ${timeoutMs}ms.`);
      setError(err);
      toast.error("Could not initialize payment gateway. Please refresh the page.");
    }, timeoutMs);

    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, [timeoutMs]);

  return { isReady, error };
}

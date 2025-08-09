import { useEffect, useState } from "react";
import toast from "react-hot-toast";

const RAZORPAY_SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";
const RAZORPAY_SCRIPT_ID = "razorpay-checkout-script";

let razorpayLoadPromise: Promise<void> | null = null;

export function useRazorpay({ timeoutMs = 15000 } = {}) {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // SSR guard
    if (typeof window === "undefined") return;

    // If already present
    if ((window as any).Razorpay) {
      setIsReady(true);
      return;
    }

    // Create the global promise only once per session
    if (!razorpayLoadPromise) {
      razorpayLoadPromise = new Promise<void>((resolve, reject) => {
        // Helper to wire listeners to a script element
        const attachListeners = (scriptEl: HTMLScriptElement) => {
          // If the script already fired load and set a flag, resolve
          if ((window as any).Razorpay) {
            resolve();
            return;
          }

          // Use load / error events
          const onLoad = () => {
            // mark and resolve
            try {
              scriptEl.setAttribute("data-razorpay-loaded", "true");
            } catch {}
            resolve();
          };
          const onError = (ev?: any) => {
            reject(new Error("Failed to load Razorpay SDK (script error)."));
          };

          scriptEl.addEventListener("load", onLoad, { once: true });
          scriptEl.addEventListener("error", onError, { once: true });
        };

        const existing = document.getElementById(RAZORPAY_SCRIPT_ID) as HTMLScriptElement | null;

        if (existing) {
          // If already executed and window.Razorpay exists, great
          if ((window as any).Razorpay) {
            resolve();
            return;
          }

          // If the existing script has a "data-razorpay-loaded" flag, resolve
          if (existing.getAttribute("data-razorpay-loaded") === "true") {
            resolve();
            return;
          }

          // Otherwise attach listeners to the existing element
          attachListeners(existing);
        } else {
          // Create and append the script
          const script = document.createElement("script");
          script.id = RAZORPAY_SCRIPT_ID;
          script.src = RAZORPAY_SCRIPT_URL;
          script.async = true;

          // attach listeners to the new script
          script.onload = () => {
            try {
              script.setAttribute("data-razorpay-loaded", "true");
            } catch {}
            resolve();
          };
          script.onerror = () => reject(new Error("Failed to load Razorpay SDK (script error)."));

          document.body.appendChild(script);
        }

        // Timeout guard (optional)
        if (timeoutMs && timeoutMs > 0) {
          setTimeout(() => {
            reject(new Error(`Razorpay SDK load timeout after ${timeoutMs}ms.`));
          }, timeoutMs);
        }
      }).catch((err) => {
        // make sure to reset global promise on failure so a retry is possible
        razorpayLoadPromise = null;
        throw err;
      });
    }

    // Attach to promise
    razorpayLoadPromise
      .then(() => {
        if ((window as any).Razorpay) {
          setIsReady(true);
        } else {
          // Very rare: script loaded but didn't expose the global
          const err = new Error("Razorpay script loaded but window.Razorpay is not defined.");
          console.error(err);
          setError(err);
          toast.error("Could not initialize payment gateway.");
        }
      })
      .catch((err) => {
        console.error("Razorpay load error:", err);
        setError(err);
        toast.error("Could not initialize payment gateway. Please refresh the page.");
        // allow retry on next mount
        razorpayLoadPromise = null;
      });

    // No cleanup: leave script in DOM for session lifetime.
  }, [timeoutMs]);

  return { isReady, error };
}

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const RAZORPAY_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';
const RAZORPAY_SCRIPT_ID = 'razorpay-checkout-script';

// --- A global promise to ensure we only try to load the script once per session ---
let razorpayLoadPromise: Promise<void> | null = null;

/**
 * A robust custom hook to manage the loading and readiness of the Razorpay SDK.
 * This hook handles script injection idempotently and provides a clean state.
 *
 * @returns `isReady` - A boolean that is true only when window.Razorpay is available.
 */
export function useRazorpay() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // If Razorpay is already available on the window object, we're ready.
    if (window.Razorpay) {
      setIsReady(true);
      return;
    }

    // --- This is the core of the idempotent loading logic ---
    if (!razorpayLoadPromise) {
      razorpayLoadPromise = new Promise((resolve, reject) => {
        // Check again in case it was loaded between component renders
        if (document.getElementById(RAZORPAY_SCRIPT_ID)) {
          resolve();
          return;
        }

        const script = document.createElement('script');
        script.id = RAZORPAY_SCRIPT_ID;
        script.src = RAZORPAY_SCRIPT_URL;
        script.async = true;

        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Razorpay SDK.'));
        
        document.body.appendChild(script);
      });
    }

    // Attach to the global promise
    razorpayLoadPromise
      .then(() => {
        // Double-check window.Razorpay exists before setting state
        if (window.Razorpay) {
          setIsReady(true);
        } else {
            // This is a very rare edge case
            console.error('Razorpay script loaded, but window.Razorpay is not defined.');
            toast.error('Could not initialize payment gateway.');
        }
      })
      .catch((error) => {
        console.error(error);
        toast.error('Could not initialize payment gateway. Please refresh the page.');
        // Reset the promise on failure to allow a retry on next mount
        razorpayLoadPromise = null; 
      });

    // The cleanup function for this effect is now empty.
    // We intentionally leave the script in the DOM for the entire session.
    return () => {};

  }, []); // Empty dependency array ensures this effect runs once per component mount.

  return { isReady };
}
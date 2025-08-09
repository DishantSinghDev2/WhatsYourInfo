import { useState, useEffect } from 'react';
import Script from 'next/script';
import toast from 'react-hot-toast';

// The URL for the Razorpay checkout script
const RAZORPAY_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';

/**
 * A custom hook to manage the loading and readiness of the Razorpay SDK.
 * This hook handles script injection and provides a clean state to the component.
 *
 * @returns `isReady` - A boolean that is true only when window.Razorpay is available.
 */
export function useRazorpay() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // If Razorpay is already on the window object (e.g., from a previous navigation),
    // we don't need to do anything else.
    if (window.Razorpay) {
      setIsReady(true);
      return;
    }

    // Check if the script tag already exists in the document.
    // This prevents re-injecting the script on component re-renders.
    const existingScript = document.getElementById('razorpay-checkout-script');
    if (existingScript) {
      // If it exists, add an event listener to wait for it to load.
      const handleLoad = () => setIsReady(true);
      existingScript.addEventListener('load', handleLoad);

      // Cleanup the event listener when the component unmounts.
      return () => {
        existingScript.removeEventListener('load', handleLoad);
      };
    }

    // If no script exists, create it.
    const script = document.createElement('script');
    script.id = 'razorpay-checkout-script';
    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;

    // Define the onLoad and onError handlers.
    script.onload = () => {
      console.log('Razorpay SDK loaded successfully.');
      setIsReady(true);
    };

    script.onerror = () => {
      console.error('Failed to load the Razorpay SDK.');
      toast.error('Could not initialize payment gateway. Please refresh the page.');
      setIsReady(false);
    };
    
    // Append the script to the document body to start loading it.
    document.body.appendChild(script);

    // Cleanup function to remove the script if the component unmounts before it loads.
    return () => {
      const scriptElement = document.getElementById('razorpay-checkout-script');
      if (scriptElement) {
        document.body.removeChild(scriptElement);
      }
    };
  }, []); // The empty dependency array ensures this effect runs only once on mount.

  return { isReady };
}
import React, { useState, useEffect } from 'react';
import '@src/Popup.css';
import { useStorage, withErrorBoundary, withSuspense } from '@extension/shared';
import { exampleThemeStorage } from '@extension/storage';
import { Coupon } from '@extension/shared';
import { CouponCard } from './components/CouponCard';
import { ToggleButton } from './components/ToggleButton';
import { getCurrentTab, getDomain } from './utils';
import { APIClient, autoApplyProductURLs } from '@extension/shared';



const Popup = () => {
  const theme = useStorage(exampleThemeStorage);
  const isLight = theme === 'light';
  const toggleTheme = () => {
    exampleThemeStorage.set(isLight ? 'dark' : 'light');
  };

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [merchantName, setMerchantName] = useState<string>('Available Coupons');
  const [merchantUrl, setMerchantUrl] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false); // To show loading state on button
  const [applyStatus, setApplyStatus] = useState<string | null>(null); // Feedback message
  const [currentURL, setCurrentURL] = useState<string | null>(null); // To store the current URL


  useEffect(() => {
    const fetchCoupons = async () => {
      setIsLoading(true);
      setError(null);
      setMerchantName('Loading...'); // Set initial loading title
      setMerchantUrl(null);
      try {
        const currentURL = await getCurrentTab().then(url => getDomain(url));
        setCurrentURL(await getCurrentTab());
        const validTLDs = ['.com', '.org', '.net', '.edu', '.gov', '.io', '.co', '.us', '.uk', '.ca', '.au', '.in'];
        const hasValidTLD = validTLDs.some(tld => currentURL.endsWith(tld));
        if (!hasValidTLD) {
          setError("Invalid domain. Please try a different website.");
          setMerchantName('No Coupons Found');
          setIsLoading(false);
          return;
        }

        const couponResponse: Coupon[] = await APIClient.searchCoupons(currentURL, 10);

        if (couponResponse && couponResponse.length > 0) {
          setCoupons(couponResponse);
          const firstCoupon = couponResponse[0];
          if (!currentURL.includes(firstCoupon.retailerUrl)) {
            setCoupons([]);
            setMerchantName('No Coupons Found');
            setIsLoading(false);
            return;
          }

          setMerchantName(
            (firstCoupon.retailerName?.charAt(0).toUpperCase() + firstCoupon.retailerName?.slice(1).replace(' Coupons', '') + ' Coupons') || 'Available Coupons'
          );

          setMerchantUrl(firstCoupon.retailerUrl || null);

        } else {
          setCoupons([]);
          setMerchantName('No Coupons Found');
        }
      } catch (err: any) {
        console.error("Error fetching coupons:", err);
        // setError(`${err.message || ''}`.trim());
        setMerchantName('Error Loading Coupons');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCoupons();
    
  }, []);

  const goToMerchantSite = () => {
    if (merchantUrl) {
      let url = merchantUrl;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = `https://${url}`;
      }
      chrome.tabs.create({ url: url });
    }
  };

  const handleAutoApply = async () => {
    if (!coupons || coupons.length === 0) return;

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab?.id || !tab.url) {
      console.error("No active tab with URL found for auto-apply.");
      setApplyStatus("Error: Could not find active tab URL.");
      return;
    }

    let domain: string;
    try {
      domain = getDomain(tab.url);
    } catch (e) {
      console.error("Invalid tab URL:", tab.url, e);
      setApplyStatus("Error: Invalid page URL.");
      return;
    }

    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['/content-runtime/index.iife.js'],
      });
      console.log("Content script injected or already present.");

      // Send the coupons to the (now hopefully) active content script
      setIsApplying(true);
      setApplyStatus("Attempting to apply codes...");
      chrome.tabs.sendMessage(
        tab.id,
        {
          type: "AUTO_APPLY_COUPONS",
          payload: {
            codes: coupons.map(c => c.code), // Send only the codes
            domain: domain,
          }
        },
        (response) => { // Callback to handle response from content script
          setIsApplying(false);
          if (chrome.runtime.lastError) {
            // Handle errors like "Could not establish connection..." (content script might not be ready/listening)
            console.error("Auto-apply message error:", chrome.runtime.lastError.message);
            setApplyStatus('Something went wrong. Could not apply any codes.');
          } else if (response) {
            if (response.success) {
              setApplyStatus(`Success! Applied code: ${response.appliedCode}`);
              // Maybe refresh coupons display or indicate success visually
            } else if (response.message == "NO_CODES") {
              setApplyStatus("Tried all codes, none confirmed successful.");
            } else {
              setApplyStatus("Something went wrong. Could not apply any codes.");
            }
          } else {
            setApplyStatus("Something went wrong. Could not apply any codes.");
          }
        }
      );

    } catch (err: any) {
      console.error("Failed to inject script or send message:", err);
      setApplyStatus("Something went wrong. Could not apply any codes.");
      setIsApplying(false);
    }
  };

  const openPanel = async () => {
    chrome.runtime.sendMessage({ type: 'OPEN_SIDE_PANEL' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error sending message:', chrome.runtime.lastError.message);
      } else {
        console.log('Response from background:', response);
      }
    });
    window.close();
  }



  return (
    <div className={`App w-80 p-4 font-sans ${isLight ? 'bg-slate-50' : 'bg-background'}`}>

    <header className={`mb-4 pb-3 border-b ${isLight ? 'border-gray-200' : 'border-border'} flex items-center gap-3`}>
      <h1
        className={`text-lg font-bold truncate flex-1 ${isLight ? 'text-gray-900' : 'text-gray-100'} ${merchantUrl ? 'cursor-pointer hover:text-blue-600 dark:hover:text-blue-400' : ''}`}
        onClick={goToMerchantSite}
        title={merchantUrl ? `Visit ${merchantUrl}` : merchantName}
      >
        {merchantName}
      </h1>
      <ToggleButton isLight={isLight} toggleTheme={toggleTheme} />
    </header>


      <main className="max-h-96 overflow-y-auto pr-1 custom-scrollbar">
        {isLoading && (
          <div className={`text-center py-10 ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
            Loading coupons...
          </div>
        )}

        {error && !isLoading && (
          <div className={`text-center py-6 px-2 rounded border ${isLight ? 'bg-red-50 border-red-200 text-red-700' : 'bg-red-900/50 border-red-700/50 text-red-300'}`}>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {!isLoading && !error && coupons.length > 0 && typeof currentURL === 'string' && autoApplyProductURLs.some(url => currentURL.includes(url)) && (
          <div className="pt-4 mb-4">
            <button
              onClick={handleAutoApply}
              disabled={isApplying}
              className={`w-full px-4 py-2 text-sm font-medium rounded transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 ${isApplying
                ? `bg-gray-400 text-gray-700 cursor-wait dark:bg-gray-600 dark:text-gray-400`
                : `bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white focus:ring-emerald-500 dark:focus:ring-offset-gray-800 shadow hover:shadow-md`
                }`}
            >
              {isApplying ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Applying...
                </span>
              ) : '✨ Auto-Apply Best Code'}
            </button>
            {applyStatus && ( // Display status message below button
              <p className={`mt-2 text-xs text-center ${applyStatus.startsWith('Success!') ? (isLight ? 'text-green-700' : 'text-green-400') :
                applyStatus.startsWith('Error:') ? (isLight ? 'text-red-600' : 'text-red-400') :
                  (isLight ? 'text-gray-600' : 'text-gray-400') // Default/info color
                }`}>
                {applyStatus}
              </p>
            )}
          </div>
        )}


        {!isLoading && !error && coupons.length > 0 && (
          <>
            <div className="space-y-3">
              {coupons.map((coupon) => (
                <CouponCard key={coupon.id} coupon={coupon} isLight={isLight} />
              ))}
            </div>
          </>
        )}


        {!isLoading && !error && coupons.length === 0 && (
          <div className={`text-center py-10 ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
            No coupons found for this site right now. Check back later!
          </div>
        )}
      </main>


      <footer className={`mt-4 pt-3 border-t text-xs text-center ${isLight ? 'border-gray-200 text-gray-400' : 'border-border text-gray-500'}`}>
  <div className="grid grid-cols-2 gap-2">
    <button
      onClick={openPanel}
      title="Force open the price history panel. Might not work on all websites"
      className={`w-full px-3 py-2 text-sm font-medium rounded-lg border transition-colors duration-150 ease-in-out shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${isLight
        ? 'border-gray-300 bg-white text-gray-900 hover:bg-gray-100 focus:ring-blue-500'
        : 'border-border bg-background text-white hover:bg-primary focus:ring-blue-500 dark:focus:ring-offset-gray-800'}`}
    >
      📊 View Price History
    </button>
    <button
      onClick={handleAutoApply}
      title="Force auto apply of codes. Might not work on all websites"
      disabled={isApplying}
      className={`w-full px-3 py-2 text-sm font-medium rounded-lg border transition-colors duration-150 ease-in-out shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${isApplying
        ? 'cursor-wait border-gray-300 bg-gray-300 text-gray-600'
        : isLight
          ? 'border-gray-300 bg-white text-gray-900 hover:bg-gray-100 focus:ring-blue-500'
          : 'border-border bg-background text-white hover:bg-primary focus:ring-blue-500 dark:focus:ring-offset-gray-800'}`}
    >
      {isApplying ? 'Applying...' : '✨ Try Auto Apply'}
    </button>
  </div>
</footer>
    </div>
  );
};

export default withErrorBoundary(
  withSuspense(Popup, <div className="w-80 h-40 flex items-center justify-center text-gray-500">Loading Extension...</div>),
  <div className="w-80 p-4 text-red-600">An unexpected error occurred.</div>
);
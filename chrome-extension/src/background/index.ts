import 'webextension-polyfill';
import { exampleThemeStorage } from '@extension/storage';
import { APIClient, Coupon } from '@extension/shared';
import { getCurrentTab, getDomain } from '../../../pages/popup/src/utils';
import { send } from 'vite';

exampleThemeStorage.get().then(theme => {
  console.log('theme', theme);
});

console.log('Background loaded!');
console.log("Edit 'chrome-extension/src/background/index.ts' and save to reload.");

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  console.log('Received message in background:', message);

  switch (message.type) {
    case 'OPEN_SIDE_PANEL':
      chrome.tabs.query({ active: true, currentWindow: true, lastFocusedWindow: true }, (tabs) => {
        if (tabs.length > 0 && tabs[0].id !== undefined) {
          const tabId = tabs[0].id;
          chrome.sidePanel.setOptions({
            path: 'side-panel/index.html',
            enabled: true,
            tabId: tabId,
          });

          chrome.sidePanel.open({
            tabId: tabId
          }).then(() => {
            sendResponse({ success: true });
          }).catch(error => {
            console.error('Failed to open side panel:', error);
            sendResponse({ success: false, error: error.message });
          });
        } else {
          console.error('No active tab found or tab ID is undefined');
          sendResponse({ success: false, error: 'No active tab found or tab ID is undefined' });
        }
      });

      break;

    case 'AUTO_APPLY_BUTTON_CLICKED':
      const coupons = await fetchCoupons()
      
      if(!coupons || coupons.length === 0) {
        sendResponse({success: false, error: 'No coupons found'});
        return;
      }

      const response = await handleAutoApply(coupons);
      
      sendResponse({ success: true, response: response });

      break;

    default:
      return;

    // updates to content-ui about the current state of auto-apply

    //using absolutes here might be risky, but it should work for now
    case 'AUTOAPPLY_TESTING':
      if (message.payload) {
        console.log('tabid', sender.tab!.id);
        handleTestingUpdate(message, sender.tab!.id!);
      }
      break;

    case 'AUTOAPPLY_ERROR':
      handleErrorUpdate(sender.tab!.id!)
      break;

    case 'AUTOAPPLY_COMPLETE':
      if(message.payload) {
        handleCompleteUpdate(message, sender.tab!.id!);
      }
      break;
  }

  return true;
});

const fetchCoupons = async () => {
  let coupons: Coupon[] = [];
  try {
    const currentURL = await getCurrentTab().then(url => getDomain(url));
    const validTLDs = ['.com', '.org', '.net', '.edu', '.gov', '.io', '.co', '.us', '.uk', '.ca', '.au', '.in'];
    const hasValidTLD = validTLDs.some(tld => currentURL.endsWith(tld));
    if (!hasValidTLD) {
      return;
    }

    const couponResponse: Coupon[] = await APIClient.searchCoupons(currentURL, 10);

    if (couponResponse && couponResponse.length > 0) {
      coupons = couponResponse;
      const firstCoupon = couponResponse[0];
      if (!currentURL.includes(firstCoupon.retailerUrl)) {
        return;
      }
      console.log("Retailer Name: ", firstCoupon.retailerName);

    } else {
      coupons = [];
    }
  } catch (err: any) {
    console.error("Error fetching coupons:", err);
  };

  return coupons;
}

const handleAutoApply = async (coupons:Coupon[]) => {
  if (!coupons || coupons.length === 0) return;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab?.id || !tab.url) {
    console.error("No active tab with URL found for auto-apply.");
    return;
  }

  let domain: string;
  try {
    domain = getDomain(tab.url);
  } catch (e) {
    console.error("Invalid tab URL:", tab.url, e);
    return;
  }

  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['/content-runtime/index.iife.js'],
    });
    console.log("Content script injected or already present.");

    chrome.tabs.sendMessage(
      tab.id,
      {
        type: "AUTO_APPLY_COUPONS",
        payload: {
          codes: coupons.map(c => c.code), // Send only the codes
          domain: domain,
        }
      },
      (response) => {
        if (chrome.runtime.lastError) {
          return false;
        } else if (response) {
          if (response.success) {
            return true;
          } else {
            return false
          }
        } else {
          return false;
        }
      }
    );

  } catch (err: any) {
    console.error("Failed to inject script or send message:", err);
  }
};


const handleTestingUpdate = async (message: any, tabID: number) => {

  chrome.tabs.sendMessage(
    tabID,
    {
      type: 'AUTOAPPLY_TESTING',
      payload: {
        ...message.payload
      }
    }
  );
}

const handleErrorUpdate = async (tabID: number) => {


  chrome.tabs.sendMessage(
    tabID,
    {
      type: "AUTOAPPLY_ERROR",
    }
  )
}

const handleCompleteUpdate = async (message: any, tabID: number)  => {

  chrome.tabs.sendMessage(
    tabID,
    {
      type: 'AUTOAPPLY_COMPLETE',
      payload: {
        ...message.payload
      }
    }
  );
}


export const getCurrentTab = async (): Promise<string> => {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError.message);
      } else if (tabs.length === 0 || !tabs[0].url) {
        reject("No active tab found or URL is undefined.");
      } else {
        resolve(tabs[0].url!);
      }
    });
  });
};

export const getDomain = (url: string): string => {
  const hostname = new URL(url).hostname;

  const parts = hostname.split('.');
  if (parts.length > 2) {
      return parts.slice(-2).join('.');
  }
  
  return hostname;
};

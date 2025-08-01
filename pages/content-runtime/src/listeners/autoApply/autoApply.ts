import { SiteConfig, RequestPayload } from '../../types';
import { setInputValue, clickElement, delay, isElementUsable, checkResult } from '../../utils';
import { siteConfigs } from './cssSelectors';
import { prepareSiteForAutoApply } from './prepareSiteForAutoApply';
import { checkPrice, attemptCode } from '../../utils';

async function attemptApplyForSite(domain: string, codes: string[], sendResponse: (response: any) => void): Promise<void> {
    
    let bestCode = '';
    let bestSavings = 0;
    let priceBefore: number = 0;

    // For error handling reasons. If the content UI is displaying the modal, we want have the modal display the error.
    let contentuiMessageSent = false;

    console.log(`[AutoApply] Attempting for domain: ${domain} with ${codes.length} codes.`);

    const config = siteConfigs[domain];

    if (!config) {
        sendResponse({ success: false, message: `Site (${domain}) not configured.` });
        return;
    }

    try {
        
        await prepareSiteForAutoApply(domain, config);
        priceBefore = checkPrice(config);

        for (const [index, code] of codes.entries()) {
            const progress = Math.round(((index + 1) / codes.length) * 100);

            
            chrome.runtime.sendMessage({
                type: 'AUTOAPPLY_TESTING',
                payload: {
                    code,
                    progress
                }
            });

            contentuiMessageSent = true;

            await attemptCode(code, config);

            const waitTime = config.waitMs || 2000;
            await delay(waitTime);

            const resultStatus = checkResult(config);

            if (resultStatus === 'SUCCESS') {
                sendResponse({ success: true, appliedCode: code, message: `Successfully applied: ${code}` });
            } else if (resultStatus === 'ERROR') {
                console.log(`[AutoApply] Error detected for: ${code}`);
                if (config.clearInputOnError) {
                    //the input selector will exist, since it is checked in attemptCode
                    setInputValue(document.querySelector<HTMLInputElement>(config.inputSelector)!, '');
                    await delay(100);
                }
            } else {
                console.log(`[AutoApply] Result unknown for: ${code}. Continuing...`);
            }

            if(config.subtotalSelector) {
                const priceAfter = checkPrice(config);
                if(priceAfter < priceBefore && (priceBefore - priceAfter  > bestSavings)) {
                    bestSavings = parseFloat((priceBefore - priceAfter).toFixed(2));
                    bestCode = code;
                }
            }

            await delay(300);
        }

        chrome.runtime.sendMessage({
            type: 'AUTOAPPLY_COMPLETE',
            payload: {
                bestCode,
                bestSavings
            }
        })

        sendResponse({ success: false, message: "NO_CODES" })
    } catch (error: any) {
        console.error("[AutoApply] Error during auto-apply process:", error);
        sendResponse({ success: false, message: `Script error: ${error.message}` });

        if(contentuiMessageSent && bestSavings > 0 && bestCode != '') {
            chrome.runtime.sendMessage({
                autoApplyComplete: true,
                type: 'AUTOAPPLY_COMPLETE',
                payload: {
                    bestCode,
                    bestSavings
                }
            });

            //try and apply the best code we have so far
            await attemptCode(bestCode, config);
        } else if(contentuiMessageSent) {
            chrome.runtime.sendMessage({
                type: 'AUTOAPPLY_ERROR',
                payload: {
                    message: error.message || 'Unknown error'
                }
            });
        }
        return;
    }
}

export function autoApply(request: RequestPayload, sendResponse: (response: any) => void) {
    // Implementation of the autoApply function


    if (!request.payload?.domain || !request.payload?.codes) {
        console.error("[AutoApply] Invalid payload:", request.payload);
        sendResponse({ success: false, message: "Error: Invalid data from extension." });
        return false;
    }

    attemptApplyForSite(request.payload.domain, request.payload.codes, sendResponse)
        .catch(error => {
            console.error("[AutoApply] Error in attemptApplyForSite:", error);
            sendResponse({ success: false, message: `Script error: ${error.message || 'Unknown error'}` });
        });

    return true;
}

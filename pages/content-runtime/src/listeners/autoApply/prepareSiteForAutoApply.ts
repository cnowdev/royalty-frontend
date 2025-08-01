import { delay, } from "@src/utils";
import { SiteConfig } from "@src/types";

/**
 * Prepares the site for auto-apply by ensuring the necessary elements are present and visible.
 * 
 * @param domain The domain of the site to prepare for auto-apply.
 * @param config the css selectors for the site.
 */
export const prepareSiteForAutoApply = async (domain: string, config: SiteConfig) => {
    switch (domain) {
        case "codecademy.com": {
            const button = document.querySelector<HTMLButtonElement>("#promo-button");
            if (button && button.getAttribute("aria-expanded") === "false") {
                button.click();
                await delay(500);
            }
            break;
        }

        case "target.com": {
            const button = document.querySelector<HTMLButtonElement>("button[data-test=add-promo-code-btn]");
            if (button) {
                button.click();
                await delay(500);
            }
            break;
        }

        case "michaels.com": {
            let testinputField = document.querySelector<HTMLInputElement>(config.inputSelector);
            if (!testinputField) {
                const button = document.querySelector<HTMLButtonElement>(".css-1c7c9ch");
                if (button) {
                    button.click();
                    await delay(500);
                }
            }
            break;
        }

        case "kohls.com": {
            let testinputField = document.querySelector<HTMLInputElement>(config.inputSelector);
            if (!testinputField) {
                const button = document.querySelector<HTMLButtonElement>(".open-offers-block");
                if (button) {
                    button.click();
                    let promoCodeInput = document.querySelector<HTMLInputElement>(config.inputSelector);
                    while (!promoCodeInput) {
                        await delay(500);
                        promoCodeInput = document.querySelector<HTMLInputElement>(config.inputSelector);
                    }
                }
            }
            break;
        }

        case "amazon.com": {
            let promoCodeButton = document.querySelector<HTMLButtonElement>("#checkout-paymentOptionPanel > div > div.a-column.a-span8.a-spacing-none > div > div.a-column.a-span12.a-spacing-none.a-span-last > span > a");

            if (promoCodeButton) {
                promoCodeButton.click();
                let promoCodeInput = document.querySelector<HTMLInputElement>(config.inputSelector);

                while (!promoCodeInput) {
                    await delay(500);
                    promoCodeInput = document.querySelector<HTMLInputElement>(config.inputSelector);
                }
            }
            break;
        }

        default:
            console.log('No specific preparation needed for this domain:', domain);
            break;
    }
};
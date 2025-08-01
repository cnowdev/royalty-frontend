declare global {
    interface Window {
        hasCouponAutoApplyListener?: boolean;
    }
}

export interface SiteConfig {
    inputSelector: string;
    submitSelector: string;
    subtotalSelector?: string;
    successSelector?: string;
    errorSelector?: string;
    waitMs?: number;
    clearInputOnError?: boolean;
}

export interface RequestPayload {
    type: string;
    payload?: {
        domain: string;
        codes: string[];
    };
}

export {}
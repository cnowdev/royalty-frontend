import { Coupon, RetailerProduct } from './utils/shared-types.js'
import { couponCacheStorage, retailerProductCacheStorage } from '@extension/storage';

/**
 * API Helper class
 * 
 * Used for data caching and provides methods for interacting with the API.
 */
class API {
    private baseUrl: string = process.env.CEB_API_URL!;

    private async baseFetch(url: string, method: string = 'GET', body?: any): Promise<any> {
        const options: RequestInit = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(url, options);

        if (!response.ok) {
            throw new Error(`Error fetching data: ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * Method that searches for coupons and caches them
     * 
     * @param query The search query for coupons. This should be the domain of the website
     * @param sort_by The sorting method for the coupons. Can be 'newest', 'oldest', 'high_score', or 'low_score'
     * @param limit The number of items per page
     * @returns A list of Coupon objects
     */
    async searchCoupons(query: string, limit: number = 10): Promise<Coupon[]> {
        let cache = await couponCacheStorage.get();

        if(cache[query] && cache[query].timestamp > Date.now() - 5 * 60 * 1000 && cache[query].data.length > 0) { // Cache for 5 minutes
            console.log(`Returning cached coupons for query: ${query}`);
            return cache[query].data;
        }
        const params = new URLSearchParams({
            retailerUrl: query,
            limit: limit.toString()
          });
  

        const url = `${this.baseUrl}/coupons/search?${params.toString()}`;

  
        const response: Coupon[] = await this.baseFetch(url, 'GET');

        if (!response) {
            throw new Error('Failed to fetch coupons');
        }

        if(!response || response.length === 0) {
            throw new Error(`No coupons found for: ${query}`);
        }

        cache[query] = {
            data: response,
            timestamp: Date.now() // Update the timestamp to the current time
        }
        couponCacheStorage.set(cache);

        return response;
    }

    /**
     * gets the retailerProduct for a given product URL.
     * 
     * @param productURL 
     * @returns a list of RetailerProduct objects
     */
    async getRetailerProduct(productURL: string): Promise<RetailerProduct> {
        let cache = await retailerProductCacheStorage.get();
        
        if (cache[productURL] && cache[productURL].timestamp > Date.now() - 5 * 60 * 1000) {
            console.log(`Returning cached retailer product for URL: ${productURL}`);
            return cache[productURL].data;
        }

        const params = new URLSearchParams({ productURL });
        const url = `${this.baseUrl}/products/retailer-product?${params.toString()}`;
        const response = await this.baseFetch(url, 'GET');
        console.log("Api response: ", response);
        cache[productURL] = { data: response, timestamp: Date.now() };
        retailerProductCacheStorage.set(cache);

        return response;
    }

    /**
     * Gets the latest retailerProduct objects that share a similair Product ID.
     * 
     * @param objectID 
     * @returns a list of RetailerProduct objects
     */
    async getRelatedProducts(objectID: string): Promise<RetailerProduct[]> {
        const params = new URLSearchParams({
            objectId: objectID
        });

        const url = `${this.baseUrl}/products/related?${params.toString()}`;
        const response = await this.baseFetch(url, 'GET');
        if (!response) {
            throw new Error('Failed to fetch related products');
        }
        return response;
    }

    /**
     * Gets the pricing data for a given retailerProduct retailer product id and retailer name.
     * 
     * @param retailerProductId
     * @param retailerName
     * @returns the pricing data for the given retailerProduct
     */
    async getRetailerProductPricingData(retailerProductId: string, retailerName: string): Promise<RetailerProduct[]> {
        const params = new URLSearchParams({
            retailerProductID: retailerProductId,
            retailerName: retailerName,
        });

        const url = `${this.baseUrl}/products/retailer-product-pricing-data?${params.toString()}`;
        const response = await this.baseFetch(url, 'GET');
        if (!response) {
            throw new Error('Failed to fetch retailer product pricing data');
        }
        return response;
    }
}

export const APIClient = new API();
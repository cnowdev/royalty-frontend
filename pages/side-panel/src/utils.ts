/**
 * takes the retailername and returns the display name
 * 
 * @param retailerName 
 */
export const getRetailerDisplayName = (retailerName: string): string => {
    //this is for special cases where the retailer name is not the same as the display name (ex: It's two words, or has a special character)
    const names: any = {
        "farmandfleet": "Farm & Fleet",
        "riteaid": "Rite Aid",
        'stockx': 'StockX'
    }

    return names[retailerName] || retailerName.charAt(0).toUpperCase() + retailerName.slice(1);
}

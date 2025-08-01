export const productURLs = [
    "amazon.com*/dp",
    "target.com/p",
    "bestbuy.com/site/*\\.p",
    "macys.com/shop/product",
    "gap.com/browse/product\\.do",
    "gamestop.com/*/products",
    "sephora.com/product",
    "jcpenney.com/p",
    "wayfair.com/*/pdp",
    "walmart.com/ip"
];

export const autoApplyProductURLs = [
    "www.codecademy.com/checkout",
    "www.target.com/cart",
    "www.costco.com/SinglePageCheckoutView",
    "www.amazon.com/checkout",
    "www.michaels.com/cart",
    "www.skillshare.com/en/membership/checkout",
    "www.kohls.com/checkout",
    "www.gap.com/shopping-bag",
]

export function matchesProductURL(url: string): boolean {
    return productURLs.some((pattern) => {
      const regex = new RegExp(
        pattern.replace(/\*/g, ".*").replace(/\//g, "\\/"),
        "i"
      );
      return regex.test(url);
    });
}
  
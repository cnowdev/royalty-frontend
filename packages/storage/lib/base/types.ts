import type { StorageEnum } from './enums.js';

export type ValueOrUpdate<D> = D | ((prev: D) => Promise<D> | D);

export type BaseStorage<D> = {
  get: () => Promise<D>;
  set: (value: ValueOrUpdate<D>) => Promise<void>;
  getSnapshot: () => D | null;
  subscribe: (listener: () => void) => () => void;
};

export type StorageConfig<D = string> = {
  /**
   * Assign the {@link StorageEnum} to use.
   * @default Local
   */
  storageEnum?: StorageEnum;
  /**
   * Only for {@link StorageEnum.Session}: Grant Content scripts access to storage area?
   * @default false
   */
  sessionAccessForContentScripts?: boolean;
  /**
   * Keeps state live in sync between all instances of the extension. Like between popup, side panel and content scripts.
   * To allow chrome background scripts to stay in sync as well, use {@link StorageEnum.Session} storage area with
   * {@link StorageConfig.sessionAccessForContentScripts} potentially also set to true.
   * @see https://stackoverflow.com/a/75637138/2763239
   * @default false
   */
  liveUpdate?: boolean;
  /**
   * An optional props for converting values from storage and into it.
   * @default undefined
   */
  serialization?: {
    /**
     * convert non-native values to string to be saved in storage
     */
    serialize: (value: D) => string;
    /**
     * convert string value from storage to non-native values
     */
    deserialize: (text: string) => D;
  };
};

export interface Coupon {
  id: number;
  code: string;
  retailerName: string;
  description?: string;
  expirationDate?: Date;
  createdAt: Date;
  retailerUrl: string;
}

export interface CouponCardProps {
  coupon: Coupon;
  isLight: boolean;
}

export interface Product {
id: number;
objectId: string;
lastUpdated: string; // ISO string format for DateTime
retailerProducts: RetailerProduct[];
};

export interface RetailerProduct {
id: number;
productId: number;
product: Product;
name?: string;
description?: string;
retailerName: string;
retailerProductId: string;
retailerProductUrl: string;
price: number; // Assuming Decimal is represented as a number on the frontend
createdAt: string; // ISO string format for DateTime
};

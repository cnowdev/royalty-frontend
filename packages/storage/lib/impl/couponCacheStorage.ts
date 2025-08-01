import type { Coupon } from '../base/types.js'
import type { BaseStorage } from '../base/index.js';
import { createStorage, StorageEnum } from '../base/index.js';

type CouponStorage = BaseStorage<Record<string, {data: Coupon[], timestamp: number}>>;

const storage = createStorage<Record<string, {data: Coupon[], timestamp: number}>>('coupon-cache-storage-key', {}, {
    storageEnum: StorageEnum.Local,
    liveUpdate: true
})

export const couponCacheStorage: CouponStorage = { 
    ...storage
}

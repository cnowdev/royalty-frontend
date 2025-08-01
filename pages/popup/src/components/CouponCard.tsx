import { CouponCardProps } from "@extension/shared";
import { useState } from "react";

export const CouponCard: React.FC<CouponCardProps> = ({ coupon, isLight }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(coupon.code)
      .then(() => {
        setCopied(true);
        const timer = setTimeout(() => setCopied(false), 1500);
        return () => clearTimeout(timer);
      })
      .catch(err => console.error('Failed to copy code: ', err));
  };

  const formatDiscount = (value: number, type: string): string => {
    switch (type) {
      case 'PERCENTAGE_OFF': return `${value}% OFF`;
      case 'FIXED_AMOUNT_OFF': return `$${value} OFF`;
      default: return `${value} ${type.replace(/_/g, ' ').toLowerCase()}`;
    }
  };

  return (
    <div className={`border rounded-lg p-3 md:p-4 mb-3 transition-colors duration-200 shadow-md ${ isLight ? 'bg-white border-gray-300 hover:shadow-lg' : 'bg-nav border-border hover:bg-gray-650'}`}>
      <div className="flex justify-between items-start gap-2 mb-2">
        <h3 className={`font-semibold text-sm md:text-base flex-1 ${ isLight ? 'text-gray-800' : 'text-white'}`}>{coupon.code}</h3>
      {/*  this stuff is deprecated since we no longer have discount_type and discount_value. May revisit this
        <span className={`text-xs font-medium px-2.5 py-0.5 rounded whitespace-nowrap ${ isLight ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-green-900 text-green-300 border border-green-700'}`}>
          {formatDiscount(coupon.discount_value, coupon.discount_type)}
        </span>
      */}
      </div>
      {coupon.description && (
        <p className={`text-xs md:text-sm mb-3 ${ isLight ? 'text-gray-600' : 'text-gray-300'}`}>{coupon.description}</p>
      )}
      <div className="flex items-center justify-between gap-3">
        <span className={`border-2 border-dashed px-3 py-1 rounded text-sm font-mono truncate cursor-text select-all ${ isLight ? 'border-gray-300 text-indigo-700 bg-gray-50' : 'border-gray-500 text-indigo-300 bg-gray-600'}`} title={coupon.code}>
          {coupon.code}
        </span>
        <button onClick={handleCopy} className={`px-3 py-1.5 text-xs md:text-sm font-medium rounded transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 whitespace-nowrap ${ copied ? `text-white ${isLight ? 'bg-green-500 focus:ring-green-400' : 'bg-green-600 focus:ring-green-500'}` : `text-white ${isLight ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500' : 'bg-blue-700 hover:bg-blue-800 focus:ring-blue-600'}`} ${ isLight ? 'focus:ring-offset-white' : 'focus:ring-offset-gray-700'}`}>
          {copied ? 'Copied!' : 'Copy Code'}
        </button>
      </div>
    </div>
  );
};
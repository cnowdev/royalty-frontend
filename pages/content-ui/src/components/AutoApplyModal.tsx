import React, { useState, useEffect } from 'react';
import { AutoApplyStep } from '../types';
import { formatPrice } from '../utils';

interface AutoApplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStep: AutoApplyStep | null;
  currentCoupon: string;
  progress: number;
  finalSavings: number;
}

const AutoApplyModal: React.FC<AutoApplyModalProps> = ({ isOpen, onClose, currentStep, currentCoupon, progress, finalSavings }: AutoApplyModalProps) => {

  const steps = {
    [AutoApplyStep.TESTING]: "Testing coupon codes...",
    [AutoApplyStep.ERROR]: "Something went wrong...",
    [AutoApplyStep.COMPLETE]: "All coupons tested!"
  };

  useEffect(() => {
    
  }, []);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[10000]"
      onClick={currentStep == AutoApplyStep.COMPLETE || currentStep == AutoApplyStep.ERROR ? onClose : undefined}
    >
      <div
        className="bg-background rounded-xl shadow-2xl max-w-lg w-[90%] relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-8 py-6 text-center">
          {currentStep == AutoApplyStep.COMPLETE ? (
            <>
              {finalSavings > 0 ? (
                <>
                  <h2 className="text-2xl font-bold text-green-400 mb-2">
                    Great news! You saved {formatPrice(finalSavings)}
                  </h2>
                  <p className="text-gray-400 text-lg">
                    Royalty found you the best available discount
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-gray-300 mb-2">
                    No valid coupons found
                  </h2>
                  <p className="text-gray-400 text-lg">
                    Royalty checked all available coupons but none worked for this purchase
                  </p>
                </>
              )}
            </>
          ) : currentStep == AutoApplyStep.ERROR ? (
            <>
              <h2 className="text-2xl font-bold text-red-400 mb-2">
                Oops! Something went wrong
              </h2>
              <p className="text-gray-400 text-lg">
                Royalty encountered an error while trying to apply coupons
              </p>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-white mb-2">
                Royalty is finding you the best deals
              </h2>
              <p className="text-gray-400 text-lg">
                {steps[currentStep!] || 'idk how we got here'}
              </p>
            </>
          )}
        </div>

        {/* Content */}
        <div className="px-8 pb-8">
          {currentStep == AutoApplyStep.COMPLETE || currentStep == AutoApplyStep.ERROR ? (
            <>
              {/* Completion/Error Actions */}
              <div className="flex justify-center">
                <button 
                  onClick={onClose}
                  className={`font-medium py-3 px-8 rounded-lg transition-colors ${
                    currentStep == AutoApplyStep.ERROR 
                      ? 'bg-red-600 hover:bg-red-700 text-white' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {currentStep == AutoApplyStep.ERROR ? 'Try Again' : 'Proceed'}
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Progress Bar */}
              <div className="mb-6">
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div 
                    className="bg-blue-500 h-3 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>

              {/* Current Coupon Being Tested */}
              {currentStep === AutoApplyStep.TESTING && (
                <div className="text-center">
                  <p className="text-gray-400 text-sm mb-2">Currently testing:</p>
                  <div className="inline-flex items-center px-4 py-2 bg-gray-800 rounded-lg">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse mr-3"></div>
                    <span className="text-white font-mono text-lg">{currentCoupon}</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AutoApplyModal;
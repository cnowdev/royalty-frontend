import React, { useEffect, useState } from 'react';
import { matchesProductURL, autoApplyProductURLs } from '@extension/shared';
import RoyaltyMessage from './components/RoyaltyMessage';
import RoyaltyButton from './components/RoyaltyButton';
import AutoApplyModal from './components/AutoApplyModal';
import { AutoApplyStep } from './types';

export default function App() {
  const [showMessage, setShowMessage] = useState(false);
  const [showButton, setShowButton] = useState(false);

    const [currentStep, setCurrentStep] = useState<AutoApplyStep | null>(null);
    const [currentCoupon, setCurrentCoupon] = useState<string>('SAVE20');
    const [progress, setProgress] = useState<number>(0);
    const [finalSavings, setFinalSavings] = useState<number>(0);

  useEffect(() => {
    let prevURL = window.location.href;

    const checkURL = () => {
      const currentURL = window.location.href;
      if (currentURL !== prevURL) {
        prevURL = currentURL;
        updateUI();
      }
    };

    function updateUI() {
      const url = window.location.href;
      setShowMessage(autoApplyProductURLs.some((u) => url.includes(u)));
      setShowButton(!!url && matchesProductURL(url));
    }

    const interval = setInterval(checkURL, 500);
    updateUI();


    chrome.runtime.onMessage.addListener((message) => {
      if (message.type == "AUTOAPPLY_TESTING") {
        setCurrentStep(AutoApplyStep.TESTING);
        setCurrentCoupon(message.payload.code);
        setProgress(message.payload.progress);
      }

      if(message.type == "AUTOAPPLY_COMPLETE") {
        setCurrentStep(AutoApplyStep.COMPLETE);
        setFinalSavings(message.payload.bestSavings);
      }

      if(message.type == "AUTOAPPLY_ERROR") {
        setCurrentStep(AutoApplyStep.ERROR);
      }
    })

    return () => clearInterval(interval);




  }, []);

  const handleApply = () => {
    chrome.runtime.sendMessage({ type: 'AUTO_APPLY_BUTTON_CLICKED' }, () => {
      setShowMessage(false);
    });
  };

  return (
    <>
      {(showMessage && currentStep == null) && (
        <RoyaltyMessage onClose={() => setShowMessage(false)} onApply={handleApply} />
      )}
      {showButton && <RoyaltyButton />}
      <AutoApplyModal isOpen={currentStep != null} onClose={() => {setCurrentStep(null)}} currentStep={currentStep} currentCoupon={currentCoupon} progress={progress} finalSavings={finalSavings} />
    </>
  );
}


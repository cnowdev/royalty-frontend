export default function RoyaltyButton() {
  return (
    <button
      className="fixed top-1/2 right-[1px] -translate-y-1/2 w-[65px] h-[65px] bg-background text-foreground rounded-[10px] cursor-pointer z-[1000] flex flex-col items-center justify-center shadow-lg"
      onClick={() => {
        chrome.runtime.sendMessage({ type: 'OPEN_SIDE_PANEL' }, (response) => {
          if (chrome.runtime.lastError) {
            console.error('Error sending message:', chrome.runtime.lastError.message);
          } else {
            console.log('Response from background:', response);
          }
        });
      }}
    >
      <img
        src={chrome.runtime.getURL('content-ui/Royalty-Icon.svg')}
        className="h-[40px] w-[40px]"
        alt="Royalty Logo"
      />
    </button>
  );
}

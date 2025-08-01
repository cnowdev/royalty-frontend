import React, { useState, useEffect } from 'react';
import '@src/SidePanel.css';
import { useStorage, withErrorBoundary, withSuspense } from '@extension/shared';
import { exampleThemeStorage } from '@extension/storage';
import { Line } from 'react-chartjs-2';
import { APIClient } from '@extension/shared';
import { RetailerProduct } from '@extension/shared';
import { getCurrentTab, getDomain } from '../../popup/src/utils';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import RetailerProductCard from './components/RetailerProductCard';

// Register required Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

const SidePanel = () => {
  const theme = useStorage(exampleThemeStorage);
  const isLight = theme === 'light';
  const toggleTheme = () => {
    exampleThemeStorage.set(isLight ? 'dark' : 'light');
  };

  const [retailers, setRetailers] = useState<RetailerProduct[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentProduct, setCurrentProduct] = useState<RetailerProduct | null>(null);
  const [priceHistory, setPriceHistory] = useState<{ date: string; price: number }[]>([]);
  const [showChart, setShowChart] = useState<boolean>(true);

  useEffect(() => {
    const fetchRetailers = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Replace with the actual product URL or object ID
        const productURL = await getCurrentTab(); // Use the current URL

        const retailerProduct = await APIClient.getRetailerProduct(productURL);

        // Fetch related products using the object ID
        const relatedProducts = await APIClient.getRelatedProducts(retailerProduct.product.objectId);

        // Set the current product and related retailers
        setCurrentProduct(retailerProduct);
        setRetailers(relatedProducts);

        // Generate price history data for the chart
        const pricingData: { createdAt: string; price: string }[] = (await APIClient.getRetailerProductPricingData(retailerProduct.retailerProductId, retailerProduct.retailerName)).map((entry) => ({
          ...entry,
          price: entry.price.toString(),
        }));
        const priceHistoryData = pricingData.map((entry) => ({
          date: new Date(entry.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          price: parseFloat(entry.price),
        }));

        if (priceHistoryData.length > 0) {
          const lastPrice = priceHistoryData[priceHistoryData.length - 1].price;
          const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          priceHistoryData.push({ date: today, price: lastPrice });
        }

        setPriceHistory(priceHistoryData);
      } catch (err: any) {
        console.error('Error fetching retailers:', err);
        setError("An error occurred while fetching data. Make sure you're on a product page. We also may not support this retailer/product yet.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRetailers();

    const handleTabUpdate = (tabId: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) => {
      if (changeInfo.url) {
        window.close(); // Close the side panel when the URL changes
      }
    };

    chrome.tabs.onUpdated.addListener(handleTabUpdate);
  }, []);


  const data = {
    labels: priceHistory.map((entry) => entry.date),
    datasets: [
      {
        label: 'Price ($)',
        data: priceHistory.map((entry) => entry.price),
        borderColor: '#217ED1',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.3,
        pointRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true },
      tooltip: { enabled: true },
    },
    scales: {
      y: {
        ticks: {
          callback: function(tickValue: string | number, index: number, ticks: any) {
            if (typeof tickValue === 'number') {
              return `$${tickValue.toFixed(2)}`;
            }
            return `$${tickValue}`;
          },
        },
      },
    },
  };

  return (
    <div className={`App w-full h-full font-sans ${isLight ? 'bg-slate-50' : 'bg-background'}`}>
      <header className={`p-4 pb-3 border-b ${isLight ? 'border-gray-200' : 'border-gray-600'} flex justify-between items-center gap-2`}>
        <h1 className={`text-lg font-bold truncate ${isLight ? 'text-gray-900' : 'text-gray-100'}`}>
          Price History
        </h1>
      </header>

      <main className="p-4 overflow-y-auto h-[calc(100%-60px)] custom-scrollbar">
        {isLoading && (
          <div className={`text-center py-10 ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
            Loading price data...
          </div>
        )}

        {error && !isLoading && (
          <div className={`text-center py-6 px-2 rounded border ${isLight ? 'bg-red-50 border-red-200 text-red-700' : 'bg-red-900/50 border-red-700/50 text-red-300'}`}>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {!isLoading && !error && currentProduct && (
          <div className="space-y-6">
            {/* Product Title and Image */}
            <div className="flex items-center gap-3">
              <img
                src={currentProduct.imageUrl || chrome.runtime.getURL("content-ui/Royalty-Icon.svg")}
                alt={currentProduct.name || 'Product Image'}
                className="w-16 h-16 object-cover rounded"
              />
              <div>
                <h2 className={`text-sm font-medium leading-tight ${isLight ? 'text-gray-900' : 'text-gray-100'}`}>
                  {currentProduct.name}
                </h2>
              </div>
            </div>

            {/* Price Chart */}
            <div className={`p-3 rounded-lg border shadow-md ${isLight ? 'border-gray-300 bg-white' : 'border-border bg-nav'}`}>
              <h3 className={`text-sm font-medium mb-2 ${isLight ? 'text-gray-800' : 'text-gray-200'}`}>
                Price History
              </h3>
              {currentProduct?.retailerName === "amazon" ? (
                <>

                  <div className="h-64 md:h-96 lg:h-[450px] relative">
                    <button
                      onClick={() => setShowChart((prev) => !prev)}
                      className={`absolute top-[-10px] left-2 text-xs underline ${isLight ? 'text-blue-600' : 'text-blue-400'}`}
                    >
                      {showChart ? 'Show CCC' : 'Show Chart'}
                    </button>
                    {showChart ? (
                      <Line data={data} options={options} />
                    ) : (
                      <img
                        src={`https://charts.camelcamelcamel.com/us/${currentProduct.retailerProductId}/amazon.png?force=1&zero=0&w=100&h=100&desired=false&legend=1&ilt=1&tp=3m&fo=0&lang=en`} // Replace with the actual image URL
                        alt="We may not support this product yet"
                        className="w-full h-full object-contain"
                      />
                    )}
                  </div>
                </>
              ) : (
                <div className="h-48 md:h-64 lg:h-80 ">
                  <Line data={data} options={options} />
                </div>
              )}

            </div>
            <div className={`grid grid-cols-3 gap-3 text-center`}>
              <div className={`p-3 rounded-lg border shadow-md ${isLight ? 'border-gray-300 bg-white' : 'border-border bg-nav'}`}>
                <p className={`text-xs ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>Current Price</p>
                <p className={`text-lg font-bold ${isLight ? 'text-gray-800' : 'text-gray-100'}`}>
                  ${Number(currentProduct.price).toFixed(2)}
                </p>
              </div>
              <div className={`p-3 rounded-lg border shadow-md ${isLight ? 'border-gray-300 bg-white' : 'border-border bg-nav'}`}>
                <p className={`text-xs ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>Lowest Price</p>
                <p className={`text-lg font-bold text-green-500`}>
                  ${Math.min(...priceHistory.map((entry) => entry.price)).toFixed(2)}
                </p>
                <p className={`text-xs ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
                  {priceHistory.find((entry) => entry.price === Math.min(...priceHistory.map((e) => e.price)))?.date || ''}
                </p>
              </div>
              <div className={`p-3 rounded-lg border shadow-md ${isLight ? 'border-gray-300 bg-white' : 'border-border bg-nav'}`}>
                <p className={`text-xs ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>Highest Price</p>
                <p className={`text-lg font-bold ${isLight ? 'text-gray-800' : 'text-gray-100'}`}>
                  ${Math.max(...priceHistory.map((entry) => entry.price)).toFixed(2)}
                </p>
              </div>
            </div>

            {/* Retailers List */}
            <div>
              <h3 className={`text-sm font-medium mb-3 ${isLight ? 'text-gray-800' : 'text-gray-200'}`}>
                All Retailers
              </h3>
              <div className="space-y-3">
                {retailers.map((retailer) => <RetailerProductCard retailerProduct={retailer} isLight={isLight} currentProduct={currentProduct} />)}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default withErrorBoundary(
  withSuspense(
    SidePanel,
    <div className="w-full h-full flex items-center justify-center text-gray-500">Loading Price History...</div>
  ),
  <div className="w-full p-4 text-red-600">An unexpected error occurred.</div>
);
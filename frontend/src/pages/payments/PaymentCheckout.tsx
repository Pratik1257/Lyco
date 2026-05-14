import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, AlertCircle, Loader2, CreditCard, ShoppingBag, Receipt, ChevronRight } from 'lucide-react';
import { paymentsApi } from '../../api/paymentsApi';
import { Button } from '../../components/ui/Button';

export default function PaymentCheckout() {
  const { guid } = useParams<{ guid: string }>();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!guid) return;
      try {
        setLoading(true);
        // Using the public endpoint specifically for gateway checks
        const response = await paymentsApi.getCheckoutDetails(guid);
        setData(response);
      } catch (err: any) {
        console.error('Checkout fetch failed:', err);
        setError(err.response?.data?.error || 'Could not find payment details for this link.');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [guid]);

  const handlePayNow = () => {
    if (data?.paypalUrl) {
      window.location.href = data.paypalUrl;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-cyan-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Verifying payment status...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 text-center border border-red-100 bg-white shadow-2xl rounded-2xl">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Invalid Link</h2>
          <p className="text-slate-600 mb-6">{error || 'This payment link is invalid or has expired.'}</p>
          <Button 
            className="w-full bg-slate-900 hover:bg-slate-800 text-white"
            onClick={() => window.location.href = '/'}
          >
            Go to Homepage
          </Button>
        </div>
      </div>
    );
  }

  if (data.isPaid) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-inter">
        <div className="max-w-md w-full p-8 text-center border border-emerald-100 bg-white shadow-2xl rounded-2xl">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <CheckCircle size={40} />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Already Paid!</h2>
          <p className="text-slate-600 text-lg mb-8 leading-relaxed">
            This invoice has already been successfully processed. Thank you for your business!
          </p>
          <div className="space-y-3">
            <Button 
              className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              onClick={() => window.location.href = '/'}
            >
              Back to Website
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 flex items-center justify-center p-4 py-12 font-inter">
      <div className="max-w-2xl w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-2 mb-8">
          <div className="inline-flex items-center justify-center px-4 py-1 rounded-full bg-cyan-100 text-cyan-700 text-xs font-black uppercase tracking-widest mb-2 shadow-sm">
            Payment Gateway
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Review & Pay</h1>
          <p className="text-slate-500 text-lg font-medium">Verify your order details before proceeding to PayPal</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Main Card */}
          <div className="md:col-span-12 p-0 overflow-hidden border border-slate-200 bg-white shadow-2xl shadow-slate-200/50 rounded-2xl">
            {/* Amount Banner */}
            <div className="bg-slate-900 p-8 text-white flex flex-col items-center justify-center text-center">
              <span className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-1">Total Payable Amount</span>
              <div className="text-5xl font-black tracking-tighter">
                {data.currency === 'GBP' ? '£' : 
                 data.currency === 'EUR' ? '€' : 
                 data.currency === 'AUD' ? 'A$' : '$'} 
                {parseFloat(data.amount).toFixed(2)}
              </div>
            </div>

            {/* Order Details List */}
            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <ShoppingBag size={20} className="text-cyan-600" />
                  Order Summary
                </h3>
                <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full">
                  {data.orders?.length} Order{data.orders?.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {data.orders?.map((order: any, idx: number) => (
                  <div key={idx} className="flex items-start justify-between p-4 rounded-xl bg-slate-50 border border-slate-100 transition-all hover:border-cyan-200 group">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-900 font-bold tracking-tight">#{order.orderNo}</span>
                        <span className="text-[10px] bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-500 font-black uppercase">
                          {order.serviceName}
                        </span>
                      </div>
                      <p className="text-slate-500 text-xs font-medium line-clamp-1">{order.poNo || 'No Work Title'}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-slate-900 font-black text-sm">
                        {data.currency === 'GBP' ? '£' : 
                         data.currency === 'EUR' ? '€' : 
                         data.currency === 'AUD' ? 'A$' : '$'} 
                        {parseFloat(order.amount).toFixed(2)}
                      </div>
                      <div className={`text-[10px] font-black uppercase tracking-wider ${order.paymentStatus === 'Completed' ? 'text-emerald-600' : 'text-orange-500'}`}>
                        {order.paymentStatus}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Section */}
              <div className="pt-6 border-t border-slate-100 space-y-4">
                <Button 
                  className="w-full h-14 rounded-2xl bg-cyan-600 hover:bg-cyan-700 text-white flex items-center justify-center gap-3 transition-all transform hover:scale-[1.01] active:scale-[0.99] shadow-xl shadow-cyan-600/20 group"
                  onClick={handlePayNow}
                >
                  <CreditCard className="w-5 h-5 group-hover:animate-pulse" />
                  <span className="text-lg font-black tracking-tight">Pay Now with PayPal</span>
                  <ChevronRight size={20} className="opacity-50 group-hover:translate-x-1 transition-transform" />
                </Button>
                
                <p className="text-center text-slate-400 text-[11px] font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                  <Receipt size={12} />
                  SECURE 256-BIT ENCRYPTION
                </p>
              </div>
            </div>
          </div>
          
          <div className="md:col-span-12 text-center">
             <button 
               onClick={() => window.location.href = '/'}
               className="text-slate-400 hover:text-slate-600 text-sm font-bold flex items-center justify-center gap-1 mx-auto transition-colors"
             >
               Cancel and Return to Site
             </button>
          </div>
          </div>
        </div>
      </div>
    );
}

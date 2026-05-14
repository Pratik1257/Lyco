import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ShoppingBag, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5193/api';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.userType === 'Admin';
  const [count, setCount] = useState(10);
  const [confirmStatus, setConfirmStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const calledRef = useRef(false);

  useEffect(() => {
    if (calledRef.current) return;
    
    // Use a small delay to ensure URL is fully parsed
    const timer = setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      const txguid = params.get('txguid');

      console.log('[PaymentSuccess] Search string:', window.location.search);
      console.log('[PaymentSuccess] Detected txguid:', txguid);

      if (!txguid) {
        console.warn('[PaymentSuccess] No txguid found in URL.');
        setConfirmStatus('error');
        setErrorMessage('No transaction identifier found in the return URL.');
        return;
      }

      calledRef.current = true;
      setConfirmStatus('loading');

      const url = `${BACKEND_URL}/Payments/confirm-redirect?txguid=${encodeURIComponent(txguid)}`;
      console.log('[PaymentSuccess] Fetching:', url);

      fetch(url)
        .then(async (res) => {
          console.log('[PaymentSuccess] Response status:', res.status);
          if (!res.ok) {
            const text = await res.text();
            throw new Error(`Server returned ${res.status}: ${text}`);
          }
          return res.json();
        })
        .then(data => {
          console.log('[PaymentSuccess] Success data:', data);
          setConfirmStatus('done');
        })
        .catch(err => {
          console.error('[PaymentSuccess] Confirmation failed:', err);
          setConfirmStatus('error');
          setErrorMessage(err.message || 'Failed to communicate with the server.');
        });
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // ── Auto-redirect countdown ───────────────────────────────────────────────
  useEffect(() => {
    const timer = setInterval(() => {
      setCount(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // Only redirect if successful
          if (confirmStatus === 'done') {
            navigate(isAdmin ? '/admin/orders/history' : '/orders/history');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [navigate, isAdmin, confirmStatus]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center animate-in fade-in slide-in-from-bottom-4 duration-700">

        {/* Icon */}
        <div className="relative inline-flex items-center justify-center mb-8">
          {confirmStatus !== 'error' && (
            <div className="absolute w-32 h-32 rounded-full bg-emerald-100 animate-ping opacity-30" />
          )}
          <div className={`relative w-24 h-24 rounded-full flex items-center justify-center shadow-2xl ${
            confirmStatus === 'error' 
              ? 'bg-gradient-to-br from-rose-400 to-red-600 shadow-rose-400/30' 
              : 'bg-gradient-to-br from-emerald-400 to-green-600 shadow-emerald-400/30'
          }`}>
            {confirmStatus === 'error' ? (
              <AlertCircle size={44} className="text-white" strokeWidth={2.5} />
            ) : (
              <CheckCircle2 size={44} className="text-white" strokeWidth={2.5} />
            )}
          </div>
        </div>

        {/* Text */}
        <h1 className="text-3xl font-black text-slate-900 mb-3">
          {confirmStatus === 'error' ? 'Verification Issue' : 'Payment Received!'}
        </h1>
        <p className="text-slate-500 text-base leading-relaxed mb-2">
          {confirmStatus === 'error' 
            ? 'We couldn\'t automatically verify your payment status.' 
            : 'PayPal has processed your transaction successfully.'}
        </p>

        {/* Confirmation status badge */}
        <div className="mb-6 flex flex-col items-center gap-2">
          {confirmStatus === 'loading' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-100 text-amber-700 text-xs font-bold">
              <Loader2 size={12} className="animate-spin" />
              Finalizing order status…
            </span>
          )}
          {confirmStatus === 'done' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold">
              <CheckCircle2 size={12} />
              Database updated successfully!
            </span>
          )}
          {confirmStatus === 'error' && (
            <>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-100 text-rose-700 text-xs font-bold">
                <AlertCircle size={12} />
                Automatic update failed
              </span>
              {errorMessage && (
                <p className="text-[10px] text-rose-400 font-medium max-w-[250px]">
                  Error: {errorMessage}
                </p>
              )}
            </>
          )}
        </div>

        <p className="text-slate-400 text-sm leading-relaxed mb-8">
          {confirmStatus === 'error'
            ? 'Don\'t worry! Our background system (IPN) will likely update your status within a few minutes. You can check your order history shortly.'
            : 'Your order history will now reflect this payment. You will be redirected shortly.'}
        </p>

        {/* Auto redirect notice */}
        {confirmStatus === 'done' && (
          <p className="text-[11px] font-bold text-slate-300 uppercase tracking-widest mb-6 flex items-center justify-center gap-2">
            <Loader2 size={12} className="animate-spin" />
            Redirecting in {count}s…
          </p>
        )}

        {/* CTA */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigate(isAdmin ? '/admin/orders/history' : '/orders/history')}
            className="inline-flex items-center justify-center gap-2.5 px-8 py-3.5 bg-gradient-to-r from-slate-800 to-slate-900 text-white text-sm font-bold rounded-2xl shadow-xl hover:scale-105 transition-all duration-200"
          >
            <ShoppingBag size={17} />
            Go to Order History
          </button>
          
          {confirmStatus === 'error' && (
            <p className="text-[10px] text-slate-300 font-bold uppercase tracking-tighter">
              If the status remains 'Pending' after 10 minutes, please contact support.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

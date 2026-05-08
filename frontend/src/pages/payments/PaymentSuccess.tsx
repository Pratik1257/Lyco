import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ShoppingBag, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.userType === 'Admin';
  const [count, setCount] = useState(8);

  useEffect(() => {
    const timer = setInterval(() => {
      setCount(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate(isAdmin ? '/admin/orders/history' : '/orders/history');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [navigate, isAdmin]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center animate-in fade-in slide-in-from-bottom-4 duration-700">

        {/* Icon */}
        <div className="relative inline-flex items-center justify-center mb-8">
          <div className="absolute w-32 h-32 rounded-full bg-emerald-100 animate-ping opacity-30" />
          <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow-2xl shadow-emerald-400/30">
            <CheckCircle2 size={44} className="text-white" strokeWidth={2.5} />
          </div>
        </div>

        {/* Text */}
        <h1 className="text-3xl font-black text-slate-900 mb-3">Payment Submitted!</h1>
        <p className="text-slate-500 text-base leading-relaxed mb-2">
          Your payment is being verified by PayPal.
        </p>
        <p className="text-slate-400 text-sm leading-relaxed mb-8">
          Your order status will update automatically once confirmed. This usually takes a few seconds.
        </p>

        {/* Auto redirect notice */}
        <p className="text-[11px] font-bold text-slate-300 uppercase tracking-widest mb-6 flex items-center justify-center gap-2">
          <Loader2 size={12} className="animate-spin" />
          Redirecting to orders in {count}s…
        </p>

        {/* CTA */}
        <button
          onClick={() => navigate(isAdmin ? '/admin/orders/history' : '/orders/history')}
          className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white text-sm font-bold rounded-2xl shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-105 transition-all duration-200"
        >
          <ShoppingBag size={17} />
          View My Orders
        </button>
      </div>
    </div>
  );
}

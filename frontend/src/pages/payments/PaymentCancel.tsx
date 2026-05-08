import { useNavigate } from 'react-router-dom';
import { XCircle, ArrowLeft, ShoppingBag } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function PaymentCancel() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.userType === 'Admin';
  const ordersPath = isAdmin ? '/admin/orders/history' : '/orders/history';

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center animate-in fade-in slide-in-from-bottom-4 duration-700">

        {/* Icon */}
        <div className="relative inline-flex items-center justify-center mb-8">
          <div className="absolute w-32 h-32 rounded-full bg-amber-100 opacity-60" />
          <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-2xl shadow-amber-400/30">
            <XCircle size={44} className="text-white" strokeWidth={2.5} />
          </div>
        </div>

        {/* Text */}
        <h1 className="text-3xl font-black text-slate-900 mb-3">Payment Cancelled</h1>
        <p className="text-slate-500 text-base leading-relaxed mb-2">
          You cancelled the payment. No charges were made.
        </p>
        <p className="text-slate-400 text-sm leading-relaxed mb-10">
          Your orders are still pending. You can retry payment anytime from the Order List page.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => navigate(ordersPath)}
            className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-gradient-to-r from-slate-700 to-slate-900 text-white text-sm font-bold rounded-2xl shadow-xl shadow-slate-900/20 hover:shadow-slate-900/30 hover:scale-105 transition-all duration-200"
          >
            <ShoppingBag size={17} />
            Back to Orders
          </button>

          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-6 py-3.5 text-slate-400 text-sm font-bold rounded-2xl border border-slate-200 hover:border-slate-300 hover:text-slate-600 transition-all duration-200"
          >
            <ArrowLeft size={15} />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}

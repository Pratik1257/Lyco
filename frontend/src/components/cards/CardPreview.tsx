import { useMemo } from 'react';
import { CreditCard } from 'lucide-react';

interface CardPreviewProps {
  number: string;
  name: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  isFlipped: boolean;
  type: string;
}

export default function CardPreview({
  number,
  name,
  expiryMonth,
  expiryYear,
  cvv,
  isFlipped,
  type
}: CardPreviewProps) {
  
  // Detect card brand color/logo
  const brandStyles = useMemo(() => {
    const t = type.toLowerCase();
    if (t.includes('visa')) return { 
      bg: 'bg-gradient-to-br from-[#1a1a2e] to-[#16213e]',
      logo: 'VISA',
      accent: 'bg-blue-400/20'
    };
    if (t.includes('mastercard')) return { 
      bg: 'bg-gradient-to-br from-[#2b1055] to-[#7597de]',
      logo: 'Mastercard',
      accent: 'bg-orange-400/20'
    };
    if (t.includes('american express')) return { 
      bg: 'bg-gradient-to-br from-[#004e92] to-[#000428]',
      logo: 'Amex',
      accent: 'bg-cyan-400/20'
    };
    return { 
      bg: 'bg-gradient-to-br from-[#232526] to-[#414345]',
      logo: 'Card',
      accent: 'bg-gray-400/20'
    };
  }, [type]);

  const formattedNumber = useMemo(() => {
    const n = number.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const parts = [];
    for (let i = 0; i < 16; i += 4) {
      parts.push(n.substring(i, i + 4).padEnd(4, '•'));
    }
    return parts.join(' ');
  }, [number]);

  return (
    <div className="relative w-full max-w-[400px] aspect-[1.586/1] perspective-1000 group">
      <div className={`relative w-full h-full transition-transform duration-700 preserve-3d shadow-2xl rounded-2xl ${isFlipped ? 'rotate-y-180' : ''}`}>
        
        {/* Front Side */}
        <div className={`absolute inset-0 backface-hidden rounded-2xl p-6 text-white overflow-hidden ${brandStyles.bg} border border-white/10`}>
          {/* Decorative elements */}
          <div className={`absolute -right-10 -top-10 w-40 h-40 rounded-full blur-3xl ${brandStyles.accent}`} />
          <div className={`absolute -left-10 -bottom-10 w-40 h-40 rounded-full blur-3xl ${brandStyles.accent}`} />
          
          <div className="relative h-full flex flex-col justify-between z-10">
            <div className="flex justify-between items-start">
              <div className="w-12 h-10 bg-gradient-to-br from-yellow-200 to-yellow-500 rounded-md shadow-inner flex items-center justify-center">
                 <div className="w-8 h-6 border-[0.5px] border-black/10 rounded-sm grid grid-cols-3 grid-rows-2">
                    <div className="border-r border-b border-black/10" />
                    <div className="border-r border-b border-black/10" />
                    <div className="border-b border-black/10" />
                    <div className="border-r border-black/10" />
                    <div className="border-r border-black/10" />
                    <div />
                 </div>
              </div>
              <div className="text-xl font-black italic tracking-tighter opacity-80 uppercase">{brandStyles.logo}</div>
            </div>

            <div className="space-y-6">
              <div className="text-xl sm:text-2xl font-mono tracking-[0.2em] drop-shadow-md">
                {formattedNumber}
              </div>

              <div className="flex justify-between items-end">
                <div className="space-y-0.5">
                  <p className="text-[9px] uppercase tracking-widest opacity-60 font-bold">Card Holder</p>
                  <p className="text-sm font-bold truncate max-w-[180px] uppercase leading-none">
                    {name || 'YOUR NAME'}
                  </p>
                </div>
                <div className="space-y-0.5 text-right">
                  <p className="text-[9px] uppercase tracking-widest opacity-60 font-bold">Expires</p>
                  <p className="text-sm font-bold leading-none">
                    {expiryMonth || 'MM'}/{expiryYear || 'YY'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Back Side */}
        <div className={`absolute inset-0 backface-hidden rounded-2xl text-white rotate-y-180 ${brandStyles.bg} border border-white/10 flex flex-col pt-8 pb-6`}>
          <div className="w-full h-10 bg-[#111] mb-6 shadow-inner" />
          
          <div className="px-6 space-y-4">
            <div className="flex flex-col gap-1">
              <p className="text-[8px] uppercase tracking-widest opacity-60 font-bold ml-1">Authorized Signature</p>
              <div className="w-full h-8 bg-white/10 rounded-md backdrop-blur-sm border border-white/5 flex items-center justify-end px-3">
                <span className="text-black italic font-serif text-sm bg-white px-3 py-1 rounded shadow-inner transform -skew-x-12">
                   {cvv || '•••'}
                </span>
              </div>
            </div>
            
            <p className="text-[7px] leading-tight opacity-40 font-medium">
              This card is property of Lyco Designs Financial Services. Use constitutes acceptance of terms. If found, please return to any Lyco branch.
            </p>
            
            <div className="flex justify-end pt-2">
               <CreditCard size={20} className="opacity-20" />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

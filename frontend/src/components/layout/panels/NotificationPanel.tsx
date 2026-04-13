

interface NotificationItemProps {
  title: string;
  subtext: string;
  time: string;
  dotColor: string;
  isUnread?: boolean;
}

const NotificationItem = ({ title, subtext, time, dotColor, isUnread }: NotificationItemProps) => (
  <div className={`px-4 py-3 flex gap-3 cursor-pointer hover:bg-gray-50 transition-colors border-b border-black/[0.08] last:border-0 ${isUnread ? 'bg-teal-50/30' : ''}`}>
    <div className="mt-1.5 shrink-0 w-2 h-2 rounded-full" style={{ backgroundColor: dotColor }} />
    <div className="flex-1 min-w-0">
      <div className="flex justify-between items-start gap-2">
        <h4 className="text-[13px] font-medium text-gray-900 leading-tight truncate">{title}</h4>
        <span className="text-[11px] text-gray-400 whitespace-nowrap">{time}</span>
      </div>
      <p className="text-[12px] text-gray-500 mt-0.5 line-clamp-2">{subtext}</p>
    </div>
  </div>
);

interface NotificationPanelProps {
  onMarkAllRead: () => void;
  isOpen: boolean;
}

export default function NotificationPanel({ onMarkAllRead, isOpen }: NotificationPanelProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="absolute -right-[48px] sm:right-0 top-[calc(100%+8px)] w-[calc(100vw-32px)] sm:w-[340px] max-w-[340px] bg-white rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.10)] border border-black/[0.12] z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-black/[0.08]">
        <div className="flex items-center gap-2">
          <h3 className="text-[13px] font-semibold text-gray-900">Notifications</h3>
          <span className="px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 text-[10px] font-bold uppercase tracking-wider">5 new</span>
        </div>
        <button 
          onClick={onMarkAllRead}
          className="text-[12px] font-medium text-[#1D9E75] hover:underline transition-all"
        >
          Mark all read
        </button>
      </div>

      {/* Content */}
      <div className="max-h-[400px] overflow-y-auto overflow-x-hidden">
        {/* URGENT Section */}
        <div className="bg-gray-50/50 px-4 py-2">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px]">Urgent</span>
        </div>
        <NotificationItem 
          title="5 quotes awaiting review"
          subtext="Pending approval — oldest is 3 days old"
          time="Just now"
          dotColor="#E24B4A"
          isUnread={true}
        />
        <NotificationItem 
          title="Pending payments: $5,341"
          subtext="Across 10 open orders — action needed"
          time="2 hrs ago"
          dotColor="#EF9F27"
          isUnread={true}
        />

        {/* ORDERS Section */}
        <div className="bg-gray-50/50 px-4 py-2">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px]">Orders</span>
        </div>
        <NotificationItem 
          title="Order #2041 placed"
          subtext="New order from Rahul Mehta — ₹18,400"
          time="45 min ago"
          dotColor="#378ADD"
          isUnread={true}
        />
        <NotificationItem 
          title="Order #2038 delivered"
          subtext="Confirmed by customer successfully"
          time="3 hrs ago"
          dotColor="#1D9E75"
        />

        {/* SYSTEM Section */}
        <div className="bg-gray-50/50 px-4 py-2">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.5px]">System</span>
        </div>
        <NotificationItem 
          title="Invoice #INV-109 generated"
          subtext="Auto-generated for completed order"
          time="Yesterday"
          dotColor="#888780"
        />
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-black/[0.08] text-center">
        <button className="text-[12px] font-medium text-[#1D9E75] hover:underline transition-all w-full">
          View all notifications
        </button>
      </div>
    </div>
  );
}

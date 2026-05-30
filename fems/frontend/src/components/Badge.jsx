const variants = {
  active: 'bg-green-100 text-green-800',
  expired: 'bg-red-100 text-red-800',
  replaced: 'bg-gray-100 text-gray-800',
  pending: 'bg-yellow-100 text-yellow-800',
  escalated: 'bg-orange-100 text-orange-800',
  resolved: 'bg-blue-100 text-blue-800',
  '30_days': 'bg-yellow-100 text-yellow-800',
  '7_days': 'bg-orange-100 text-orange-800',
};

const labels = {
  active: 'Active',
  expired: 'Expired',
  replaced: 'Replaced',
  pending: 'Pending',
  escalated: 'Escalated',
  resolved: 'Resolved',
  '30_days': '30-Day Warning',
  '7_days': '7-Day Urgent',
};

export default function Badge({ status }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[status] || 'bg-gray-100 text-gray-800'}`}>
      {labels[status] || status}
    </span>
  );
}

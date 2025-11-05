export default function Badge({ children, tone = "neutral" }) {
  const map = {
    neutral: "bg-gray-100 text-gray-800 border-gray-200",
    warn: "bg-amber-50 text-amber-800 border-amber-200",
    stat: "bg-red-50 text-red-800 border-red-200",
    success: "bg-green-50 text-green-800 border-green-200",
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${map[tone] || map.neutral}`}>{children}</span>;
}
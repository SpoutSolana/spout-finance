export function TransparentReservesSection() {
  return (
    <div>
      <h3 className="text-2xl font-bold text-slate-900 mb-4">
        Transparent Reserves
      </h3>
      <p className="text-slate-600 leading-relaxed mb-4">
        Our proof of reserve system provides complete transparency. View
        real-time data showing exactly how your tokens are backed by
        high-quality, liquid assets.
      </p>
      <ul className="space-y-2 text-slate-600">
        <li className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
          Daily reserve audits
        </li>
        <li className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
          Public blockchain verification
        </li>
        <li className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
          Independent third-party validation
        </li>
      </ul>
    </div>
  );
}

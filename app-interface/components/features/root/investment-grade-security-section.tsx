export function InvestmentGradeSecuritySection() {
  return (
    <div>
      <h3 className="text-2xl font-bold text-slate-900 mb-4">
        Investment-Grade Security
      </h3>
      <p className="text-slate-600 leading-relaxed mb-4">
        Each token is backed 1:1 by investment-grade bond ETFs like LQD, held by
        a qualified U.S. custodian. This ensures maximum security and stability
        for your investments.
      </p>
      <ul className="space-y-2 text-slate-600">
        <li className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
          AAA-rated corporate bond ETFs
        </li>
        <li className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
          Qualified U.S. custodian oversight
        </li>
        <li className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
          Real-time reserve verification
        </li>
      </ul>
    </div>
  );
}

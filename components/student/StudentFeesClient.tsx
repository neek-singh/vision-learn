"use client";

import { useState, useMemo } from "react";
import { 
  Wallet, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  IndianRupee,
  Receipt,
  Calendar,
  History,
  Download,
  ArrowUpRight,
  ShieldCheck,
  AlertTriangle,
  Search,
  Filter
} from "lucide-react";

export function StudentFeesClient({ fee }: { fee: any }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMode, setFilterMode] = useState("all");

  const totalPaid = useMemo(() => {
    return fee.payments?.reduce((acc: number, p: any) => acc + Number(p.amount), 0) || 0;
  }, [fee.payments]);

  const balance = Number(fee.final_fee) - totalPaid;
  const progress = Math.min((totalPaid / Number(fee.final_fee)) * 100, 100);
  
  const overdueInstallment = useMemo(() => {
    return fee.installments?.find((i: any) => i.status === 'overdue' || (i.status === 'pending' && new Date(i.due_date) < new Date()));
  }, [fee.installments]);

  // Donut chart calculations
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  // Filter payments
  const filteredPayments = useMemo(() => {
    return (fee.payments || []).filter((pay: any) => {
      // Payment mode filter
      if (filterMode !== "all" && pay.payment_mode?.toLowerCase() !== filterMode.toLowerCase()) {
        return false;
      }
      
      // Text search (amount, mode, txn id)
      if (searchTerm.trim() !== "") {
        const query = searchTerm.toLowerCase();
        const matchesAmount = pay.amount?.toString().includes(query);
        const matchesMode = pay.payment_mode?.toLowerCase().includes(query);
        const matchesTxn = pay.transaction_id?.toLowerCase().includes(query);
        if (!matchesAmount && !matchesMode && !matchesTxn) return false;
      }

      return true;
    });
  }, [fee.payments, filterMode, searchTerm]);

  const handleDownloadReceipt = (payment: any) => {
    alert(`Downloading Receipt for payment of ₹${payment.amount} via ${payment.payment_mode}.\nTxn ID: ${payment.transaction_id || 'N/A'}`);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20 px-4">
      
      {/* Header & Alert */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Fees & Billing</h1>
            <p className="text-slate-500 font-medium">Detailed breakdown of your {fee.courses?.title} fee structure.</p>
          </div>
          <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm shrink-0">
             <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <ShieldCheck size={20} />
             </div>
             <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Security Status</p>
                <p className="text-xs font-bold text-slate-900 mt-1">Encrypted Payments</p>
             </div>
          </div>
        </div>

        {overdueInstallment && (
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-4 animate-bounce-subtle">
             <div className="w-10 h-10 bg-rose-500 text-white rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-rose-200">
                <AlertTriangle size={20} />
             </div>
             <div className="flex-1">
                <p className="text-sm font-black text-rose-900">Payment Overdue</p>
                <p className="text-xs font-medium text-rose-600 mt-0.5">
                  You have an installment of ₹{Number(overdueInstallment.amount).toLocaleString()} due since {new Date(overdueInstallment.due_date).toLocaleDateString()}. Please clear it to avoid access restrictions.
                </p>
             </div>
          </div>
        )}
      </div>

      {/* Main Overview Card with SVG Donut Chart */}
      <div className="bg-slate-900 rounded-[3rem] p-8 md:p-10 text-white relative overflow-hidden shadow-2xl shadow-indigo-950/20">
         <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
         <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />
         
         <div className="relative z-10 flex flex-col lg:flex-row gap-10 items-center justify-between">
            <div className="space-y-6 flex-1 w-full">
               <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full border border-white/10 bg-white/5`}>
                      ● {fee.status?.toUpperCase() || 'DUE'}
                    </span>
                  </div>
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Current Balance</p>
                  <h2 className="text-4xl sm:text-5xl font-black tracking-tighter flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-indigo-400">₹</span>
                    {balance.toLocaleString()}
                  </h2>
               </div>

               <div className="space-y-3">
                  <div className="flex justify-between items-end">
                     <p className="text-xs font-black uppercase tracking-widest text-slate-400">Payment Progress</p>
                     <p className="text-sm font-black text-indigo-400">{progress.toFixed(0)}% Complete</p>
                  </div>
                  <div className="h-3 bg-white/10 rounded-full overflow-hidden p-0.5">
                     <div 
                        className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full transition-all duration-1000 shadow-[0_0_20px_rgba(99,102,241,0.5)]" 
                        style={{ width: `${progress}%` }} 
                     />
                  </div>
               </div>
            </div>

            {/* Premium Interactive SVG Donut Chart */}
            <div className="relative w-36 h-36 shrink-0 flex items-center justify-center bg-white/5 rounded-full p-4 border border-white/5 backdrop-blur-sm">
               <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                 {/* Shadow circle */}
                 <circle
                   cx="50"
                   cy="50"
                   r={radius}
                   className="stroke-slate-800"
                   strokeWidth="7"
                   fill="transparent"
                 />
                 {/* Progress circle */}
                 <circle
                   cx="50"
                   cy="50"
                   r={radius}
                   className="stroke-indigo-500 transition-all duration-1000 ease-out"
                   strokeWidth="7"
                   strokeDasharray={circumference}
                   strokeDashoffset={strokeDashoffset}
                   strokeLinecap="round"
                   fill="transparent"
                 />
               </svg>
               <div className="absolute inset-0 flex flex-col items-center justify-center">
                 <span className="text-xl font-black tracking-tight">{progress.toFixed(0)}%</span>
                 <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Paid</span>
               </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full lg:w-80">
               <div className="p-5 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
                  <p className="text-[9px] font-black uppercase tracking-widest text-indigo-400 mb-1">Total Fee</p>
                  <p className="text-lg font-black">₹{fee.final_fee.toLocaleString()}</p>
               </div>
               <div className="p-5 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
                  <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400 mb-1">Total Paid</p>
                  <p className="text-lg font-black">₹{totalPaid.toLocaleString()}</p>
               </div>
               <div className="p-5 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md sm:col-span-2 flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Course Enrolled</p>
                    <p className="text-sm font-black truncate max-w-[160px]">{fee.courses?.title}</p>
                  </div>
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                    <Wallet size={20} className="text-indigo-400" />
                  </div>
               </div>
            </div>
         </div>
      </div>

      {/* Grid of Roadmap and Transaction History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Connected Timeline Roadmap */}
         <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-50 pb-5">
               <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                 <Calendar className="text-indigo-600" /> Installment Roadmap
               </h3>
               <div className="px-3 py-1 bg-slate-50 rounded-lg text-[10px] font-black text-slate-400 uppercase tracking-widest">
                 {fee.installments?.length || 0} Installments
               </div>
            </div>

            {/* Vertical Connected Timeline */}
            <div className="space-y-6 relative">
              {!fee.installments || fee.installments.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs font-bold">
                  No installment schedule available.
                </div>
              ) : (
                fee.installments.map((inst: any, idx: number) => {
                  const isPaid = inst.status === 'paid';
                  const isOverdue = inst.status === 'overdue' || (inst.status === 'pending' && new Date(inst.due_date) < new Date());
                  return (
                    <div key={inst.id} className="relative flex gap-5 pb-5 last:pb-0 group/timeline">
                      {/* Timeline connecting line */}
                      {idx !== fee.installments.length - 1 && (
                        <div className={`absolute left-5 top-10 bottom-0 w-[2px] ${isPaid ? 'bg-emerald-500' : 'bg-slate-100'}`} />
                      )}
                      
                      {/* Timeline node */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 shrink-0 border-2 transition-all ${
                        isPaid ? 'bg-emerald-500 border-emerald-500 text-white' :
                        isOverdue ? 'bg-rose-50 border-rose-500 text-rose-500 animate-pulse' :
                        'bg-white border-slate-200 text-slate-400 group-hover/timeline:border-indigo-500 group-hover/timeline:text-indigo-500'
                      }`}>
                        {isPaid ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                      </div>

                      {/* Content block */}
                      <div className={`flex-1 p-5 rounded-2xl border transition-all ${
                        isPaid ? 'bg-emerald-50/10 border-emerald-100/50 hover:bg-emerald-50/20' :
                        isOverdue ? 'bg-rose-50/30 border-rose-100/50 hover:bg-rose-50/50' :
                        'bg-slate-50/50 border-slate-100 hover:bg-white hover:shadow-md hover:border-slate-200'
                      }`}>
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Installment #{idx + 1}</p>
                            <p className="text-lg font-black text-slate-900 mt-0.5">₹{Number(inst.amount).toLocaleString()}</p>
                          </div>
                          <div className="sm:text-right">
                            <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border inline-block ${
                              isPaid ? 'text-emerald-700 bg-emerald-50 border-emerald-100' :
                              isOverdue ? 'text-rose-700 bg-rose-50 border-rose-100' :
                              'text-slate-500 bg-slate-100 border-slate-200'
                            }`}>
                              {isPaid ? 'Paid' : isOverdue ? 'Overdue' : 'Upcoming'}
                            </span>
                            <p className="text-[10px] font-bold text-slate-400 mt-1">
                              Due: {new Date(inst.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
         </div>

         {/* Transaction History Column */}
         <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-6 md:p-8 space-y-6 flex flex-col h-fit">
            <div className="flex items-center justify-between border-b border-slate-50 pb-5">
               <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                 <History className="text-indigo-600" /> Transactions
               </h3>
               <Receipt size={18} className="text-slate-300" />
            </div>

            {/* Filter & Search */}
            <div className="space-y-3 shrink-0">
               <div className="relative">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                   <Search size={14} />
                 </div>
                 <input 
                   type="text" 
                   placeholder="Search payments..."
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs font-semibold"
                 />
               </div>
               
               <select
                 value={filterMode}
                 onChange={(e) => setFilterMode(e.target.value)}
                 className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none text-xs font-bold text-slate-600 cursor-pointer"
               >
                 <option value="all">All Payment Modes</option>
                 <option value="cash">Cash</option>
                 <option value="online">Online / UPI</option>
                 <option value="card">Card</option>
                 <option value="transfer">Bank Transfer</option>
               </select>
            </div>
            
            {/* Scrollable list of receipts */}
            <div className="space-y-4 max-h-[450px] overflow-y-auto pr-1 scrollbar-hide flex-1">
               {filteredPayments.length === 0 ? (
                 <div className="py-12 text-center text-slate-300 text-xs font-bold bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    No transactions found
                 </div>
               ) : (
                 filteredPayments.map((pay: any) => (
                   <div key={pay.id} className="group p-4 rounded-2xl bg-slate-50 hover:bg-white hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 border border-transparent hover:border-slate-100 relative">
                      <div className="flex items-start justify-between mb-3">
                         <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm group-hover:scale-110 transition-transform">
                            <IndianRupee size={16}/>
                         </div>
                         <button 
                           onClick={() => handleDownloadReceipt(pay)}
                           className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-white rounded-lg transition-all cursor-pointer" 
                           title="Download Receipt"
                         >
                            <Download size={14}/>
                         </button>
                      </div>
                      <div className="space-y-1">
                         <p className="text-lg font-black text-slate-900">₹{Number(pay.amount).toLocaleString()}</p>
                         <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{pay.payment_mode || 'payment'}</span>
                            <span className="text-[9px] font-bold text-slate-400">{new Date(pay.payment_date).toLocaleDateString()}</span>
                         </div>
                         <p className="text-[8px] font-mono text-slate-300 pt-2 border-t border-slate-200/50 mt-2 truncate">TXN: {pay.transaction_id || 'ID-PLACEHOLDER'}</p>
                      </div>
                   </div>
                 ))
               )}
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 shrink-0">
               <p className="text-[9px] font-black text-slate-400 uppercase text-center tracking-[0.2em]">End of Records</p>
            </div>
         </div>
      </div>
    </div>
  );
}

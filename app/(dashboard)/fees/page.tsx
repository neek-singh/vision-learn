import { cookies } from "next/headers";
import { redirect } from "next/navigation";
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
  AlertTriangle
} from "lucide-react";
import { verifyToken } from "@/lib/auth-custom";
import { createPublicSupabaseClient } from "@/lib/supabase-server";

export default async function StudentFeesPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("vision_learn_session")?.value;

  if (!token) redirect("/login");

  const payload = await verifyToken(token);
  if (!payload) redirect("/login");

  const supabase = createPublicSupabaseClient();

  // 1. Fetch Student Fee Record
  const { data: fee } = await supabase
    .from("fees")
    .select(`
      *,
      courses (title),
      installments (*),
      payments (*)
    `)
    .eq("student_id", payload.id)
    .single();

  if (!fee) {
    return (
      <div className="max-w-3xl p-20 text-center bg-white rounded-[2.5rem] border border-slate-100 shadow-sm mx-auto">
         <Wallet size={40} className="mx-auto mb-4 text-slate-200" />
         <h3 className="text-xl font-black text-slate-900 tracking-tight">Financial Records Pending</h3>
         <p className="text-slate-500 font-medium">Your course fee structure hasn't been configured by the admin yet.</p>
      </div>
    );
  }

  const totalPaid = fee.payments?.reduce((acc: number, p: any) => acc + Number(p.amount), 0) || 0;
  const balance = Number(fee.final_fee) - totalPaid;
  const progress = Math.min((totalPaid / Number(fee.final_fee)) * 100, 100);
  
  const overdueInstallment = fee.installments?.find((i: any) => i.status === 'overdue' || (i.status === 'pending' && new Date(i.due_date) < new Date()));

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20 px-4">
      
      {/* Header & Alert */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Fees & Billing</h1>
            <p className="text-slate-500 font-medium">Detailed breakdown of your {fee.courses?.title} fee structure.</p>
          </div>
          <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
             <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <ShieldCheck size={20} />
             </div>
             <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Security Status</p>
                <p className="text-xs font-bold text-slate-900">Encrypted Payments</p>
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
                <p className="text-xs font-medium text-rose-600">You have an installment of ₹{overdueInstallment.amount} due since {new Date(overdueInstallment.due_date).toLocaleDateString()}. Please clear it to avoid access restrictions.</p>
             </div>
          </div>
        )}
      </div>

      {/* Main Overview Card */}
      <div className="bg-slate-900 rounded-[3rem] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl shadow-slate-200">
         <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20" />
         <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -ml-20 -mb-20" />
         
         <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
               <div className="space-y-2">
                  <div className="flex items-center gap-2 text-indigo-400">
                    <StatusBadge status={fee.status} />
                  </div>
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] opacity-50">Current Balance</p>
                  <h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter flex items-baseline gap-2">
                    <span className="text-2xl font-bold opacity-50 text-indigo-400">₹</span>
                    {balance.toLocaleString()}
                  </h2>
               </div>

               <div className="space-y-3">
                  <div className="flex justify-between items-end">
                     <p className="text-xs font-black uppercase tracking-widest opacity-50">Payment Progress</p>
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

            <div className="grid grid-cols-2 gap-6">
               <div className="p-6 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-md">
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-1">Total Fee</p>
                  <p className="text-xl font-black">₹{fee.final_fee.toLocaleString()}</p>
               </div>
               <div className="p-6 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-md">
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-1">Total Paid</p>
                  <p className="text-xl font-black">₹{totalPaid.toLocaleString()}</p>
               </div>
               <div className="p-6 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-md col-span-2 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Course Enrolled</p>
                    <p className="text-lg font-black">{fee.courses?.title}</p>
                  </div>
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                    <Wallet size={24} className="text-indigo-400" />
                  </div>
               </div>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Installments Table */}
         <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
               <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                 <Calendar className="text-indigo-600" /> Installment Roadmap
               </h3>
               <div className="px-3 py-1 bg-slate-50 rounded-lg text-[10px] font-black text-slate-400 uppercase tracking-widest">
                 {fee.installments?.length || 0} Scheduled
               </div>
            </div>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
               <table className="w-full text-left">
                  <thead>
                     <tr className="bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <th className="px-8 py-4">Status</th>
                        <th className="px-8 py-4">Amount</th>
                        <th className="px-8 py-4">Due Date</th>
                        <th className="px-8 py-4 text-right">Remarks</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                     {fee.installments?.map((inst: any) => (
                        <tr key={inst.id} className="hover:bg-slate-50/50 transition-colors">
                           <td className="px-8 py-5">
                              <div className={`flex items-center gap-2 text-[10px] font-black uppercase ${inst.status === 'paid' ? 'text-emerald-600' : 'text-rose-500 animate-pulse'}`}>
                                 {inst.status === 'paid' ? <CheckCircle2 size={12}/> : <Clock size={12}/>}
                                 {inst.status}
                              </div>
                           </td>
                           <td className="px-8 py-5 text-sm font-black text-slate-900">₹{inst.amount}</td>
                           <td className="px-8 py-5 text-xs font-bold text-slate-500">{new Date(inst.due_date).toLocaleDateString()}</td>
                           <td className="px-8 py-5 text-right">
                              <span className="text-[10px] font-bold text-slate-300 italic">
                                 {inst.status === 'paid' ? 'Receipt Generated' : 'Pending Action'}
                              </span>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-slate-50">
               {fee.installments?.map((inst: any) => (
                  <div key={inst.id} className="p-6 space-y-3">
                     <div className="flex justify-between items-start">
                        <div className={`flex items-center gap-2 text-[9px] font-black uppercase ${inst.status === 'paid' ? 'text-emerald-600' : 'text-rose-500 animate-pulse'}`}>
                           {inst.status === 'paid' ? <CheckCircle2 size={12}/> : <Clock size={12}/>}
                           {inst.status}
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">
                           {new Date(inst.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                     </div>
                     <div className="flex justify-between items-end">
                        <p className="text-xl font-black text-slate-900">₹{inst.amount}</p>
                        <span className="text-[9px] font-bold text-slate-300 italic uppercase tracking-wider">
                           {inst.status === 'paid' ? 'Receipt Generated' : 'Pending Action'}
                        </span>
                     </div>
                  </div>
               ))}
            </div>
         </div>

         {/* Transaction History */}
         <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 space-y-6">
            <div className="flex items-center justify-between">
               <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                 <History className="text-indigo-600" /> History
               </h3>
               <History size={18} className="text-slate-200" />
            </div>
            
            <div className="space-y-4">
               {fee.payments?.length === 0 ? (
                 <div className="py-12 text-center text-slate-300 text-xs font-bold bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                    No transactions yet
                 </div>
               ) : (
                 fee.payments.map((pay: any) => (
                   <div key={pay.id} className="group p-5 rounded-3xl bg-slate-50 hover:bg-white hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 border border-transparent hover:border-slate-100">
                      <div className="flex items-start justify-between mb-3">
                         <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm group-hover:scale-110 transition-transform">
                            <IndianRupee size={18}/>
                         </div>
                         <button className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-white rounded-lg transition-all" title="Download Receipt">
                            <Download size={16}/>
                         </button>
                      </div>
                      <div className="space-y-1">
                         <p className="text-lg font-black text-slate-900">₹{pay.amount}</p>
                         <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{pay.payment_mode}</span>
                            <span className="text-[10px] font-bold text-slate-400">{new Date(pay.payment_date).toLocaleDateString()}</span>
                         </div>
                         <p className="text-[9px] font-mono text-slate-300 pt-2 border-t border-slate-200/50 mt-2 truncate">TXN: {pay.transaction_id || 'ID-PLACEHOLDER'}</p>
                      </div>
                   </div>
                 ))
               )}
            </div>

            <div className="p-4 bg-slate-50 rounded-3xl border border-slate-100">
               <p className="text-[10px] font-black text-slate-400 uppercase text-center tracking-[0.2em]">End of Records</p>
            </div>
         </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: any = { 
    paid: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20", 
    partial: "text-amber-400 bg-amber-400/10 border-amber-400/20", 
    due: "text-rose-400 bg-rose-400/10 border-rose-400/20" 
  };
  const labels: any = { paid: "PAID", partial: "PARTIAL", due: "DUE" };
  return (
    <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full border backdrop-blur-md ${styles[status]}`}>
      ● {labels[status]}
    </span>
  );
}

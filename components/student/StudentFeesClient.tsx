"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { getOfflineData, saveOfflineData, OFFLINE_KEYS } from "@/lib/offline-store";
import { 
  Home,
  ChevronRight,
  Wallet, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  IndianRupee,
  Receipt,
  Calendar,
  History,
  Download,
  ShieldCheck,
  AlertTriangle,
  Search,
  Filter,
  CreditCard,
  Building,
  Phone,
  FileCheck2,
  CalendarCheck
} from "lucide-react";

export function StudentFeesClient({ fee: initialFee }: { fee: any }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMode, setFilterMode] = useState("all");

  // Safe offline hydration inside useEffect to prevent React 19 hydration mismatch
  const [fee, setFee] = useState<any>(initialFee || null);

  useEffect(() => {
    if (initialFee) {
      setFee(initialFee);
      saveOfflineData(OFFLINE_KEYS.FEES, initialFee);
    } else {
      const cached = getOfflineData<any>(OFFLINE_KEYS.FEES);
      if (cached) {
        setFee(cached);
      }
    }
  }, [initialFee]);

  const totalPaid = useMemo(() => {
    if (!fee) return 0;
    return fee.payments?.reduce((acc: number, p: any) => acc + Number(p.amount), 0) || 0;
  }, [fee]);

  const finalFee = Number(fee?.final_fee || 0);
  const baseFee = Number(fee?.total_fee || finalFee);
  const discountAmount = Number(fee?.discount || 0);
  const balance = Math.max(0, finalFee - totalPaid);
  const progress = finalFee > 0 ? Math.min((totalPaid / finalFee) * 100, 100) : 0;
  
  const overdueInstallment = useMemo(() => {
    if (!fee) return null;
    return fee.installments?.find(
      (i: any) => i.status === 'overdue' || (i.status === 'pending' && new Date(i.due_date) < new Date())
    );
  }, [fee]);

  // Filter payments by search query and mode
  const filteredPayments = useMemo(() => {
    if (!fee) return [];
    return (fee.payments || []).filter((pay: any) => {
      if (filterMode !== "all" && pay.payment_mode?.toLowerCase() !== filterMode.toLowerCase()) {
        return false;
      }
      
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

  const handleDownloadReceipt = (pay: any) => {
    const printWindow = window.open("", "_blank", "width=800,height=700");
    if (!printWindow) {
      alert("Please allow popups to download/print receipts.");
      return;
    }

    const receiptHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt_${pay.transaction_id || pay.id || 'payment'}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
          body {
            font-family: 'Inter', sans-serif;
            color: #1e293b;
            margin: 0;
            padding: 40px;
            background-color: #ffffff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .receipt-container {
            max-width: 600px;
            margin: 0 auto;
            border: 1px solid #e2e8f0;
            padding: 40px;
            border-radius: 24px;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05);
          }
          .header {
            display: flex;
            align-items: center;
            border-bottom: 2px dashed #e2e8f0;
            padding-bottom: 24px;
            margin-bottom: 24px;
            gap: 20px;
          }
          .logo-img {
            width: 70px;
            height: 70px;
            object-fit: contain;
          }
          .header-text {
            flex: 1;
            text-align: center;
            margin-right: 70px;
          }
          .logo {
            font-size: 20px;
            font-weight: 900;
            color: #000000;
            letter-spacing: -0.02em;
            margin: 0;
            line-height: 1.2;
          }
          .address {
            font-size: 11px;
            color: #64748b;
            margin-top: 4px;
          }
          .subtitle {
            font-size: 10px;
            font-weight: 700;
            color: #4f46e5;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            margin-top: 2px;
          }
          .receipt-title {
            text-align: center;
            font-size: 16px;
            font-weight: 900;
            color: #0f172a;
            margin-bottom: 20px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          .meta-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin-bottom: 24px;
            background: #f8fafc;
            padding: 16px;
            border-radius: 16px;
            border: 1px solid #f1f5f9;
          }
          .meta-item {
            display: flex;
            flex-direction: column;
          }
          .meta-label {
            font-size: 10px;
            font-weight: 700;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 2px;
          }
          .meta-value {
            font-size: 13px;
            font-weight: 700;
            color: #1e293b;
          }
          .section-title {
            font-size: 12px;
            font-weight: 800;
            color: #475569;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 12px;
          }
          .details-list {
            margin-bottom: 24px;
          }
          .details-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #f1f5f9;
            font-size: 13px;
            color: #334155;
          }
          .details-row.total {
            border-top: 2px solid #e2e8f0;
            border-bottom: 2px solid #e2e8f0;
            padding: 14px 0;
            font-size: 16px;
            font-weight: 900;
            color: #0f172a;
            margin-top: 8px;
          }
          .footer {
            text-align: center;
            font-size: 11px;
            color: #94a3b8;
            margin-top: 30px;
            line-height: 1.5;
          }
          @media print {
            body {
              padding: 0;
            }
            .receipt-container {
              border: none;
              box-shadow: none;
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          <div class="header">
            <img src="${window.location.origin}/logo.png" alt="Logo" class="logo-img" />
            <div class="header-text">
              <div class="logo">VISION IT COMPUTER INSTITUTE</div>
              <div class="address">Kadampara Chowk, Pratappur, Surajpur (C.G.) - 497223</div>
              <div class="subtitle">Center for Excellence & Learning</div>
            </div>
          </div>
          <div class="receipt-title">Official Payment Receipt</div>
          
          <div class="meta-grid">
            <div class="meta-item">
              <span class="meta-label">Student Name</span>
              <span class="meta-value">${fee.students?.name || 'N/A'}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Student ID</span>
              <span class="meta-value">${fee.students?.student_id || 'N/A'}</span>
            </div>
            <div class="meta-item" style="grid-column: span 2;">
              <span class="meta-label">Course Enrolled</span>
              <span class="meta-value">${fee.courses?.title || 'N/A'}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Payment Date</span>
              <span class="meta-value">${pay.payment_date ? new Date(pay.payment_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : 'N/A'}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Payment Mode</span>
              <span class="meta-value" style="text-transform: uppercase;">${pay.payment_mode || 'N/A'}</span>
            </div>
            ${pay.transaction_id ? `
            <div class="meta-item" style="grid-column: span 2;">
              <span class="meta-label">Transaction ID / Reference</span>
              <span class="meta-value" style="font-family: monospace;">${pay.transaction_id}</span>
            </div>` : ''}
          </div>
          
          <div class="section-title">Fee Breakdown</div>
          <div class="details-list">
            ${Number(pay.registration_fee) > 0 ? `
            <div class="details-row">
              <span>Registration Fee (One-Time)</span>
              <span>₹${Number(pay.registration_fee).toLocaleString('en-IN')}</span>
            </div>` : ''}
            ${Number(pay.course_fee) > 0 ? `
            <div class="details-row">
              <span>Course Fee</span>
              <span>₹${Number(pay.course_fee).toLocaleString('en-IN')}</span>
            </div>` : ''}
            ${Number(pay.exam_fee) > 0 ? `
            <div class="details-row">
              <span>Examination Fee (One-Time)</span>
              <span>₹${Number(pay.exam_fee).toLocaleString('en-IN')}</span>
            </div>` : ''}
            
            ${(!pay.registration_fee && !pay.course_fee && !pay.exam_fee) ? `
            <div class="details-row">
              <span>Course Fee Payment</span>
              <span>₹${Number(pay.amount).toLocaleString('en-IN')}</span>
            </div>` : ''}

            <div class="details-row total">
              <span>Total Amount Paid</span>
              <span>₹${Number(pay.amount).toLocaleString('en-IN')}</span>
            </div>
          </div>
          
          <div class="footer">
            Thank you for your payment!<br>
            This is a computer generated receipt from Vision Learn LMS. No signature required.
          </div>
        </div>
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() {
              window.close();
            }, 500);
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(receiptHtml);
    printWindow.document.close();
  };

  if (!fee) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 sm:p-12 text-center bg-white rounded-3xl border border-slate-200/80 shadow-2xs">
        <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-100">
          <Wallet size={28} />
        </div>
        <h3 className="text-lg font-bold text-slate-900 tracking-tight">Financial Records Pending</h3>
        <p className="text-xs text-slate-500 font-medium mt-1">Your course fee structure hasn't been configured by the institute admin yet. Please check back later or contact the accounts office.</p>
      </div>
    );
  }

  const statusLabel = (fee.status || "partial").toUpperCase();
  const isPaid = statusLabel === "PAID" || balance <= 0;
  const isPartial = statusLabel === "PARTIAL" || (balance > 0 && totalPaid > 0);

  return (
    <div className="space-y-3.5 sm:space-y-4 animate-in fade-in duration-300 pb-20 md:pb-12">
      {/* 1. Breadcrumb navigation */}
      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
        <Link href="/dashboard" className="hover:text-slate-800 flex items-center gap-1">
          <Home size={13} className="text-slate-400" />
          <span>Dashboard</span>
        </Link>
        <ChevronRight size={12} className="text-slate-400" />
        <Link href="/curriculum" className="hover:text-slate-800 truncate max-w-[140px] sm:max-w-none">
          <span>{fee.courses?.title || "My Course"}</span>
        </Link>
        <ChevronRight size={12} className="text-slate-400" />
        <span className="text-slate-800 font-semibold">Fees & Billing</span>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4 items-start">
        
        {/* Left Column (8 of 12 cols): Banner + 4 Metric Cards + Fee Details + Roadmap + Transactions */}
        <div className="lg:col-span-8 space-y-3.5 sm:space-y-4">
          
          {/* 2. Hero Banner */}
          <div className="bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-slate-50/40 rounded-2xl border border-indigo-100/70 p-4 sm:p-5 flex items-center justify-between gap-4 relative overflow-hidden shadow-2xs">
            <div className="flex items-center gap-3 sm:gap-3.5 z-10 min-w-0">
              <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-indigo-100/90 border border-indigo-200/80 text-indigo-600 flex items-center justify-center shrink-0 shadow-2xs">
                <CreditCard size={22} className="stroke-[1.9]" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-xl font-bold text-slate-900 leading-tight">
                  Fees & Billing Ledger
                </h1>
                <p className="text-xs text-slate-500 mt-0.5 font-normal truncate">
                  Course: <span className="font-semibold text-slate-700">{fee.courses?.title || "Course"}</span> • Student: <span className="font-semibold text-slate-700">{fee.students?.name || "Student"}</span>
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] text-slate-600 font-medium">
                  <span className="inline-flex items-center gap-1 bg-white/70 px-2 py-0.5 rounded-md border border-indigo-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                    Real DB Billing
                  </span>
                  <span className="inline-flex items-center gap-1 bg-white/70 px-2 py-0.5 rounded-md border border-indigo-100">
                    <ShieldCheck size={11} className="text-emerald-600" />
                    Encrypted Ledger
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border font-semibold text-[10px] ${
                    isPaid ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    isPartial ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    'bg-rose-50 text-rose-700 border-rose-200'
                  }`}>
                    ● {statusLabel}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Graphic */}
            <div className="hidden sm:flex items-center pr-2 shrink-0 opacity-90">
              <div className="w-12 h-12 rounded-2xl bg-white/80 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs">
                <Receipt size={24} />
              </div>
            </div>
          </div>

          {/* Overdue Installment Warning Alert */}
          {overdueInstallment && (
            <div className="p-3.5 sm:p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 animate-in fade-in shadow-2xs">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-rose-500 text-white rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                <AlertTriangle size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-bold text-rose-900 leading-tight">Payment Overdue</p>
                <p className="text-[11px] sm:text-xs text-rose-700 mt-0.5 font-medium leading-relaxed">
                  An installment of <span className="font-bold">₹{Number(overdueInstallment.amount).toLocaleString('en-IN')}</span> was due on {new Date(overdueInstallment.due_date).toLocaleDateString('en-IN')}. Please settle at the accounts office.
                </p>
              </div>
            </div>
          )}

          {/* 3. Top 4 Metric Cards (2x2 on mobile, 4 in row on tablet/desktop) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            
            {/* Card 1: Final Total Fee */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-3.5 shadow-2xs flex items-center gap-2.5 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                <Receipt size={17} className="stroke-[1.9]" />
              </div>
              <div className="min-w-0">
                <div className="text-base sm:text-lg font-bold text-slate-900 leading-none">
                  ₹{finalFee.toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] sm:text-xs font-semibold text-slate-700 mt-1 truncate">Total Course Fee</div>
                <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                  {discountAmount > 0 ? `Save ₹${discountAmount.toLocaleString('en-IN')}` : 'Payable'}
                </div>
              </div>
            </div>

            {/* Card 2: Total Paid */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-3.5 shadow-2xs flex items-center gap-2.5 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
                <CheckCircle2 size={17} className="stroke-[1.9]" />
              </div>
              <div className="min-w-0">
                <div className="text-base sm:text-lg font-bold text-slate-900 leading-none">
                  ₹{totalPaid.toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] sm:text-xs font-semibold text-slate-700 mt-1 truncate">Total Paid</div>
                <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                  {fee.payments?.length || 0} payment{fee.payments?.length === 1 ? '' : 's'} logged
                </div>
              </div>
            </div>

            {/* Card 3: Remaining Balance */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-3.5 shadow-2xs flex items-center gap-2.5 sm:gap-3">
              <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl border flex items-center justify-center shrink-0 ${
                balance === 0 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
              }`}>
                <Clock size={17} className="stroke-[1.9]" />
              </div>
              <div className="min-w-0">
                <div className="text-base sm:text-lg font-bold text-slate-900 leading-none">
                  ₹{balance.toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] sm:text-xs font-semibold text-slate-700 mt-1 truncate">Current Balance</div>
                <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                  {balance === 0 ? 'No dues pending' : 'Pending payment'}
                </div>
              </div>
            </div>

            {/* Card 4: Settlement Rate Gauge */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-3.5 shadow-2xs flex items-center gap-2.5 sm:gap-3">
              <div className="relative w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-100"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className={isPaid ? "text-emerald-500" : "text-indigo-600"}
                    strokeDasharray={`${progress.toFixed(0)}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute text-[10px] font-bold text-slate-800">
                  {progress.toFixed(0)}%
                </span>
              </div>
              <div className="min-w-0">
                <div className="text-base sm:text-lg font-bold text-slate-900 leading-none">
                  {progress.toFixed(0)}%
                </div>
                <div className="text-[11px] sm:text-xs font-semibold text-slate-700 mt-1 truncate">Paid Rate</div>
                <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                  {isPaid ? 'Fully cleared' : 'In installments'}
                </div>
              </div>
            </div>

          </div>

          {/* 4. Payment Progress Bar & Fee Breakdown Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <IndianRupee size={16} className="text-indigo-600" />
                  <span>Fee Settlement Progress</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Track your total cleared vs remaining course payments
                </p>
              </div>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                {progress.toFixed(0)}% Paid
              </span>
            </div>

            {/* Linear Progress Bar */}
            <div className="space-y-1.5">
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5">
                <div 
                  className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-700" 
                  style={{ width: `${progress}%` }} 
                />
              </div>
              <div className="flex justify-between items-center text-[11px] text-slate-500 font-medium">
                <span>Paid: ₹{totalPaid.toLocaleString('en-IN')}</span>
                <span>Balance: ₹{balance.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Quick Breakdown Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-center">
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Base Fee</p>
                <p className="text-xs font-bold text-slate-700 mt-0.5">₹{baseFee.toLocaleString('en-IN')}</p>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Discount</p>
                <p className="text-xs font-bold text-emerald-600 mt-0.5">-₹{discountAmount.toLocaleString('en-IN')}</p>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Net Payable</p>
                <p className="text-xs font-bold text-slate-900 mt-0.5">₹{finalFee.toLocaleString('en-IN')}</p>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Paid Total</p>
                <p className="text-xs font-bold text-indigo-600 mt-0.5">₹{totalPaid.toLocaleString('en-IN')}</p>
              </div>
            </div>
          </div>

          {/* 5. Installment Roadmap Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="text-indigo-600" size={17} /> 
                <span>Installment Roadmap</span>
              </h3>
              <div className="px-2.5 py-1 bg-slate-50 border border-slate-200/80 rounded-lg text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                {fee.installments?.length || 0} Installments
              </div>
            </div>

            {/* Vertical Timeline / Direct Scheme Notice */}
            {!fee.installments || fee.installments.length === 0 ? (
              <div className="py-6 px-4 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200 text-center space-y-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center mx-auto">
                  <CalendarCheck size={20} />
                </div>
                <h4 className="text-xs font-bold text-slate-800">Direct Payment Scheme Active</h4>
                <p className="text-[11px] text-slate-500 max-w-md mx-auto leading-relaxed">
                  No strict monthly schedule was enforced for your enrollment. All payments are recorded upon receipt at the institute accounts desk. View all generated receipts below.
                </p>
              </div>
            ) : (
              <div className="space-y-4 relative">
                {fee.installments.map((inst: any, idx: number) => {
                  const isInstPaid = inst.status === 'paid';
                  const isInstOverdue = inst.status === 'overdue' || (inst.status === 'pending' && new Date(inst.due_date) < new Date());
                  return (
                    <div key={inst.id} className="relative flex gap-3.5 sm:gap-4 pb-4 last:pb-0 group">
                      {idx !== fee.installments.length - 1 && (
                        <div className={`absolute left-4 top-8 bottom-0 w-[2px] ${isInstPaid ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                      )}
                      
                      {/* Timeline Node */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 shrink-0 border-2 transition-all ${
                        isInstPaid ? 'bg-emerald-500 border-emerald-500 text-white' :
                        isInstOverdue ? 'bg-rose-50 border-rose-500 text-rose-500' :
                        'bg-white border-slate-300 text-slate-400 group-hover:border-indigo-500 group-hover:text-indigo-500'
                      }`}>
                        {isInstPaid ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                      </div>

                      {/* Content Card */}
                      <div className={`flex-1 p-3.5 sm:p-4 rounded-xl border transition-all ${
                        isInstPaid ? 'bg-emerald-50/20 border-emerald-100 hover:bg-emerald-50/30' :
                        isInstOverdue ? 'bg-rose-50/30 border-rose-100 hover:bg-rose-50/40' :
                        'bg-slate-50/60 border-slate-200/70 hover:bg-white hover:shadow-2xs'
                      }`}>
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Installment #{idx + 1}</p>
                            <p className="text-base font-bold text-slate-900 mt-0.5">₹{Number(inst.amount).toLocaleString('en-IN')}</p>
                          </div>
                          <div className="sm:text-right">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border inline-block ${
                              isInstPaid ? 'text-emerald-700 bg-emerald-50 border-emerald-200' :
                              isInstOverdue ? 'text-rose-700 bg-rose-50 border-rose-200' :
                              'text-slate-600 bg-slate-100 border-slate-200'
                            }`}>
                              {isInstPaid ? 'Paid' : isInstOverdue ? 'Overdue' : 'Upcoming'}
                            </span>
                            <p className="text-[10px] text-slate-400 mt-1">
                              Due: {new Date(inst.due_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 6. Transaction History & Receipts Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <History className="text-indigo-600" size={17} /> 
                <span>Transactions & Receipts</span>
              </h3>
              <span className="text-[11px] font-semibold text-slate-500">
                {filteredPayments.length} of {fee.payments?.length || 0} records
              </span>
            </div>

            {/* Filter and Search Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Search size={14} />
                </div>
                <input 
                  type="text" 
                  placeholder="Search by amount, mode, txn ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs text-slate-800 placeholder-slate-400"
                />
              </div>
              
              <div className="relative">
                <select
                  value={filterMode}
                  onChange={(e) => setFilterMode(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/80 focus:bg-white focus:outline-none text-xs font-semibold text-slate-700 cursor-pointer"
                >
                  <option value="all">All Payment Modes</option>
                  <option value="upi">UPI / Online</option>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="transfer">Bank Transfer</option>
                </select>
              </div>
            </div>

            {/* Transaction Items */}
            <div className="space-y-3">
              {filteredPayments.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs font-medium bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  No transaction records found matching your filter.
                </div>
              ) : (
                filteredPayments.map((pay: any) => (
                  <div 
                    key={pay.id} 
                    className="p-3.5 sm:p-4 rounded-xl bg-slate-50/60 hover:bg-white border border-slate-200/70 hover:border-slate-300 transition-all shadow-2xs hover:shadow-xs space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
                          <IndianRupee size={17} />
                        </div>
                        <div>
                          <div className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                            ₹{Number(pay.amount).toLocaleString('en-IN')}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {pay.payment_date ? new Date(pay.payment_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : "Payment Date N/A"}
                          </div>
                        </div>
                      </div>

                      <button 
                        onClick={() => handleDownloadReceipt(pay)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 active:scale-95 text-indigo-700 text-xs font-semibold border border-indigo-200/70 transition-all cursor-pointer shadow-2xs shrink-0" 
                        title="Download / Print Receipt"
                      >
                        <Download size={13} />
                        <span className="hidden sm:inline">Download Receipt</span>
                        <span className="sm:hidden">Receipt</span>
                      </button>
                    </div>

                    {/* Breakdown Chips */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {Number(pay.registration_fee) > 0 && (
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md">
                          Registration: ₹{Number(pay.registration_fee).toLocaleString('en-IN')}
                        </span>
                      )}
                      {Number(pay.course_fee) > 0 && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md">
                          Course Fee: ₹{Number(pay.course_fee).toLocaleString('en-IN')}
                        </span>
                      )}
                      {Number(pay.exam_fee) > 0 && (
                        <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-md">
                          Exam Fee: ₹{Number(pay.exam_fee).toLocaleString('en-IN')}
                        </span>
                      )}
                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md uppercase">
                        Mode: {pay.payment_mode || 'Cash'}
                      </span>
                    </div>

                    {pay.transaction_id && (
                      <p className="text-[10px] font-mono text-slate-400 pt-1.5 border-t border-slate-100 truncate">
                        TXN: {pay.transaction_id}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Right Column (4 of 12 cols): Financial Summary + Accounts Desk + Security Verification */}
        <div className="lg:col-span-4 space-y-3.5 sm:space-y-4">
          
          {/* Right Card 1: Student & Enrollment Summary */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <FileCheck2 size={14} className="text-indigo-600" />
              <span>Enrollment Details</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase">Student Name</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{fee.students?.name || "Student"}</p>
              </div>

              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase">Roll / Student ID</p>
                <p className="text-xs font-mono font-bold text-slate-800 mt-0.5">{fee.students?.student_id || "N/A"}</p>
              </div>

              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase">Enrolled Course</p>
                <p className="text-xs font-bold text-slate-800 mt-0.5 leading-snug">{fee.courses?.title || "My Course"}</p>
              </div>

              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase">Ledger Status</p>
                <span className={`inline-block text-[10px] font-bold uppercase px-2.5 py-1 rounded-md border mt-1 ${
                  isPaid ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  isPartial ? 'bg-amber-50 text-amber-700 border-amber-200' :
                  'bg-rose-50 text-rose-700 border-rose-200'
                }`}>
                  ● {statusLabel}
                </span>
              </div>
            </div>
          </div>

          {/* Right Card 2: Accounts Office & Payment Assistance */}
          <div className="bg-gradient-to-br from-indigo-50/60 to-blue-50/40 rounded-2xl border border-indigo-100 p-4 sm:p-5 shadow-2xs space-y-3">
            <div className="w-9 h-9 rounded-xl bg-white text-indigo-600 border border-indigo-100 flex items-center justify-center shadow-2xs">
              <Building size={17} />
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-900">Institute Accounts Office</h4>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                For fee receipts, installment extensions, or UPI verification issues, visit the admin desk:
              </p>
            </div>

            <div className="space-y-1.5 text-[11px] text-slate-600 font-medium">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                <span>Mon – Sat: 9:00 AM – 5:00 PM</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                <span>Kadampara Chowk, Pratappur</span>
              </div>
            </div>
          </div>

          {/* Right Card 3: Security & Verification Seal */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 shadow-2xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
              <ShieldCheck size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Verified LMS Ledger</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Transactions synchronized with central database</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

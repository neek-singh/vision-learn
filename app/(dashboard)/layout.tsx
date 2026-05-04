"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { 
  LayoutDashboard, 
  BookOpen, 
  FileText, 
  PenTool, 
  User, 
  LogOut, 
  Menu, 
  X,
  Bell,
  Calendar,
  CheckCircle2,
  Wallet
} from "lucide-react";

const sidebarLinks = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "My Classes", href: "/curriculum", icon: BookOpen },
  { name: "My Courses", href: "/courses", icon: BookOpen },
  { name: "Tests", href: "/tests", icon: FileText },
  { name: "Notes & Materials", href: "/materials", icon: FileText },
  { name: "Assignments", href: "/assignments", icon: PenTool },
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Attendance", href: "/attendance", icon: CheckCircle2 },
  { name: "Notifications", href: "/notifications", icon: Bell },
  { name: "My Fees", href: "/fees", icon: Wallet },
  { name: "Profile", href: "/profile", icon: User },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [student, setStudent] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const res = await fetch("/api/auth/profile");
        if (res.ok) {
          const studentData = await res.json();
          setStudent(studentData);
          
          // 3. Fetch unread count (using the ID from the profile API)
          const { count } = await supabase
            .from("user_notifications")
            .select("*", { count: "exact", head: true })
            .eq("user_id", studentData.id)
            .eq("is_read", false);
          setUnreadCount(count || 0);
        }
      } catch (err) {
        console.error("Error fetching student profile:", err);
      }
    };

    fetchStudentData();
  }, [pathname, supabase]);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-slate-100 flex-col sticky top-0 h-screen">
        <div className="p-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-9 h-9 relative flex items-center justify-center">
              <Image 
                src="https://res.cloudinary.com/ddiooxxks/image/upload/f_auto,q_auto/logo_unnut8.png" 
                alt="Vision IT Logo" 
                width={36} 
                height={36} 
                className="object-contain"
                priority
              />
            </div>
            <span className="text-lg font-black text-slate-900 tracking-tight">Vision Learn</span>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-1">
          {sidebarLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? "bg-indigo-50 text-indigo-700 font-bold" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon size={18} className={isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"} />
                <span className="text-sm flex-1">{link.name}</span>
                {link.name === "Notifications" && unreadCount > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-50">
          <form action="/api/logout" method="POST">
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-50 transition-all font-bold group text-sm"
            >
              <LogOut size={18} className="text-red-400 group-hover:text-red-500" />
              Logout
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Mobile */}
      <aside className={`fixed inset-y-0 left-0 w-72 bg-white z-50 transform transition-transform duration-300 lg:hidden flex flex-col ${
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="p-8 flex justify-between items-center shrink-0">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-12 h-12 relative flex items-center justify-center">
              <Image 
                src="https://res.cloudinary.com/ddiooxxks/image/upload/f_auto,q_auto/logo_unnut8.png" 
                alt="Vision IT Logo" 
                width={44} 
                height={44} 
                className="object-contain"
                priority
              />
            </div>
            <span className="text-xl font-black text-slate-900">Vision Learn</span>
          </Link>
          <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-slate-400 hover:text-slate-900">
            <X size={24} />
          </button>
        </div>
        <nav className="px-4 space-y-2 flex-1 overflow-y-auto custom-scrollbar pb-4">
          {sidebarLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all ${
                  isActive 
                    ? "bg-indigo-50 text-indigo-700 font-bold" 
                    : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                <Icon size={20} />
                {link.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-50 shrink-0">
          <form action="/api/logout" method="POST">
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-red-500 hover:bg-red-50 transition-all font-bold group text-base"
            >
              <LogOut size={20} className="text-red-400 group-hover:text-red-500" />
              Logout
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 lg:px-8 sticky top-0 z-30">
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 -ml-2 text-slate-400 hover:text-slate-900 lg:hidden"
          >
            <Menu size={20} />
          </button>

          <div className="hidden lg:block">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Portal</h2>
          </div>

          <div className="flex items-center gap-3">
            <button className="p-2 text-slate-400 hover:text-slate-900 relative">
              <Bell size={18} />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-indigo-500 rounded-full border-2 border-white" />
            </button>
            
            <div className="h-6 w-[1px] bg-slate-100 mx-1" />
            
            <div className="flex items-center gap-2">
              <Link href="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-black text-slate-900 leading-none mb-0.5">{student?.name || "Loading..."}</p>
                  <p className="text-[9px] font-bold text-indigo-600 uppercase tracking-wider">Active Learner</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">
                  {student?.photo_url ? (
                    <img src={student.photo_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User size={16} className="text-slate-400" />
                  )}
                </div>
              </Link>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-6 max-w-7xl">
          {children}
        </main>
      </div>
    </div>
  );
}

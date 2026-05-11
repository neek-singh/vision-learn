"use client";

import { useEffect, useState, useCallback, memo } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
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
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { SyncStatus } from "@/components/SyncStatus";

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

const NavLink = memo(({ href, icon: Icon, name, isActive, unreadCount, onClick }: any) => (
  <Link
    href={href}
    prefetch={true}
    onClick={onClick}
    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group active:scale-95 ${
      isActive 
        ? "bg-indigo-50 text-indigo-700 font-bold" 
        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
    }`}
  >
    <Icon size={18} className={isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"} />
    <span className="text-sm flex-1">{name}</span>
    {name === "Notifications" && unreadCount > 0 && (
      <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
        {unreadCount}
      </span>
    )}
  </Link>
));

const MobileBottomLink = memo(({ href, icon: Icon, name, isActive }: any) => (
  <Link 
    href={href} 
    prefetch={true}
    className={`flex flex-col items-center gap-1 p-2 min-w-[64px] transition-all active:scale-90 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}
  >
    <Icon size={20} />
    <span className="text-[10px] font-bold">{name}</span>
  </Link>
));

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [student, setStudent] = useState<any>(null);
  const supabase = createClient();
  const { permission, requestPermission } = usePushNotifications(student?.id);

  // Auto-request permission on first login if not denied
  useEffect(() => {
    if (student?.id && permission === 'default') {
      requestPermission();
    }
  }, [student, permission, requestPermission]);

  useEffect(() => {
    let channel: any;

    const fetchStudentData = async () => {
      try {
        const res = await fetch("/api/auth/profile");
        if (res.ok) {
          const studentData = await res.json();
          setStudent(studentData);
          
          const { count } = await supabase
            .from("user_notifications")
            .select("*", { count: "exact", head: true })
            .eq("user_id", studentData.id)
            .eq("is_read", false);
          setUnreadCount(count || 0);

          // Use a SINGLE channel for all changes to reduce overhead
          const channelId = `vision_realtime_${studentData.id}`;
          channel = supabase
            .channel(channelId)
            .on(
              'postgres_changes',
              { event: '*', schema: 'public', table: 'user_notifications', filter: `user_id=eq.${studentData.id}` },
              async () => {
                const { count: newCount } = await supabase
                  .from("user_notifications")
                  .select("*", { count: "exact", head: true })
                  .eq("user_id", studentData.id)
                  .eq("is_read", false);
                setUnreadCount(newCount || 0);
              }
            )
            .on('postgres_changes', { event: '*', schema: 'public', table: 'materials' }, () => router.refresh())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tests' }, () => router.refresh())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'assignments' }, () => router.refresh())
            .subscribe();
        }
      } catch (err) {
        console.error("Error fetching student profile:", err);
      }
    };

    fetchStudentData();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [supabase]);

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
          {sidebarLinks.map((link) => (
            <NavLink 
              key={link.href} 
              {...link} 
              isActive={pathname === link.href} 
              unreadCount={unreadCount} 
            />
          ))}
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
          <button 
            onClick={() => setIsMobileMenuOpen(false)} 
            aria-label="Close mobile menu"
            className="p-2 text-slate-400 hover:text-slate-900"
          >
            <X size={24} />
          </button>
        </div>
        <nav className="px-4 space-y-2 flex-1 overflow-y-auto custom-scrollbar pb-4">
          {sidebarLinks.map((link) => (
            <NavLink 
              key={link.href} 
              {...link} 
              isActive={pathname === link.href} 
              unreadCount={unreadCount} 
              onClick={() => setIsMobileMenuOpen(false)}
            />
          ))}
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
            aria-label="Open mobile menu"
            className="p-2 -ml-2 text-slate-400 hover:text-slate-900 lg:hidden"
          >
            <Menu size={20} />
          </button>

          <div className="hidden lg:block">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Portal</h2>
          </div>

          <div className="flex items-center gap-3">
            <SyncStatus />
            <div className="h-6 w-[1px] bg-slate-100 mx-1 hidden sm:block" />
            <Link 
              href="/notifications"
              aria-label={`View notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
              className="p-2 text-slate-400 hover:text-slate-900 relative"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-rose-500 rounded-full border-2 border-white" />
              )}
            </Link>
            
            <div className="h-6 w-[1px] bg-slate-100 mx-1" />
            
            <div className="flex items-center gap-2">
              <Link href="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-black text-slate-900 leading-none">{student?.name || "Loading..."}</p>
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

        <main className="p-4 lg:p-6 max-w-7xl pb-24 lg:pb-6">
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        {!isMobileMenuOpen && (
          <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-4 py-2 z-50 flex items-center justify-around shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.05)] animate-in slide-in-from-bottom duration-300">
          <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-4 py-2 z-50 flex items-center justify-around shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.05)] animate-in slide-in-from-bottom duration-300">
            <MobileBottomLink href="/dashboard" icon={LayoutDashboard} name="Home" isActive={pathname === '/dashboard'} />
            <MobileBottomLink href="/curriculum" icon={BookOpen} name="Classes" isActive={pathname === '/curriculum'} />
            <MobileBottomLink href="/materials" icon={FileText} name="Notes" isActive={pathname === '/materials'} />
            <MobileBottomLink href="/tests" icon={PenTool} name="Tests" isActive={pathname === '/tests'} />
          </nav>
          </nav>
        )}
      </div>
    </div>
  );
}

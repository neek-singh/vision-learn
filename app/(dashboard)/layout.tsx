"use client";

import { useEffect, useState, useCallback, memo, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import packageJson from "@/package.json";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
  Wallet,
  Plus,
  ListOrdered,
  LayoutList,
  Award,
  UserCheck,
  SlidersHorizontal,
  ShieldCheck,
  Globe,
  ChevronLeft
} from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { SyncStatus } from "@/components/SyncStatus";
import { GlobalSearch } from "@/components/GlobalSearch";
import { getOfflineData, saveOfflineData, OFFLINE_KEYS } from "@/lib/offline-store";

const sidebarLinks = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "My Courses", href: "/courses", icon: BookOpen },
  { name: "Tests", href: "/tests", icon: FileText },
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Attendance", href: "/attendance", icon: CheckCircle2 },
  { name: "Certificates", href: "/certificates", icon: Award },
  { name: "My Fees", href: "/fees", icon: Wallet },
  { name: "Profile", href: "/settings", icon: User },
];

const NavLink = memo(({
  href,
  icon: Icon,
  name,
  isActive,
  unreadCount,
  onClick,
  hasSubmenu,
  isSubmenuOpen,
  onToggleSubmenu
}: any) => (
  <div
    className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 group ${isActive
        ? "bg-blue-50 text-blue-700 font-bold shadow-2xs"
        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
      }`}
  >
    <Link
      href={href}
      prefetch={true}
      onClick={onClick}
      className="flex items-center gap-3 flex-1 min-w-0"
    >
      <Icon size={18} className={isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"} />
      <span className="text-sm truncate">{name}</span>
    </Link>
    {name === "Notifications" && unreadCount > 0 && (
      <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
        {unreadCount}
      </span>
    )}
    {hasSubmenu && (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggleSubmenu?.();
        }}
        title={isSubmenuOpen ? "Close list" : "Open Series and Syllabus"}
        aria-label={isSubmenuOpen ? "Close list" : "Open Series and Syllabus"}
        className={`p-1 -mr-1 rounded-lg transition-transform duration-200 hover:bg-indigo-100/70 shrink-0 cursor-pointer ${isActive
            ? "text-indigo-600 hover:text-indigo-800"
            : "text-slate-400 hover:text-slate-700"
          } ${isSubmenuOpen ? "rotate-45" : ""}`}
      >
        <Plus size={16} className="stroke-[2.5]" />
      </button>
    )}
  </div>
));

function ClassesSubmenuContent({ onSubLinkClick }: { onSubLinkClick?: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isOnCurriculum = pathname === "/curriculum";
  const currentTab = searchParams.get("tab") || "series";

  const isSeriesActive = isOnCurriculum && currentTab === "series";
  const isSyllabusActive = isOnCurriculum && currentTab === "syllabus";

  return (
    <div className="pl-4 pr-1 py-1 space-y-1 border-l-2 border-indigo-100 ml-4 my-1 animate-in fade-in slide-in-from-top-1 duration-150">
      <Link
        href="/curriculum?tab=series"
        prefetch={true}
        onClick={onSubLinkClick}
        className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all group ${isSeriesActive
            ? "bg-indigo-50 text-indigo-700 font-bold shadow-2xs"
            : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
          }`}
      >
        <ListOrdered size={14} className={isSeriesActive ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"} />
        <span className="flex-1">Series</span>
      </Link>
      <Link
        href="/curriculum?tab=syllabus"
        prefetch={true}
        onClick={onSubLinkClick}
        className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all group ${isSyllabusActive
            ? "bg-indigo-50 text-indigo-700 font-bold shadow-2xs"
            : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
          }`}
      >
        <LayoutList size={14} className={isSyllabusActive ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"} />
        <span className="flex-1">Syllabus</span>
      </Link>
    </div>
  );
}

const ClassesSubmenu = memo(({ onSubLinkClick }: { onSubLinkClick?: () => void }) => (
  <Suspense fallback={null}>
    <ClassesSubmenuContent onSubLinkClick={onSubLinkClick} />
  </Suspense>
));

const MobileBottomLink = memo(({ href, icon: Icon, name, isActive }: any) => (
  <Link
    href={href}
    prefetch={true}
    className={`flex flex-col items-center justify-center gap-1 py-1 px-1.5 min-w-[56px] rounded-xl transition-all active:scale-95 ${
      isActive 
        ? 'text-blue-600 font-bold bg-blue-50/70' 
        : 'text-slate-500 hover:text-slate-800'
    }`}
  >
    <Icon size={18} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
    <span className="text-[10px] tracking-tight">{name}</span>
  </Link>
));

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isClassesSubmenuOpen, setIsClassesSubmenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [student, setStudent] = useState<any>(() => getOfflineData(OFFLINE_KEYS.PROFILE));
  const supabase = createClient();
  const { permission, requestPermission } = usePushNotifications(student?.id);

  // Auto-request permission on first login if not denied
  useEffect(() => {
    if (student?.id && permission === 'default') {
      requestPermission();
    }
  }, [student, permission, requestPermission]);

  useEffect(() => {
    let activeChannel: any;

    const setupRealtime = async (studentId: string) => {
      // 1. Initial count fetch
      const { count } = await supabase
        .from("user_notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", studentId)
        .eq("is_read", false);
      setUnreadCount(count || 0);

      // 2. Setup SINGLE channel
      const channelId = `vision_realtime_${studentId}`;

      // Clean up any existing channel with same ID first to be safe
      supabase.removeChannel(supabase.channel(channelId));

      activeChannel = supabase
        .channel(channelId)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'user_notifications', filter: `user_id=eq.${studentId}` },
          async () => {
            const { count: newCount } = await supabase
              .from("user_notifications")
              .select("*", { count: "exact", head: true })
              .eq("user_id", studentId)
              .eq("is_read", false);
            setUnreadCount(newCount || 0);
          }
        )
        .on('postgres_changes', { event: '*', schema: 'public', table: 'materials' }, () => router.refresh())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tests' }, () => router.refresh())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'assignments' }, () => router.refresh())
        .subscribe();
    };

    const fetchStudentData = async () => {
      try {
        const res = await fetch("/api/auth/profile");
        if (res.ok) {
          const studentData = await res.json();
          setStudent(studentData);
          saveOfflineData(OFFLINE_KEYS.PROFILE, studentData);
          await setupRealtime(studentData.id);
        }
      } catch (err) {
        console.error("Error fetching student profile:", err);
      }
    };

    fetchStudentData();

    return () => {
      if (activeChannel) {
        supabase.removeChannel(activeChannel);
      }
    };
  }, [supabase, router]);

  // Global Active Time Tracker & Supabase Sync
  useEffect(() => {
    if (!student?.id) return;

    const studentId = student.id;
    const todayStr = new Date().toISOString().split('T')[0];

    // Local accumulation
    let accumulatedSeconds = 0;
    let isSyncing = false;

    const syncToDatabase = async (secondsToAdd: number) => {
      if (secondsToAdd <= 0 || isSyncing) return;
      isSyncing = true;
      try {
        const res = await fetch('/api/user/active-time', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ secondsToAdd }),
          keepalive: true,
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          console.warn("[Active Tracker] Server sync response:", errData?.error || res.statusText);
          accumulatedSeconds += secondsToAdd;
        }
      } catch (err: any) {
        // Network or offline — restore accumulated seconds to sync later
        accumulatedSeconds += secondsToAdd;
        console.warn("[Active Tracker] Sync postponed (offline or busy)");
      } finally {
        isSyncing = false;
      }
    };

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        accumulatedSeconds += 1;

        // Also update local storage so it reflects instantly on dashboard
        const key = `vision_active_seconds_${studentId}`;
        const currentTotal = parseInt(localStorage.getItem(key) || '0', 10);
        const newTotal = currentTotal + 1;
        localStorage.setItem(key, String(newTotal));

        const dailyKey = `vision_daily_active_${studentId}`;
        let dailyMap: Record<string, number> = {};
        try {
          dailyMap = JSON.parse(localStorage.getItem(dailyKey) || '{}');
        } catch (e) {
          dailyMap = {};
        }
        dailyMap[todayStr] = (dailyMap[todayStr] || 0) + 1;
        localStorage.setItem(dailyKey, JSON.stringify(dailyMap));

        // Dispatch tick event for curriculum minutes learnt card
        window.dispatchEvent(new CustomEvent("vision_active_time_tick", {
          detail: { totalSeconds: newTotal, todaySeconds: dailyMap[todayStr] }
        }));

        // Periodically sync every 60 seconds (prevents request flooding and server lockup)
        if (accumulatedSeconds >= 60 && !isSyncing) {
          const secondsToSync = accumulatedSeconds;
          accumulatedSeconds = 0;
          syncToDatabase(secondsToSync);
        }
      }
    }, 1000);

    // Sync pending on visibility change or unload
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && accumulatedSeconds > 0 && !isSyncing) {
        const secondsToSync = accumulatedSeconds;
        accumulatedSeconds = 0;
        syncToDatabase(secondsToSync);
      }
    };

    const handleBeforeUnload = () => {
      if (accumulatedSeconds > 0 && !isSyncing) {
        const secondsToSync = accumulatedSeconds;
        accumulatedSeconds = 0;
        syncToDatabase(secondsToSync);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      // Final flush if any pending seconds
      if (accumulatedSeconds > 0 && !isSyncing) {
        const secondsToSync = accumulatedSeconds;
        accumulatedSeconds = 0;
        syncToDatabase(secondsToSync);
      }
    };
  }, [student?.id]);

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
            <div className="flex flex-col">
              <span className="text-lg font-black text-slate-900 tracking-tight leading-none">Vision Learn</span>
              <span className="text-[10px] font-extrabold text-slate-400 mt-0.5">v{packageJson.version}</span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-1">
          {sidebarLinks.map((link) => {
            const isClasses = link.name === "My Classes";
            return (
              <div key={link.href}>
                <NavLink
                  {...link}
                  isActive={pathname === link.href}
                  unreadCount={unreadCount}
                  hasSubmenu={isClasses}
                  isSubmenuOpen={isClassesSubmenuOpen}
                  onToggleSubmenu={() => setIsClassesSubmenuOpen((prev) => !prev)}
                  onClick={isClasses ? () => setIsClassesSubmenuOpen(true) : undefined}
                />
                {isClasses && isClassesSubmenuOpen && (
                  <ClassesSubmenu />
                )}
              </div>
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
      <aside className={`fixed inset-y-0 left-0 w-72 bg-white z-50 transform transition-transform duration-300 lg:hidden flex flex-col ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
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
            <div className="flex flex-col">
              <span className="text-xl font-black text-slate-900 leading-none">Vision Learn</span>
              <span className="text-[10px] font-extrabold text-slate-400 mt-1">v{packageJson.version}</span>
            </div>
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
          {sidebarLinks.map((link) => {
            const isClasses = link.name === "My Classes";
            return (
              <div key={link.href}>
                <NavLink
                  {...link}
                  isActive={pathname === link.href}
                  unreadCount={unreadCount}
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    if (isClasses) setIsClassesSubmenuOpen(true);
                  }}
                  hasSubmenu={isClasses}
                  isSubmenuOpen={isClassesSubmenuOpen}
                  onToggleSubmenu={() => setIsClassesSubmenuOpen((prev) => !prev)}
                />
                {isClasses && isClassesSubmenuOpen && (
                  <ClassesSubmenu onSubLinkClick={() => setIsMobileMenuOpen(false)} />
                )}
              </div>
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
        {/* Top Navbar - Compact height */}
        <header className="h-13 bg-white border-b border-slate-100 flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-30">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Open mobile menu"
            className="p-1.5 -ml-1 text-slate-400 hover:text-slate-900 lg:hidden"
          >
            <Menu size={18} />
          </button>

          <div className="flex items-center gap-3">
            <GlobalSearch />
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/notifications"
              aria-label={`View notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
              className="p-1.5 text-slate-400 hover:text-slate-900 relative"
            >
              <Bell size={17} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full border-2 border-white" />
              )}
            </Link>

            <div className="h-5 w-[1px] bg-slate-100 mx-0.5" />

            <div className="flex items-center gap-2">
              <Link href="/settings" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-slate-900 leading-tight">{student?.name || "Loading..."}</p>
                  <p className="text-[10px] text-slate-400 font-medium leading-none">Student</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs uppercase overflow-hidden shadow-2xs">
                  {student?.photo_url ? (
                    <img src={student.photo_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : student?.name ? (
                    student.name.substring(0, 2)
                  ) : (
                    <User size={15} className="text-white" />
                  )}
                </div>
              </Link>
            </div>
          </div>
        </header>

        {/* Global Offline / Sync Status Pill */}
        <SyncStatus />

        <main className="p-3 sm:p-3.5 lg:p-4 max-w-7xl pb-24 lg:pb-6 overflow-x-hidden min-w-0 flex-1">
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        {!isMobileMenuOpen && (
          <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-2 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] z-50 flex items-center justify-around shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.06)] animate-in slide-in-from-bottom duration-300">
            <MobileBottomLink href="/dashboard" icon={LayoutDashboard} name="Home" isActive={pathname === '/dashboard'} />
            <MobileBottomLink href="/courses" icon={BookOpen} name="Courses" isActive={pathname === '/courses'} />
            <MobileBottomLink href="/calendar" icon={Calendar} name="Calendar" isActive={pathname === '/calendar'} />
            <MobileBottomLink href="/attendance" icon={CheckCircle2} name="Attendance" isActive={pathname === '/attendance'} />
            <MobileBottomLink href="/tests" icon={FileText} name="Tests" isActive={pathname === '/tests'} />
          </nav>
        )}
      </div>
    </div>
  );
}

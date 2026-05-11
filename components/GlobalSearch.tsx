"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Search, X, BookOpen, PlayCircle, FileText, PenTool, Bell, Command, Loader2, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any>({
    courses: [],
    lessons: [],
    materials: [],
    tests: [],
    notifications: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient();

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K' || e.code === 'KeyK')) {
        e.preventDefault();
        setIsOpen(true);
      }
      
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Perform search
  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults({ courses: [], lessons: [], materials: [], tests: [], notifications: [] });
      return;
    }

    setIsLoading(true);
    const q = `%${searchQuery}%`;

    try {
      // 1. Get current student profile to get their ID and enrollments
      const profileRes = await fetch("/api/auth/profile");
      if (!profileRes.ok) throw new Error("Not authenticated");
      const student = await profileRes.json();

      // 2. Get enrolled course IDs
      const { data: enrollments } = await supabase
        .from("enrollments")
        .select("course_id")
        .eq("student_id", student.id);
      
      const enrolledCourseIds = enrollments?.map((e: any) => e.course_id) || [];

      if (enrolledCourseIds.length === 0) {
        setResults({ courses: [], lessons: [], materials: [], tests: [], notifications: [] });
        return;
      }

      // 3. Perform filtered search
      const [courses, lessons, materials, tests, notifications] = await Promise.all([
        supabase.from("courses").select("id, title, course_code").in("id", enrolledCourseIds).ilike("title", q).limit(3),
        supabase.from("lms_lessons").select("id, title, type").ilike("title", q).limit(5), // RLS should handle lesson visibility
        supabase.from("materials").select("id, title").ilike("title", q).limit(5), // RLS should handle material visibility
        supabase.from("tests").select("id, title").ilike("title", q).limit(5),
        supabase.from("user_notifications").select(`
          id,
          notifications (title, message)
        `)
        .eq("user_id", student.id)
        .order("created_at", { ascending: false })
      ]);

      // Further filter notifications in memory if ilike is hard on joined tables
      const filteredNotifications = (notifications.data || [])
        .filter((un: any) => 
          un.notifications?.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
          un.notifications?.message?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 3);

      setResults({
        courses: courses.data || [],
        lessons: lessons.data || [],
        materials: materials.data || [],
        tests: tests.data || [],
        notifications: filteredNotifications.map((un: any) => ({
          id: un.id,
          title: un.notifications?.title,
          message: un.notifications?.message
        }))
      });
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, performSearch]);

  const flatResults = [
    ...results.courses.map((r: any) => ({ ...r, type: 'course', icon: BookOpen, href: `/curriculum?course=${r.id}`, category: 'Courses' })),
    ...results.lessons.map((r: any) => ({ ...r, type: 'lesson', icon: PlayCircle, href: `/curriculum?lessonId=${r.id}`, category: 'Lessons' })),
    ...results.materials.map((r: any) => ({ ...r, type: 'material', icon: FileText, href: `/materials`, category: 'Materials' })),
    ...results.tests.map((r: any) => ({ ...r, type: 'test', icon: PenTool, href: `/tests`, category: 'Tests' })),
    ...results.notifications.map((r: any) => ({ ...r, type: 'notification', icon: Bell, href: `/notifications`, category: 'Notifications' }))
  ];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % flatResults.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + flatResults.length) % flatResults.length);
    } else if (e.key === "Enter") {
      if (flatResults[selectedIndex]) {
        router.push(flatResults[selectedIndex].href);
        setIsOpen(false);
      }
    }
  };

  if (!isOpen) return (
    <button 
      onClick={() => setIsOpen(true)}
      className="flex items-center gap-2 p-2 md:px-3 md:py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-400 hover:bg-slate-100 transition-all hover:border-slate-300 group shadow-sm active:scale-95"
    >
      <Search size={18} className="md:w-4 md:h-4 group-hover:text-indigo-600 transition-colors" />
      <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Search...</span>
      <kbd className="hidden lg:flex items-center gap-1 px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[9px] font-black text-slate-400">
        <Command size={10} /> K
      </kbd>
    </button>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center md:pt-[10vh] p-0 md:px-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsOpen(false)} />
      
      <div className="relative w-full h-full md:h-auto md:max-w-2xl bg-white md:rounded-2xl shadow-2xl border-x border-b md:border border-slate-100 overflow-hidden animate-in md:zoom-in-95 slide-in-from-top-full md:slide-in-from-top-0 duration-300 flex flex-col max-h-screen md:max-h-[80vh]">
        <div className="flex items-center px-4 py-2 md:py-0 border-b border-slate-100 sticky top-0 bg-white z-20">
          <Search size={20} className="text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search classes, materials..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full px-4 py-4 md:py-5 outline-none text-base md:text-sm font-medium text-slate-900 placeholder:text-slate-400"
          />

          <div className="flex items-center gap-2">
            {isLoading ? (
              <Loader2 size={18} className="text-indigo-600 animate-spin" />
            ) : query ? (
              <button onClick={() => setQuery("")} className="p-1 hover:bg-slate-50 rounded-lg text-slate-400">
                <X size={18} />
              </button>
            ) : (
              <span className="hidden md:inline-block text-[10px] font-black text-slate-300 border border-slate-200 px-1.5 py-0.5 rounded uppercase tracking-widest">ESC</span>
            )}
            
            {/* Mobile-only Close Button */}
            <button 
              onClick={() => setIsOpen(false)}
              className="md:hidden p-2 text-slate-500 hover:bg-slate-50 rounded-xl"
              aria-label="Close search"
            >
              <X size={22} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-2" ref={scrollContainerRef}>
          {query.length < 2 ? (
            <div className="p-8 text-center">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-300">
                <Search size={24} />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Search Vision Learn</h3>
              <p className="text-xs text-slate-500 mt-1">Find classes, tests, notes, and more.</p>
            </div>
          ) : flatResults.length === 0 && !isLoading ? (
            <div className="p-8 text-center text-slate-500">
              <p className="text-xs font-medium">No results found for "{query}"</p>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              {['Courses', 'Lessons', 'Materials', 'Tests', 'Notifications'].map(category => {
                const categoryResults = flatResults.filter(r => r.category === category);
                if (categoryResults.length === 0) return null;

                return (
                  <div key={category} className="space-y-1">
                    <h4 className="px-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{category}</h4>
                    {categoryResults.map((result) => {
                      const overallIndex = flatResults.indexOf(result);
                      const isSelected = selectedIndex === overallIndex;

                      return (
                        <button
                          key={`${result.type}-${result.id}`}
                          onClick={() => {
                            router.push(result.href);
                            setIsOpen(false);
                          }}
                          onMouseEnter={() => setSelectedIndex(overallIndex)}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left group ${
                            isSelected ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'hover:bg-slate-50 text-slate-600'
                          }`}
                        >
                          <div className={`p-2 rounded-lg ${isSelected ? 'bg-white/20' : 'bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-indigo-600'}`}>
                            <result.icon size={16} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-bold truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                              {result.title}
                            </p>
                            {result.course_code && (
                              <p className={`text-[10px] font-black uppercase tracking-widest ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                                {result.course_code}
                              </p>
                            )}
                            {result.message && (
                              <p className={`text-[10px] truncate ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                                {result.message}
                              </p>
                            )}
                          </div>
                          <ArrowRight size={14} className={`shrink-0 transition-transform ${isSelected ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100'}`} />
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><kbd className="bg-white border border-slate-200 px-1 rounded">↵</kbd> Select</span>
            <span className="flex items-center gap-1"><kbd className="bg-white border border-slate-200 px-1 rounded">↑↓</kbd> Navigate</span>
          </div>
          <span className="flex items-center gap-1"><kbd className="bg-white border border-slate-200 px-1 rounded">ESC</kbd> Close</span>
        </div>
      </div>
    </div>
  );
}

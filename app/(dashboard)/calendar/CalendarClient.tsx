"use client";

import { useState, useMemo } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Video, 
  FileText,
  Clock,
  MapPin,
  Calendar,
  Flag,
  BookOpen,
  PenTool,
  Sparkles,
  CircleDot,
  FolderCode
} from "lucide-react";

const EVENT_CONFIG: Record<string, { color: string; bg: string; border: string; dot: string; icon: React.ReactNode; label: string }> = {
  class:      { color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-100", dot: "bg-indigo-500", icon: <BookOpen size={16} />, label: "Class" },
  event:      { color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100", dot: "bg-purple-500", icon: <Sparkles size={16} />, label: "Event" },
  test:       { color: "text-rose-600",   bg: "bg-rose-50",   border: "border-rose-100",   dot: "bg-rose-500",   icon: <FileText size={16} />, label: "Test" },
  quiz:       { color: "text-pink-600",   bg: "bg-pink-50",   border: "border-pink-100",   dot: "bg-pink-500",   icon: <FileText size={16} />, label: "Quiz" },
  assignment: { color: "text-amber-600",  bg: "bg-amber-50",  border: "border-amber-100",  dot: "bg-amber-500",  icon: <PenTool size={16} />, label: "Assignment" },
  project:    { color: "text-teal-600",   bg: "bg-teal-50",   border: "border-teal-100",   dot: "bg-teal-500",   icon: <FolderCode size={16} />, label: "Project" },
  holiday:    { color: "text-emerald-600",bg: "bg-emerald-50",border: "border-emerald-100",dot: "bg-emerald-500",icon: <Flag size={16} />,     label: "Holiday" },
  lecture:    { color: "text-blue-600",   bg: "bg-blue-50",   border: "border-blue-100",   dot: "bg-blue-500",   icon: <BookOpen size={16} />, label: "Lecture" },
};

function getEventConfig(type: string) {
  const t = (type || "").toLowerCase();
  return EVENT_CONFIG[t] || EVENT_CONFIG.event;
}

export default function CalendarClient({ initialEvents }: { initialEvents: any[] }) {
  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const todayStr = now.toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Compute calendar days for the month
  const days = useMemo(() => {
    const date = new Date(currentYear, currentMonth, 1);
    const result = [];
    const firstDay = date.getDay();

    // Previous month padding
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
      result.push({ day: prevMonthLastDay - i, currentMonth: false, dateStr: '', isToday: false, events: [] as any[] });
    }

    // Current month
    const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
    for (let i = 1; i <= lastDay; i++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      result.push({ 
        day: i, 
        currentMonth: true, 
        dateStr,
        isToday: dateStr === todayStr,
        events: initialEvents.filter(e => e.event_date === dateStr)
      });
    }

    // Next month padding to fill remaining grid cells (up to 42 = 6 rows)
    const remaining = 42 - result.length;
    for (let i = 1; i <= remaining; i++) {
      result.push({ day: i, currentMonth: false, dateStr: '', isToday: false, events: [] as any[] });
    }

    return result;
  }, [currentMonth, currentYear, initialEvents, todayStr]);

  // Upcoming events (next 7 days)
  const upcomingEvents = useMemo(() => {
    const today = new Date();
    const week = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    return initialEvents
      .filter(e => {
        const d = new Date(e.event_date);
        return d >= today && d <= week;
      })
      .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
  }, [initialEvents]);

  // Events on selected day
  const selectedEvents = useMemo(() => {
    return initialEvents.filter(e => e.event_date === selectedDate);
  }, [initialEvents, selectedDate]);

  // Count events per type for legend (normalized keys)
  const eventTypeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    initialEvents.forEach(e => {
      const type = (e.type || "event").toLowerCase();
      counts[type] = (counts[type] || 0) + 1;
    });
    return counts;
  }, [initialEvents]);

  const handlePrevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else { setCurrentMonth(m => m - 1); }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else { setCurrentMonth(m => m + 1); }
  };

  const goToToday = () => {
    setCurrentMonth(now.getMonth());
    setCurrentYear(now.getFullYear());
    setSelectedDate(todayStr);
  };

  const formatSelectedDate = (dateStr: string) => {
    try {
      return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    } catch { return dateStr; }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">

      {/* Legend Bar */}
      <div className="flex flex-wrap items-center gap-3 px-1">
        {Object.entries(eventTypeCounts).map(([type, count]) => {
          const cfg = getEventConfig(type);
          return (
            <div key={type} className={`flex items-center gap-2 ${cfg.bg} px-3 py-1.5 rounded-lg border ${cfg.border} shadow-sm`}>
              <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
              <span className={`text-[10px] font-black uppercase tracking-widest ${cfg.color}`}>{cfg.label}</span>
              <span className="text-[10px] font-bold text-slate-400">{count}</span>
            </div>
          );
        })}
        {Object.keys(eventTypeCounts).length === 0 && (
          <span className="text-xs text-slate-400 font-medium italic">No events yet</span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          {/* Month Header */}
          <div className="p-5 flex items-center justify-between border-b border-slate-100">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-black text-slate-900 tabular-nums">{monthNames[currentMonth]} {currentYear}</h2>
              <button 
                onClick={goToToday}
                className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100 uppercase tracking-widest hover:bg-indigo-100 transition-colors"
              >
                Today
              </button>
            </div>
            <div className="flex items-center gap-1 bg-slate-50 rounded-xl p-1 border border-slate-100">
              <button onClick={handlePrevMonth} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-500 hover:text-slate-900">
                <ChevronLeft size={16} />
              </button>
              <button onClick={handleNextMonth} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-500 hover:text-slate-900">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
          
          {/* Weekday Header */}
          <div className="grid grid-cols-7 border-b border-slate-100">
            {dayNames.map((day, i) => (
              <div key={day} className={`py-2.5 text-center text-[10px] font-black uppercase tracking-widest bg-slate-50/50 ${
                i === 0 ? "text-rose-500 dark:text-rose-400 font-bold" : "text-slate-400"
              }`}>
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 flex-1">
            {days.map((day, i) => {
              const isSelected = day.dateStr === selectedDate;
              const hasEvents = day.events.length > 0;
              const isSunday = i % 7 === 0;

              return (
                <div 
                  key={i} 
                  onClick={() => day.dateStr && setSelectedDate(day.dateStr)}
                  className={`min-h-[60px] md:min-h-[85px] p-1.5 md:p-2 border-r border-b border-slate-50 transition-all cursor-pointer group relative ${
                    !day.currentMonth 
                      ? 'bg-slate-50/40 text-slate-300' 
                      : isSunday
                        ? 'bg-rose-50/20 dark:bg-rose-950/10 hover:bg-rose-100/30 dark:hover:bg-rose-900/20'
                        : 'bg-white hover:bg-indigo-50/30'
                  } ${isSelected ? 'bg-indigo-50/50 ring-2 ring-inset ring-indigo-500/60 z-10' : ''}`}
                >
                  {day.day !== 0 && (
                    <>
                      <div className="flex justify-between items-start mb-1.5">
                        <span className={`text-xs font-black w-6 h-6 md:w-7 md:h-7 flex items-center justify-center rounded-lg transition-all ${
                          day.isToday 
                            ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-200' 
                            : isSelected && day.currentMonth
                            ? 'bg-indigo-100 text-indigo-700'
                            : isSunday && day.currentMonth
                            ? 'text-rose-500 dark:text-rose-455 font-bold'
                            : day.currentMonth
                            ? 'text-slate-700 group-hover:bg-slate-100'
                            : 'text-slate-300'
                        }`}>
                          {day.day}
                        </span>
                        {hasEvents && (
                          <span className="text-[8px] font-black text-slate-400 bg-slate-100 px-1 md:px-1.5 py-0.5 rounded shrink-0">
                            {day.events.length}
                          </span>
                        )}
                      </div>

                      {/* Event Dots/Pills */}
                      <div className="space-y-1">
                        {/* Mobile view: small dots row (unique event types) */}
                        <div className="flex flex-wrap gap-1 justify-start md:hidden mt-0.5">
                          {Array.from(new Set(day.events.map(e => (e.type || "").toLowerCase()))).slice(0, 5).map((type: string, ei: number) => {
                            const cfg = getEventConfig(type);
                            return (
                              <div 
                                key={ei} 
                                className={`w-1.5 h-1.5 rounded-full ${cfg.dot} shrink-0`} 
                                title={cfg.label}
                              />
                            );
                          })}
                        </div>

                        {/* Desktop view: text pills list */}
                        <div className="hidden md:block space-y-1">
                          {day.events.slice(0, 3).map((event: any, ei: number) => {
                            const cfg = getEventConfig(event.type);
                            return (
                              <div key={ei} className={`flex items-center gap-1 px-1.5 py-0.5 rounded ${cfg.bg} border ${cfg.border} overflow-hidden`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot} shrink-0`} />
                                <span className={`text-[8px] font-bold ${cfg.color} truncate leading-tight`}>{event.title}</span>
                              </div>
                            );
                          })}
                          {day.events.length > 3 && (
                            <div className="text-[8px] font-black text-slate-400 text-center">+{day.events.length - 3}</div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-1 space-y-5">
          {/* Selected Day Details */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sticky top-24">
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                  <Calendar size={14} />
                </div>
                <h3 className="text-base font-black text-slate-900 leading-none">Schedule</h3>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 ml-10">
                {formatSelectedDate(selectedDate)}
              </p>
            </div>

            <div className="space-y-3">
              {selectedEvents.length > 0 ? (
                selectedEvents.map((event: any, i: number) => {
                  const cfg = getEventConfig(event.type);
                  return (
                    <div 
                      key={i} 
                      className={`group p-4 ${cfg.bg} hover:bg-white hover:shadow-lg hover:shadow-slate-100 transition-all rounded-xl border ${cfg.border} hover:border-slate-200 cursor-pointer`}
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cfg.color} bg-white shadow-sm border ${cfg.border}`}>
                          {cfg.icon}
                        </div>
                        <div className="min-w-0">
                          <p className={`text-[8px] font-black uppercase tracking-widest leading-none mb-1 ${cfg.color}`}>{cfg.label}</p>
                          <h4 className="text-sm font-black text-slate-900 leading-tight">{event.title}</h4>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-3 ml-12 text-slate-500">
                        {event.start_time && event.type?.toLowerCase() !== 'holiday' && event.type?.toLowerCase() !== 'event' && (
                          <div className="flex items-center gap-1.5 text-[10px] font-bold bg-white px-2 py-1 rounded-md border border-slate-100">
                            <Clock size={11} className="text-slate-400" />
                            {event.start_time}
                          </div>
                        )}
                        {event.location && event.type?.toLowerCase() !== 'holiday' && event.type?.toLowerCase() !== 'event' && (
                          <div className="flex items-center gap-1.5 text-[10px] font-bold bg-white px-2 py-1 rounded-md border border-slate-100">
                            <MapPin size={11} className="text-slate-400" />
                            {event.location}
                          </div>
                        )}
                      </div>

                      {event.description && (
                        <p className="text-xs text-slate-500 font-medium mt-2 ml-12 line-clamp-2">{event.description}</p>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center space-y-3">
                  <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200 mx-auto border border-slate-100">
                    <Calendar size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-400">No events</p>
                    <p className="text-xs text-slate-300 font-medium">Nothing scheduled for this day</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Events */}
          {upcomingEvents.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600 border border-amber-100">
                  <Sparkles size={14} />
                </div>
                <h3 className="text-sm font-black text-slate-900">Coming Up</h3>
                <span className="text-[9px] font-black text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 uppercase tracking-widest ml-auto">Next 7 days</span>
              </div>

              <div className="space-y-2">
                {upcomingEvents.slice(0, 5).map((event: any, i: number) => {
                  const cfg = getEventConfig(event.type);
                  const eventDate = new Date(event.event_date + 'T00:00:00');
                  const isToday = event.event_date === todayStr;

                  return (
                    <div 
                      key={i}
                      onClick={() => setSelectedDate(event.event_date)}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group border border-transparent hover:border-slate-100"
                    >
                      <div className="text-center shrink-0 w-10">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">
                          {eventDate.toLocaleDateString('en-US', { month: 'short' })}
                        </p>
                        <p className={`text-lg font-black leading-none mt-0.5 ${isToday ? 'text-indigo-600' : 'text-slate-900'}`}>
                          {eventDate.getDate()}
                        </p>
                      </div>
                      <div className={`w-1 h-8 rounded-full ${cfg.dot} shrink-0`} />
                      <div className="min-w-0 flex-1">
                        <h5 className="text-xs font-black text-slate-900 truncate">{event.title}</h5>
                        <p className={`text-[9px] font-bold ${cfg.color} uppercase tracking-widest`}>{cfg.label}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

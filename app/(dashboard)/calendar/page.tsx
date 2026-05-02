"use client";

import { useState } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Video, 
  PenTool, 
  FileText,
  Clock,
  MapPin,
  Calendar
} from "lucide-react";

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState(14);

  const days = Array.from({ length: 35 }, (_, i) => {
    const date = i - 3; // Adjust to start from end of previous month
    return {
      date: date > 0 && date <= 31 ? date : (date <= 0 ? 30 + date : date - 31),
      currentMonth: date > 0 && date <= 31,
      isToday: date === 14,
      events: []
    };
  });

  const materials: any[] = [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-1">Learning Calendar</h1>
          <p className="text-sm text-slate-500 font-medium">Track your upcoming classes, tests, and deadlines.</p>
        </div>
        <div className="flex items-center bg-white rounded-xl border border-slate-100 p-1 shadow-sm">
          <button className="p-2 hover:bg-slate-50 rounded-lg transition-colors"><ChevronLeft size={18} /></button>
          <span className="px-4 text-sm font-black text-slate-900">May 2026</span>
          <button className="p-2 hover:bg-slate-50 rounded-lg transition-colors"><ChevronRight size={18} /></button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="grid grid-cols-7 border-b border-slate-50">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 auto-rows-fr">
            {days.map((day, i) => (
              <div 
                key={i} 
                onClick={() => setSelectedDate(day.date)}
                className={`min-h-[70px] p-2 border-r border-b border-slate-50 transition-all cursor-pointer hover:bg-slate-50/50 ${day.currentMonth ? 'bg-white' : 'bg-slate-50/10'} ${selectedDate === day.date ? 'ring-2 ring-inset ring-indigo-500 z-10' : ''}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={`text-[10px] font-black ${day.currentMonth ? (day.isToday ? 'text-white bg-indigo-600 w-5 h-5 flex items-center justify-center rounded-lg shadow-sm shadow-indigo-100' : 'text-slate-900') : 'text-slate-300'}`}>
                    {day.date}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {day.events.slice(0, 2).map((event, ei) => (
                    <div key={ei} className={`w-1.5 h-1.5 rounded-full ${
                      event.type === 'class' ? 'bg-indigo-500' : 'bg-emerald-500'
                    }`} />
                  ))}
                  {day.events.length > 2 && <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Day Details */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sticky top-24">
            <div className="mb-6">
              <h2 className="text-lg font-black text-slate-900 leading-none">Thursday</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">May {selectedDate}, 2026</p>
            </div>

            <div className="space-y-4">
              {days.find(d => d.date === selectedDate)?.events.length ? (
                days.find(d => d.date === selectedDate)?.events.map((event, i) => (
                  <div key={i} className="group p-4 bg-slate-50 hover:bg-white hover:shadow-lg hover:shadow-slate-100 transition-all rounded-2xl border border-transparent hover:border-slate-100 cursor-pointer">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        event.type === 'class' ? 'bg-indigo-600 text-white' : 'bg-emerald-600 text-white'
                      }`}>
                        {event.type === 'class' ? <Video size={18} /> : <FileText size={18} />}
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">{event.type}</p>
                        <h4 className="text-sm font-black text-slate-900 leading-tight">{event.title}</h4>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-slate-500">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold">
                        <Clock size={12} className="text-slate-400" />
                        {event.time}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold">
                        <MapPin size={12} className="text-slate-400" />
                        Online
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center space-y-3">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-100 mx-auto border border-slate-100 shadow-sm">
                    <Calendar size={24} />
                  </div>
                  <p className="text-slate-400 font-bold text-xs italic">No events scheduled.</p>
                </div>
              )}
            </div>
            
            {/* Stats Summary */}
            <div className="mt-8 pt-6 border-t border-slate-100 space-y-3">
              <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                <span className="text-slate-400">Total Classes</span>
                <span className="text-indigo-600">2 Classes</span>
              </div>
              <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                <span className="text-slate-400">Upcoming Tests</span>
                <span className="text-emerald-600">1 Test</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

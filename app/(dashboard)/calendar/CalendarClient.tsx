"use client";

import { useState } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Video, 
  FileText,
  Clock,
  MapPin,
  Calendar,
  Flag
} from "lucide-react";

export default function CalendarClient({ initialEvents }: { initialEvents: any[] }) {
  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string>(now.toISOString().split('T')[0]);

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const getDaysInMonth = (month: number, year: number) => {
    const date = new Date(year, month, 1);
    const days = [];
    const firstDay = date.getDay();

    // Padding for previous month
    for (let i = 0; i < firstDay; i++) {
      days.push({ day: 0, currentMonth: false });
    }

    const lastDay = new Date(year, month + 1, 0).getDate();
    for (let i = 1; i <= lastDay; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({ 
        day: i, 
        currentMonth: true, 
        dateStr,
        isToday: dateStr === now.toISOString().split('T')[0],
        events: initialEvents.filter(e => e.event_date === dateStr)
      });
    }

    return days;
  };

  const days = getDaysInMonth(currentMonth, currentYear);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const selectedEvents = initialEvents.filter(e => e.event_date === selectedDate);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-700">
      {/* Calendar Grid */}
      <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        <div className="p-6 flex items-center justify-between border-b border-slate-50">
          <h2 className="text-xl font-black text-slate-900">{monthNames[currentMonth]} {currentYear}</h2>
          <div className="flex items-center bg-slate-50 rounded-xl p-1">
            <button onClick={handlePrevMonth} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all"><ChevronLeft size={18} /></button>
            <button onClick={handleNextMonth} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all"><ChevronRight size={18} /></button>
          </div>
        </div>
        
        <div className="grid grid-cols-7 border-b border-slate-50">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/30">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 auto-rows-fr flex-1">
          {days.map((day, i) => (
            <div 
              key={i} 
              onClick={() => day.dateStr && setSelectedDate(day.dateStr)}
              className={`min-h-[100px] p-3 border-r border-b border-slate-50 transition-all cursor-pointer group relative ${
                !day.currentMonth ? 'bg-slate-50/30' : 'bg-white hover:bg-slate-50/50'
              } ${selectedDate === day.dateStr ? 'ring-2 ring-inset ring-indigo-500 z-10' : ''}`}
            >
              {day.day !== 0 && (
                <>
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-xs font-black w-6 h-6 flex items-center justify-center rounded-lg ${
                      day.isToday ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-900'
                    }`}>
                      {day.day}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {day.events?.slice(0, 2).map((event: any, ei: number) => (
                      <div key={ei} className={`h-1.5 rounded-full ${
                        event.type === 'class' ? 'bg-indigo-500' : event.type === 'holiday' ? 'bg-rose-500' : 'bg-emerald-500'
                      }`} title={event.title} />
                    ))}
                    {(day.events?.length || 0) > 2 && (
                      <div className="text-[8px] font-black text-slate-400 text-center">+{day.events!.length - 2} more</div>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Selected Day Details */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 sticky top-24">
          <div className="mb-8">
            <h3 className="text-xl font-black text-slate-900 leading-none">Schedule</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">{new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>

          <div className="space-y-4">
            {selectedEvents.length > 0 ? (
              selectedEvents.map((event: any, i: number) => (
                <div key={i} className="group p-5 bg-slate-50 hover:bg-white hover:shadow-2xl hover:shadow-indigo-100/50 transition-all rounded-3xl border border-transparent hover:border-indigo-100 cursor-pointer">
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                      event.type === 'class' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-emerald-600 text-white shadow-lg shadow-emerald-100'
                    }`}>
                      {event.type === 'class' ? <Video size={20} /> : event.type === 'holiday' ? <Flag size={20} /> : <FileText size={20} />}
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{event.type}</p>
                      <h4 className="text-sm font-black text-slate-900 leading-tight">{event.title}</h4>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-5 text-slate-500">
                    <div className="flex items-center gap-2 text-[10px] font-bold">
                      <Clock size={14} className="text-slate-400" />
                      {event.start_time}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold">
                      <MapPin size={14} className="text-slate-400" />
                      {event.location}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-16 text-center space-y-4">
                <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200 mx-auto">
                  <Calendar size={32} />
                </div>
                <p className="text-slate-400 font-bold text-sm italic">Nothing scheduled for this day.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

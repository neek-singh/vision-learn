"use client";

import { useState, useEffect } from "react";
import { 
  PenTool, 
  FileUp,
  BookOpen,
  X,
  Calendar,
  Info,
  CheckCircle2,
  Upload,
  Loader2,
  Clock,
  Zap,
  FolderCode,
  ExternalLink
} from "lucide-react";
import { createClient as createPublicSupabaseClient } from "@/lib/supabase-browser";

const getCategoryColor = (category: string) => {
  switch (category?.toLowerCase()) {
    case "word":
      return "bg-blue-50 text-blue-650 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30";
    case "excel":
      return "bg-emerald-50 text-emerald-650 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30";
    case "powerpoint":
      return "bg-orange-50 text-orange-650 border-orange-100 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-900/30";
    case "onenote":
      return "bg-purple-50 text-purple-650 border-purple-100 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/30";
    case "notion":
      return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-350 dark:border-slate-700";
    case "chatgpt":
    case "gemini":
    case "claude":
      return "bg-teal-50 text-teal-650 border-teal-100 dark:bg-teal-950/20 dark:text-teal-400 dark:border-teal-900/30";
    case "web":
      return "bg-indigo-50 text-indigo-650 border-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/30";
    case "canva":
      return "bg-pink-50 text-pink-650 border-pink-100 dark:bg-pink-950/20 dark:text-pink-400 dark:border-pink-900/30";
    default:
      return "bg-slate-50 text-slate-650 border-slate-100 dark:bg-slate-800/20 dark:text-slate-400 dark:border-slate-800/30";
  }
};

export default function AssignmentsClient({ 
  initialAssignments, 
  initialSubmissions, 
  studentId 
}: { 
  initialAssignments: any[], 
  initialSubmissions: any[], 
  studentId: string 
}) {
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [isSubmittingModal, setIsSubmittingModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [activeAssignment, setActiveAssignment] = useState<any>(null);
  const [submissionUrl, setSubmissionUrl] = useState("");
  const [submissions, setSubmissions] = useState<any[]>(initialSubmissions);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const supabase = createPublicSupabaseClient();

  if (!mounted) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 bg-white rounded-3xl border border-slate-100 shadow-sm">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
        <p className="text-slate-500 font-black text-xs uppercase tracking-widest">Loading Projects...</p>
      </div>
    );
  }

  const getSubmission = (item: any) => {
    if (item.source === "lesson") {
      return submissions.find(s => s.lesson_id === item.id);
    }
    return submissions.find(s => s.assignment_id === item.id);
  };

  const handleOpenSubmission = (assignment: any) => {
    setActiveAssignment(assignment);
    const existing = getSubmission(assignment);
    setSubmissionUrl(existing?.content_url || "");
    setIsSubmittingModal(true);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      if (activeAssignment.source === "lesson") {
        const { error } = await supabase
          .from("submissions")
          .upsert([{
            lesson_id: activeAssignment.id,
            student_id: studentId,
            content_url: submissionUrl,
            status: "submitted"
          }], { onConflict: "lesson_id,student_id" });
        if (error) throw error;
        setSubmissions(prev => [
          ...prev.filter(s => s.lesson_id !== activeAssignment.id),
          { lesson_id: activeAssignment.id, student_id: studentId, content_url: submissionUrl, status: "submitted" }
        ]);
      } else {
        const { error } = await supabase
          .from("submissions")
          .upsert([{
            assignment_id: activeAssignment.id,
            student_id: studentId,
            content_url: submissionUrl,
            status: "submitted"
          }], { onConflict: "assignment_id,student_id" });
        if (error) throw error;
        setSubmissions(prev => [
          ...prev.filter(s => s.assignment_id !== activeAssignment.id),
          { assignment_id: activeAssignment.id, student_id: studentId, content_url: submissionUrl, status: "submitted" }
        ]);
      }

      setIsSubmittingModal(false);
    } catch (err) {
      console.error("Error submitting assignment:", err);
      alert("Failed to submit assignment");
    } finally {
      setIsUploading(false);
    }
  };

  const getCourseTitle = (item: any) => {
    if (item.source === "lesson") {
      return item.enrollmentBatch || "My Course";
    }
    return item.courses?.title || "";
  };

  const getCourseName = (item: any) => item.courses?.title || item.enrollmentBatch || "My Course";

  const getDueDate = (item: any) => {
    if (item.source === "lesson") {
      if (item.schedule?.date) {
        return new Date(`${item.schedule.date}T${item.schedule.end_time || "23:59:00"}`);
      }
      return null;
    }
    return item.due_date ? new Date(item.due_date) : null;
  };

  const isLiveNow = (item: any) => {
    if (item.source !== "lesson" || !item.schedule) return false;
    const startDate = new Date(`${item.schedule.date}T${item.schedule.start_time || "00:00:00"}`);
    const endDate = item.schedule.end_time
      ? new Date(`${item.schedule.date}T${item.schedule.end_time}`)
      : null;
    const now = new Date();
    if (endDate) return now >= startDate && now <= endDate;
    return now >= startDate;
  };

  const coursesList = Array.from(new Set(initialAssignments.map(a => getCourseName(a)))).filter(Boolean);

  const filteredAssignments = initialAssignments;

  return (
    <div className="space-y-8">


      {!filteredAssignments || filteredAssignments.length === 0 ? (
        <div className="p-20 text-center bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200 mx-auto mb-4">
            <BookOpen size={32} />
          </div>
          <p className="text-slate-400 font-bold">No assignments or projects found for this course.</p>
        </div>
      ) : (
        <>
          {/* Mobile Card List View */}
          <div className="md:hidden space-y-4 animate-in fade-in duration-500">
            {filteredAssignments.map((task: any) => {
              const submission = getSubmission(task);
              const dueDate = getDueDate(task);
              const live = isLiveNow(task);
              const isProject = (task.lesson_type || task.type || "").toLowerCase() === "project";
              return (
                <div key={task.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-4">
                  {/* Top Header Section */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      {/* Left Circular Icon Badge */}
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isProject ? "bg-indigo-50 text-indigo-600" : "bg-amber-50 text-amber-600"
                      }`}>
                        {isProject ? <FolderCode size={16} /> : <PenTool size={16} />}
                      </div>
                      
                      {/* Center Title & Category tag only */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-black text-slate-900 text-sm leading-snug break-words">
                            {task.title}
                          </h4>
                          {task.category && (
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border shrink-0 ${getCategoryColor(task.category)}`}>
                              {task.category}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Top Right Present/Received Date & Open guidelines link */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className="text-[9px] font-bold text-slate-400 uppercase shrink-0 pt-1">
                        {new Date(task.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      {task.description && (
                        <a 
                          href={task.description}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-indigo-650 hover:text-indigo-850 font-black uppercase tracking-wider bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100/40 px-4 py-2 rounded-2xl transition-all"
                        >
                          <ExternalLink size={13} className="shrink-0" />
                          Open
                        </a>
                      )}
                    </div>
                  </div>
                  
                  {/* Middle Deadline Section */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-50">
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Deadline</span>
                      {dueDate ? (
                        <div className="flex items-center gap-1.5 text-slate-600 flex-wrap">
                          <Calendar size={12} className="text-amber-500 shrink-0" />
                          <span className="text-xs font-bold">{dueDate.toLocaleDateString()}</span>
                          <span className="text-xs text-slate-300">|</span>
                          <Clock size={12} className="text-indigo-400 shrink-0" />
                          <span className="text-xs font-bold">
                            {dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-slate-355">
                          <Calendar size={12} className="shrink-0" />
                          <span className="text-xs font-bold">No deadline</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {live && !submission && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-600 rounded-full text-[8px] font-black uppercase tracking-widest border border-rose-100 shrink-0">
                          <Zap size={8} fill="currentColor" /> Live
                        </span>
                      )}
                      {submission && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[8px] font-black uppercase tracking-widest border border-emerald-100 shrink-0">
                          <CheckCircle2 size={8} /> Submitted
                        </span>
                      )}
                    </div>
                  </div>

                  {submission?.feedback && (
                    <div className="text-[10px] text-slate-500 font-bold bg-amber-50/50 border border-amber-100/50 rounded-xl p-3">
                      <span className="text-[8px] font-black uppercase tracking-wider text-amber-800 block mb-0.5">Feedback:</span>
                      "${submission.feedback}"
                    </div>
                  )}

                  {/* Bottom solid Submit button */}
                  <button 
                    onClick={() => handleOpenSubmission(task)}
                    disabled={!!submission}
                    className={`w-full py-3.5 text-xs font-black rounded-xl transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2 ${
                      submission
                        ? "bg-slate-50 text-slate-400 cursor-not-allowed shadow-none border border-slate-100"
                        : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100"
                    }`}
                  >
                    <FileUp size={14} />
                    {submission ? "Submitted" : "Submit"}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden animate-in fade-in duration-500">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 text-[9px] uppercase font-black tracking-[0.2em] border-b border-slate-100">
                    <th className="px-6 py-4">Task Title</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Due / Schedule</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredAssignments.map((task: any) => {
                    const submission = getSubmission(task);
                    const dueDate = getDueDate(task);
                    const live = isLiveNow(task);
                    const isProject = (task.lesson_type || task.type || "").toLowerCase() === "project";
                    return (
                      <tr key={task.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              isProject ? "bg-indigo-50 text-indigo-600" : "bg-amber-50 text-amber-600"
                            }`}>
                              {isProject ? <FolderCode size={16} /> : <PenTool size={16} />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-black text-slate-900 text-sm">{task.title}</p>
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                                  isProject ? "bg-indigo-50 text-indigo-700" : "bg-amber-50 text-amber-700"
                                }`}>
                                  {isProject ? "Project" : "Assignment"}
                                </span>
                                {task.category && (
                                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${getCategoryColor(task.category)}`}>
                                    {task.category}
                                  </span>
                                )}
                              </div>
                              {task.description && (
                                <a 
                                  href={task.description}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[10px] text-indigo-650 hover:text-indigo-850 font-black uppercase tracking-wider bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100/40 px-2.5 py-0.5 rounded-lg transition-all mt-1.5 w-fit"
                                >
                                  <ExternalLink size={10} className="shrink-0" />
                                  Open Link
                                </a>
                              )}
                              {live && !submission && (
                                <span className="flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-600 rounded-full text-[8px] font-black uppercase tracking-widest border border-rose-100 w-fit mt-1">
                                  <Zap size={8} fill="currentColor" /> Live Now
                                </span>
                              )}
                              {submission && (
                                <div className="flex flex-col gap-1 mt-1">
                                  <div className="flex items-center gap-2">
                                    <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[8px] font-black uppercase tracking-widest border border-emerald-100 w-fit">
                                      <CheckCircle2 size={8} /> Submitted
                                    </span>
                                    {submission.score && (
                                      <span className="flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full text-[8px] font-black uppercase tracking-widest border border-indigo-100 w-fit">
                                        Grade: {submission.score}
                                      </span>
                                    )}
                                  </div>
                                  {submission.feedback && (
                                    <div className="text-[10px] text-slate-500 font-bold bg-amber-50/50 border border-amber-100/50 rounded-lg px-2.5 py-1.5 mt-1 max-w-xs">
                                      <span className="text-[8px] font-black uppercase tracking-wider text-amber-800 block mb-0.5">Feedback:</span>
                                      "{submission.feedback}"
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {new Date(task.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1 text-slate-500">
                            {dueDate ? (
                              <>
                                <div className="flex items-center gap-2">
                                  <Calendar size={12} className="text-amber-500" />
                                  <span className="text-xs font-bold">{dueDate.toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Clock size={12} className="text-indigo-400" />
                                  <span className="text-[10px] font-bold">
                                    {dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                              </>
                            ) : task.source === "lesson" && task.schedule ? (
                              <div className="flex items-center gap-2">
                                <Calendar size={12} className="text-amber-500" />
                                <span className="text-xs font-bold">{task.schedule.date}</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-slate-350">
                                <Calendar size={12} className="shrink-0" />
                                <span className="text-[10px] font-bold">No deadline</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2.5">
                            {task.description && (
                              <a 
                                href={task.description}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs text-indigo-650 hover:text-indigo-850 font-black uppercase tracking-wider bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100/40 rounded-xl transition-all"
                              >
                                <ExternalLink size={13} className="shrink-0" />
                                Open
                              </a>
                            )}
                            <button
                              disabled={!!submission}
                              onClick={() => handleOpenSubmission(task)}
                              className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-black rounded-xl transition-all shadow-md active:scale-[0.98] ${
                                submission
                                  ? "bg-slate-50 text-slate-400 cursor-not-allowed shadow-none border border-slate-100"
                                  : "bg-indigo-600 text-white shadow-indigo-100 hover:bg-indigo-700"
                              }`}
                            >
                              <FileUp size={13} className="shrink-0" />
                              {submission ? "Submitted" : "Submit"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Submission Modal */}
      {isSubmittingModal && activeAssignment && (() => {
        const isActiveProject = (activeAssignment.lesson_type || activeAssignment.type || "").toLowerCase() === "project";
        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-0 sm:p-4">
            <div className="bg-white w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-xl overflow-hidden rounded-none sm:rounded-[2.5rem] border-0 sm:border border-slate-100 shadow-2xl flex flex-col animate-in zoom-in-95 duration-300">
              {/* Header */}
              <div className="px-6 py-5 sm:px-8 sm:py-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50 shrink-0">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 ${
                    isActiveProject ? "bg-indigo-600" : "bg-amber-500"
                  }`}>
                    {isActiveProject ? <FolderCode size={20} /> : <FileUp size={20} />}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-black text-slate-900 text-sm sm:text-base truncate">
                      {isActiveProject ? "Submit Project" : "Submit Assignment"}
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{getCourseName(activeAssignment)}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsSubmittingModal(false)} 
                  className="p-2 hover:bg-slate-200 active:scale-90 rounded-xl transition-all"
                  aria-label="Close modal"
                >
                  <X size={20} className="text-slate-500" />
                </button>
              </div>

              {/* Content Area */}
              <div className="p-5 sm:p-8 space-y-6 overflow-y-auto flex-1">
                {/* Assignment Info */}
                <div className={`${isActiveProject ? "bg-indigo-50/50 border-indigo-100/50" : "bg-amber-50/30 border-amber-100/30"} rounded-2xl sm:rounded-3xl p-4 sm:p-6 border`}>
                  <h4 className="text-xs sm:text-sm font-black text-slate-900 mb-2 flex items-center gap-2">
                    <Info size={16} className={isActiveProject ? "text-indigo-600 shrink-0" : "text-amber-500 shrink-0"} />
                    <span className="truncate">{activeAssignment.title}</span>
                  </h4>
                  <div className="prose prose-sm max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                      {activeAssignment.description || activeAssignment.notes_content?.replace(/<[^>]*>/g, "").substring(0, 300) || "No specific instructions provided."}
                    </p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    {getDueDate(activeAssignment) && (
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-rose-500 shrink-0" />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                          Due: {getDueDate(activeAssignment)?.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {getSubmission(activeAssignment) && (
                      <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500 text-white rounded-full text-[8px] font-black uppercase tracking-widest w-fit">
                        <CheckCircle2 size={10} className="shrink-0" /> Already Submitted
                      </span>
                    )}
                  </div>
                </div>

                {/* Submission Form */}
                <form onSubmit={handleFinalSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-between">
                      <span>Solution Link or Content URL</span>
                      <span className="text-indigo-600">Required</span>
                    </label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                        <Upload size={18} className="shrink-0" />
                      </div>
                      <input 
                        required
                        type="url"
                        value={submissionUrl}
                        onChange={(e) => setSubmissionUrl(e.target.value)}
                        placeholder="Paste your Google Drive, Github or Drive link here..."
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-transparent rounded-xl sm:rounded-2xl outline-none focus:border-indigo-600 focus:bg-white transition-all text-sm font-bold text-slate-900 shadow-inner"
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex gap-4">
                    <button 
                      type="button"
                      onClick={() => setIsSubmittingModal(false)}
                      className="flex-1 py-3.5 bg-slate-50 hover:bg-slate-100 text-slate-600 font-black text-xs uppercase tracking-widest rounded-xl sm:rounded-2xl transition-all active:scale-95"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={isUploading || !!getSubmission(activeAssignment)}
                      className={`flex-[2] py-3.5 text-white font-black text-xs uppercase tracking-widest rounded-xl sm:rounded-2xl transition-all shadow-xl disabled:opacity-50 disabled:bg-slate-200 disabled:text-slate-400 flex items-center justify-center gap-2 active:scale-95 ${
                        isActiveProject ? "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100" : "bg-amber-500 hover:bg-amber-600 shadow-amber-100"
                      }`}
                    >
                      {isUploading ? (
                        <Loader2 className="animate-spin shrink-0" size={18} />
                      ) : (
                        <CheckCircle2 size={18} className="shrink-0" />
                      )}
                      <span>{getSubmission(activeAssignment) ? "Already Submitted" : (isActiveProject ? "Submit Project" : "Submit Assignment")}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

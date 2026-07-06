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
  FolderCode
} from "lucide-react";
import { createClient as createPublicSupabaseClient } from "@/lib/supabase-browser";

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
        <p className="text-slate-500 font-black text-xs uppercase tracking-widest">Loading Assignments...</p>
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

  const filteredAssignments = selectedCourse === "all"
    ? initialAssignments
    : initialAssignments.filter(a => getCourseName(a) === selectedCourse);

  return (
    <div className="space-y-8">
      {/* Course Filter */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
        <button 
          onClick={() => setSelectedCourse("all")}
          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${
            selectedCourse === "all" ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-500 border-slate-100 hover:border-slate-200"
          }`}
        >
          All Courses
        </button>
        {coursesList.map((courseName: any) => (
          <button 
            key={courseName}
            onClick={() => setSelectedCourse(courseName)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${
              selectedCourse === courseName ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-500 border-slate-100 hover:border-slate-200"
            }`}
          >
            {courseName}
          </button>
        ))}
      </div>

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
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isProject ? "bg-indigo-50 text-indigo-600" : "bg-amber-50 text-amber-600"
                      }`}>
                        {isProject ? <FolderCode size={16} /> : <PenTool size={16} />}
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 text-sm leading-snug">{task.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{getCourseName(task)}</p>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                            isProject ? "bg-indigo-50 text-indigo-700" : "bg-amber-50 text-amber-700"
                          }`}>
                            {isProject ? "Project" : "Assignment"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase shrink-0">
                      {new Date(task.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  
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
                      ) : task.source === "lesson" && task.schedule ? (
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Calendar size={12} className="text-amber-500 shrink-0" />
                          <span className="text-xs font-bold">{task.schedule.date}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-300 font-bold">No deadline</span>
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
                      {submission?.score && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full text-[8px] font-black uppercase tracking-widest border border-indigo-100 shrink-0">
                          Grade: {submission.score}
                        </span>
                      )}
                    </div>
                  </div>

                  {submission?.feedback && (
                    <div className="text-[10px] text-slate-500 font-bold bg-amber-50/50 border border-amber-100/50 rounded-xl p-3">
                      <span className="text-[8px] font-black uppercase tracking-wider text-amber-800 block mb-0.5">Feedback:</span>
                      "{submission.feedback}"
                    </div>
                  )}

                  <button 
                    onClick={() => handleOpenSubmission(task)}
                    disabled={!!submission}
                    className={`w-full py-3 text-xs font-black rounded-xl transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2 ${
                      submission
                        ? "bg-slate-50 text-slate-400 cursor-not-allowed shadow-none border border-slate-100"
                        : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100"
                    }`}
                  >
                    <FileUp size={14} />
                    {submission ? "Submitted" : (isProject ? "Submit Project" : "Submit Assignment")}
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
                    <th className="px-6 py-4">Course</th>
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
                              </div>
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
                        <td className="px-6 py-4 text-xs font-bold text-slate-500">
                          {getCourseName(task)}
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
                              <span className="text-[10px] text-slate-300 font-bold">No deadline</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => handleOpenSubmission(task)}
                            disabled={!!submission}
                            className={`inline-flex items-center gap-2 px-4 py-2 text-[10px] font-black rounded-xl transition-all shadow-md active:scale-95 ${
                              submission
                                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100"
                            }`}
                          >
                            <FileUp size={12} />
                            {submission ? "Submitted" : (isProject ? "Submit Project" : "Submit Assignment")}
                          </button>
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

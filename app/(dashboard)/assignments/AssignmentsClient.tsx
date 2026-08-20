"use client";

import { useState, useEffect, useMemo } from "react";
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
  ExternalLink,
  ArrowLeft,
  FileText
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

const getProgress = (task: any, submission: any) => {
  if (!submission) return 0;
  if (submission.status === "submitted") return 100;
  
  // If it's a draft, calculate based on filled content
  let notesFilled = false;
  let filesFilled = false;
  let linksFilled = false;

  if (submission.content_url) {
    try {
      const parsed = JSON.parse(submission.content_url);
      if (parsed.notes && parsed.notes.trim()) notesFilled = true;
      if (parsed.files && parsed.files.length > 0) filesFilled = true;
      if (parsed.links && parsed.links.length > 0) linksFilled = true;
    } catch (e) {
      // Fallback for legacy plain URL submissions
      linksFilled = true;
    }
  }

  let progress = 10; // Base progress for starting a draft
  if (notesFilled) progress += 30;
  if (filesFilled) progress += 40;
  if (linksFilled) progress += 30;
  
  return Math.min(90, progress);
};

const checkAtRisk = (task: any, submission: any, dueDate: Date | null) => {
  if (submission && submission.status === "submitted") return false;
  if (dueDate) {
    const now = new Date();
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    if (diffDays < 2 && diffDays >= 0) return true;
  }
  return false;
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
  const [submissions, setSubmissions] = useState<any[]>(initialSubmissions);
  const [mounted, setMounted] = useState(false);

  // Custom states for Rich Submission
  const [submissionNotes, setSubmissionNotes] = useState("");
  const [deliverables, setDeliverables] = useState<any[]>([]);
  const [linksList, setLinksList] = useState<string[]>([]);
  const [linkInput, setLinkInput] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setSubmissions(initialSubmissions);
  }, [initialSubmissions]);

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
    
    let parsedContent = null;
    if (existing?.content_url) {
      try {
        parsedContent = JSON.parse(existing.content_url);
      } catch (e) {
        parsedContent = {
          notes: "",
          files: [],
          links: [existing.content_url]
        };
      }
    }

    setSubmissionNotes(parsedContent?.notes || "");
    setDeliverables(parsedContent?.files || []);
    setLinksList(parsedContent?.links || []);
    setLinkInput("");
    setIsSubmittingModal(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
      const newFile = {
        name: file.name,
        size: `${fileSizeMB} MB`,
        url: "#"
      };
      setDeliverables(prev => [...prev, newFile]);
    });
  };

  const handleAddLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkInput) return;
    let formattedLink = linkInput.trim();
    if (!/^https?:\/\//i.test(formattedLink)) {
      formattedLink = `https://${formattedLink}`;
    }
    setLinksList(prev => [...prev, formattedLink]);
    setLinkInput("");
  };

  const handleRemoveLink = (index: number) => {
    setLinksList(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemoveFile = (index: number) => {
    setDeliverables(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitData = async (status: "draft" | "submitted") => {
    setIsUploading(true);

    let finalLinks = [...linksList];
    if (linkInput.trim()) {
      let formattedLink = linkInput.trim();
      if (!/^https?:\/\//i.test(formattedLink)) {
        formattedLink = `https://${formattedLink}`;
      }
      finalLinks.push(formattedLink);
      setLinksList(finalLinks);
      setLinkInput("");
    }

    if (status === "submitted" && finalLinks.length === 0) {
      alert("कृपया सबमिट करने से पहले कम से कम एक लिंक (URL) अवश्य जोड़ें। (Please add at least one link before submitting.)");
      setIsUploading(false);
      return;
    }

    const submissionPayload = {
      notes: submissionNotes,
      files: deliverables,
      links: finalLinks
    };

    const contentString = JSON.stringify(submissionPayload);

    try {
      const record = {
        student_id: studentId,
        content_url: contentString,
        status: status
      };

      if (activeAssignment.source === "lesson") {
        const { error } = await supabase
          .from("submissions")
          .upsert([{
            lesson_id: activeAssignment.id,
            ...record
          }], { onConflict: "lesson_id,student_id" });
        if (error) throw error;
        setSubmissions(prev => [
          ...prev.filter(s => s.lesson_id !== activeAssignment.id),
          { lesson_id: activeAssignment.id, student_id: studentId, content_url: contentString, status }
        ]);
      } else {
        const { error } = await supabase
          .from("submissions")
          .upsert([{
            assignment_id: activeAssignment.id,
            ...record
          }], { onConflict: "assignment_id,student_id" });
        if (error) throw error;
        setSubmissions(prev => [
          ...prev.filter(s => s.assignment_id !== activeAssignment.id),
          { assignment_id: activeAssignment.id, student_id: studentId, content_url: contentString, status }
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

  const filteredAssignments = useMemo(() => {
    return [...initialAssignments].sort((a, b) => {
      const subA = getSubmission(a);
      const subB = getSubmission(b);
      const isSubA = subA?.status === "submitted";
      const isSubB = subB?.status === "submitted";
      
      if (isSubA && !isSubB) return 1;
      if (!isSubA && isSubB) return -1;
      return 0;
    });
  }, [initialAssignments, submissions]);

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
          {filteredAssignments.map((task: any) => {
            const submission = getSubmission(task);
            const dueDate = getDueDate(task);
            const live = isLiveNow(task);
            const isProject = (task.lesson_type || task.type || "").toLowerCase() === "project";

            // Start date calculation
            const startDateStr = task.schedule?.date
              ? new Date(`${task.schedule.date}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              : new Date(task.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

            // Due date calculation
            const dueDateStr = dueDate
              ? dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              : "No deadline";

            // Progress and risk calculation
            const progress = getProgress(task, submission);
            const atRisk = checkAtRisk(task, submission, dueDate);

            // Category/Tag
            const categoryLabel = task.category || (isProject ? "Project" : "Assignment");

            const hasExternalLink = task.description && (task.description.startsWith("http://") || task.description.startsWith("https://"));

            return (
              <div key={task.id} className="bg-white p-6 rounded-[1.25rem] border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between gap-5 relative overflow-hidden">
                
                {/* Top content wrapper */}
                <div className="space-y-4">
                  {/* Header: Title and Badge */}
                  <div className="flex items-start justify-between gap-4">
                    <h4 className="font-extrabold text-slate-900 text-base leading-snug break-words flex-1">
                      {task.title}
                    </h4>
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 border bg-blue-50 text-blue-600 border-blue-100/50">
                      {categoryLabel}
                    </span>
                  </div>

                  {/* Dates Section */}
                  <div className="space-y-2 text-slate-500 text-xs">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-slate-400 shrink-0" />
                      <span className="font-medium text-slate-500">
                        Start: <span className="font-semibold text-slate-700">{startDateStr}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-slate-400 shrink-0" />
                      <span className="font-medium text-slate-500">
                        Due: <span className={`font-semibold ${atRisk ? 'text-rose-600' : 'text-slate-700'}`}>{dueDateStr}</span>
                      </span>
                    </div>
                  </div>

                  {/* Progress Section */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className={atRisk ? "text-rose-650 font-bold animate-pulse" : "text-slate-505"}>
                        {atRisk ? "Progress - At Risk" : "Progress"}
                      </span>
                      <span className={atRisk ? "text-rose-650 font-bold" : "text-slate-800"}>
                        {progress}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${atRisk ? "bg-rose-500" : "bg-blue-600"}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Extra details (live/submitted badges, grade/feedback) */}
                  <div className="flex flex-wrap gap-2 items-center">
                    {live && !submission && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-600 rounded-full text-[8px] font-black uppercase tracking-widest border border-rose-100 w-fit shrink-0">
                        <Zap size={8} fill="currentColor" /> Live Now
                      </span>
                    )}
                    {submission && (
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border w-fit shrink-0 ${
                        submission.status === "submitted"
                          ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                          : "bg-amber-50 text-amber-605 border-amber-100"
                      }`}>
                        {submission.status === "submitted" ? (
                          <>
                            <CheckCircle2 size={8} /> Submitted
                          </>
                        ) : (
                          <>
                            <Clock size={8} /> Draft Saved
                          </>
                        )}
                      </span>
                    )}
                    {submission?.score && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-650 rounded-full text-[8px] font-black uppercase tracking-widest border border-indigo-100 w-fit shrink-0">
                        Grade: {submission.score}
                      </span>
                    )}
                  </div>

                  {submission && (() => {
                    let filesCount = 0;
                    let linksCount = 0;
                    let hasNotes = false;
                    try {
                      const parsed = JSON.parse(submission.content_url);
                      filesCount = parsed.files?.length || 0;
                      linksCount = parsed.links?.length || 0;
                      hasNotes = !!(parsed.notes && parsed.notes.trim());
                    } catch (e) {
                      if (submission.content_url && submission.content_url.startsWith("http")) {
                        linksCount = 1;
                      }
                    }

                    if (filesCount === 0 && linksCount === 0 && !hasNotes) return null;

                    return (
                      <div className="mt-3 p-3 bg-slate-50/70 border border-slate-100/80 rounded-2xl flex flex-col gap-2 animate-in fade-in duration-300">
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Saved Info:</span>
                        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[10px] font-semibold text-slate-500">
                          {filesCount > 0 && (
                            <span className="flex items-center gap-1">
                              <FileUp size={12} className="text-slate-400" />
                              {filesCount} {filesCount === 1 ? "File" : "Files"}
                            </span>
                          )}
                          {linksCount > 0 && (
                            <span className="flex items-center gap-1">
                              <ExternalLink size={12} className="text-slate-400" />
                              {linksCount} {linksCount === 1 ? "Link" : "Links"}
                            </span>
                          )}
                          {hasNotes && (
                            <span className="flex items-center gap-1">
                              <FileText size={12} className="text-slate-400" />
                              Notes
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {submission?.feedback && (
                    <div className="text-[10px] text-slate-500 font-bold bg-amber-50/50 border border-amber-100/50 rounded-xl p-3 mt-2">
                      <span className="text-[8px] font-black uppercase tracking-wider text-amber-800 block mb-0.5">Feedback:</span>
                      "{submission.feedback}"
                    </div>
                  )}
                </div>

                {/* Buttons Section (Bottom) */}
                <div className="flex gap-3 pt-3 border-t border-slate-100 mt-auto shrink-0">
                  {hasExternalLink ? (
                    <a
                      href={task.description}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2 text-center border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98]"
                    >
                      Open
                    </a>
                  ) : (
                    <button
                      onClick={() => handleOpenSubmission(task)}
                      className="flex-1 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98]"
                    >
                      Open
                    </button>
                  )}

                  <button
                    onClick={() => handleOpenSubmission(task)}
                    disabled={submission?.status === "submitted"}
                    className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-[0.98] ${
                      submission?.status === "submitted"
                        ? "bg-slate-50 text-slate-400 cursor-not-allowed shadow-none border border-slate-100"
                        : submission?.status === "draft"
                          ? "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-100"
                          : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-100 hover:shadow-md"
                    }`}
                  >
                    {submission?.status === "submitted" ? "Submitted" : submission?.status === "draft" ? "Edit Draft" : "Submit"}
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Submission Modal */}
      {isSubmittingModal && activeAssignment && (() => {
        const isActiveProject = (activeAssignment.lesson_type || activeAssignment.type || "").toLowerCase() === "project";
        const isFinalized = getSubmission(activeAssignment)?.status === "submitted";

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300">
            <div className="bg-slate-50 w-full h-screen max-h-screen sm:h-auto sm:max-h-[90vh] sm:max-w-xl overflow-hidden rounded-none sm:rounded-[2.5rem] border-0 sm:border border-slate-100 shadow-2xl flex flex-col animate-in zoom-in-95 duration-350">
              
              {/* Header (Header bar from mockup) */}
              <div className="px-6 py-4 border-b border-slate-200 bg-white flex items-center shrink-0 relative">
                <button 
                  onClick={() => setIsSubmittingModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors active:scale-90"
                  aria-label="Back"
                >
                  <ArrowLeft size={20} className="text-slate-800" />
                </button>
                <h3 className="font-extrabold text-slate-900 text-lg absolute left-1/2 -translate-x-1/2">
                  {isActiveProject ? "Submit Project" : "Submit Assignment"}
                </h3>
              </div>

              {/* Scrollable Content Area */}
              <div className="p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar text-left">
                
                {/* Project Summary Card */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                    <FolderCode size={24} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Project Summary</p>
                    <h4 className="font-extrabold text-slate-955 text-base leading-tight truncate">
                      {activeAssignment.title}
                    </h4>
                    <p className="text-xs font-semibold text-slate-500 mt-0.5 truncate">
                      Due: {getDueDate(activeAssignment)?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) || "No deadline"} • {getCourseName(activeAssignment)}
                    </p>
                  </div>
                </div>

                {/* Submission Notes */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                    Submission Notes
                  </label>
                  <textarea
                    disabled={isFinalized}
                    value={submissionNotes}
                    onChange={(e) => setSubmissionNotes(e.target.value)}
                    placeholder="Add any final comments or context for the reviewers..."
                    className="w-full h-32 p-4 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 transition-all text-sm font-semibold text-slate-800 placeholder-slate-400 disabled:bg-slate-50 disabled:text-slate-500"
                  />
                </div>

                {/* Deliverables */}
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                    Deliverables
                  </label>
                  
                  {/* List of uploaded files */}
                  {deliverables.length > 0 && (
                    <div className="space-y-2">
                      {deliverables.map((file, idx) => (
                        <div key={idx} className="bg-white px-4 py-3 rounded-xl border border-slate-200/60 shadow-sm flex items-center justify-between gap-3 animate-in slide-in-from-bottom-2 duration-200">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
                              <FileUp size={18} />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-850 text-sm leading-tight truncate">
                                {file.name}
                              </p>
                              <p className="text-[10px] font-medium text-slate-400">
                                {file.size}
                              </p>
                            </div>
                          </div>
                          {!isFinalized && (
                            <button
                              type="button"
                              onClick={() => handleRemoveFile(idx)}
                              className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
                            >
                              <X size={16} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload Dashed Trigger */}
                  {!isFinalized && (
                    <label htmlFor="file-upload-input" className="border-2 border-dashed border-blue-200 bg-blue-50/20 hover:bg-blue-50/50 rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all hover:border-blue-400 select-none">
                      <FileUp size={24} className="text-blue-500" />
                      <span className="text-xs font-bold text-blue-600">Tap to upload additional files</span>
                      <input
                        type="file"
                        id="file-upload-input"
                        className="hidden"
                        multiple
                        onChange={handleFileUpload}
                      />
                    </label>
                  )}
                </div>

                {/* Add Link Section */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                    Add Link
                  </label>
                  {!isFinalized && (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={linkInput}
                        onChange={(e) => setLinkInput(e.target.value)}
                        placeholder="https://..."
                        className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-600 transition-all text-sm font-semibold text-slate-800 placeholder-slate-400"
                      />
                      <button
                        type="button"
                        onClick={handleAddLink}
                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-colors shrink-0"
                      >
                        Add Link
                      </button>
                    </div>
                  )}

                  {/* List of Added Links */}
                  {linksList.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      {linksList.map((link, idx) => (
                        <div key={idx} className="bg-slate-100/60 px-3.5 py-2 rounded-lg flex items-center justify-between gap-3 text-xs">
                          <a
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-650 hover:underline font-semibold truncate flex-1 flex items-center gap-1.5"
                          >
                            <ExternalLink size={12} className="shrink-0" />
                            {link}
                          </a>
                          {!isFinalized && (
                            <button
                              type="button"
                              onClick={() => handleRemoveLink(idx)}
                              className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600 transition-colors"
                            >
                              <X size={12} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {/* Bottom Actions Bar */}
              <div className="px-6 pt-4 pb-6 sm:pb-4 bg-white border-t border-slate-200 flex gap-4 shrink-0">
                {!isFinalized ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleSubmitData("draft")}
                      disabled={isUploading}
                      className="flex-1 py-3 bg-white border border-blue-600 hover:bg-blue-50 text-blue-600 font-bold text-sm rounded-xl transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                      Save Draft
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSubmitData("submitted")}
                      disabled={isUploading}
                      className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      {isUploading && <Loader2 className="animate-spin" size={16} />}
                      Finalize Submission
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="w-full py-3 bg-emerald-50 text-emerald-700 border border-emerald-250 font-bold text-sm rounded-xl flex items-center justify-center gap-1.5 cursor-not-allowed"
                  >
                    <CheckCircle2 size={16} />
                    Project Finalized & Submitted
                  </button>
                )}
              </div>

            </div>
          </div>
        );
      })()}
    </div>
  );
}

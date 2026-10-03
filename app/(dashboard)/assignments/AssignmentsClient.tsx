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
  FileText,
  Search,
  Target,
  FileSpreadsheet,
  Presentation
} from "lucide-react";
import { createClient as createPublicSupabaseClient } from "@/lib/supabase-browser";

const getCategoryConfig = (category: string = "") => {
  const cat = category.toLowerCase().trim();
  switch (cat) {
    case "excel":
    case "sheets":
      return {
        label: "EXCEL",
        Icon: FileSpreadsheet,
        badgeCls: "bg-emerald-50 text-emerald-700 border-emerald-200/70",
        iconCls: "bg-emerald-50 text-emerald-600 border-emerald-200/70",
      };
    case "word":
    case "doc":
    case "docx":
      return {
        label: "WORD",
        Icon: FileText,
        badgeCls: "bg-blue-50 text-blue-700 border-blue-200/70",
        iconCls: "bg-blue-50 text-blue-600 border-blue-200/70",
      };
    case "powerpoint":
    case "ppt":
      return {
        label: "PPT",
        Icon: Presentation,
        badgeCls: "bg-orange-50 text-orange-700 border-orange-200/70",
        iconCls: "bg-orange-50 text-orange-600 border-orange-200/70",
      };
    case "onenote":
      return {
        label: "ONENOTE",
        Icon: BookOpen,
        badgeCls: "bg-purple-50 text-purple-700 border-purple-200/70",
        iconCls: "bg-purple-50 text-purple-600 border-purple-200/70",
      };
    default:
      return {
        label: cat.toUpperCase() || "PROJECT",
        Icon: FolderCode,
        badgeCls: "bg-indigo-50 text-indigo-700 border-indigo-200/70",
        iconCls: "bg-indigo-50 text-indigo-600 border-indigo-200/70",
      };
  }
};

const getCategoryColor = (category: string) => {
  return getCategoryConfig(category).badgeCls;
};

const getProgress = (task: any, submission: any) => {
  if (!submission) return 0;
  if (submission.status === "submitted" || submission.status === "graded") return 100;
  
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
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

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

  const getSubmission = (item: any) => {
    if (item.source === "lesson") {
      return submissions.find(s => s.lesson_id === item.id);
    }
    return submissions.find(s => s.assignment_id === item.id);
  };

  const categoriesList = useMemo(() => {
    const unique = new Set<string>();
    initialAssignments.forEach((a) => {
      const cat = a.category || "Project";
      if (cat) unique.add(cat);
    });
    return Array.from(unique);
  }, [initialAssignments]);

  const stats = useMemo(() => {
    const total = initialAssignments.length;
    let completed = 0;
    initialAssignments.forEach(a => {
      const sub = getSubmission(a);
      if (sub?.status === "submitted" || sub?.status === "graded") completed++;
    });
    return {
      total,
      completed,
      pending: total - completed
    };
  }, [initialAssignments, submissions]);

  const filteredAssignments = useMemo(() => {
    let result = [...initialAssignments];

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(a => {
        const titleMatch = (a.title || "").toLowerCase().includes(q);
        const catMatch = (a.category || "").toLowerCase().includes(q);
        return titleMatch || catMatch;
      });
    }

    // Filter by Category
    if (categoryFilter !== "all") {
      result = result.filter(a => {
        const cat = a.category || "Project";
        return cat.toLowerCase() === categoryFilter.toLowerCase();
      });
    }

    // Filter by Status
    if (statusFilter !== "all") {
      result = result.filter(a => {
        const sub = getSubmission(a);
        if (statusFilter === "pending") {
          return !sub || sub.status === "draft";
        }
        return sub?.status === statusFilter;
      });
    }

    // Sort: push submitted/graded to the bottom
    return result.sort((a, b) => {
      const subA = getSubmission(a);
      const subB = getSubmission(b);
      const isSubA = subA?.status === "submitted" || subA?.status === "graded";
      const isSubB = subB?.status === "submitted" || subB?.status === "graded";
      
      if (isSubA && !isSubB) return 1;
      if (!isSubA && isSubB) return -1;
      return 0;
    });
  }, [initialAssignments, submissions, statusFilter, categoryFilter, searchQuery]);

  if (!mounted) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 bg-white rounded-3xl border border-slate-100 shadow-sm">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
        <p className="text-slate-500 font-black text-xs uppercase tracking-widest">Loading Projects...</p>
      </div>
    );
  }

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

    if (finalLinks.length === 0) {
      alert("कृपया ड्राफ्ट सेव करने या सबमिट करने से पहले कम से कम एक लिंक (URL) अवश्य जोड़ें। (Please add at least one link before saving or submitting.)");
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

  return (
    <div className="space-y-3">
      {/* 3-Column Compact Stat Bar */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white rounded-xl p-2.5 sm:p-3 border border-slate-200/80 shadow-2xs flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100/60 flex items-center justify-center shrink-0">
            <Target size={16} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider leading-none">Total</p>
            <p className="text-base sm:text-lg font-bold text-slate-800 leading-tight mt-0.5">{stats.total}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-2.5 sm:p-3 border border-slate-200/80 shadow-2xs flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100/60 flex items-center justify-center shrink-0">
            <CheckCircle2 size={16} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider leading-none">Completed</p>
            <p className="text-base sm:text-lg font-bold text-slate-800 leading-tight mt-0.5">{stats.completed}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-2.5 sm:p-3 border border-slate-200/80 shadow-2xs flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 border border-amber-100/60 flex items-center justify-center shrink-0">
            <Clock size={16} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider leading-none">Pending</p>
            <p className="text-base sm:text-lg font-bold text-slate-800 leading-tight mt-0.5">{stats.pending}</p>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="space-y-2">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects and tasks..."
            className="w-full pl-8.5 pr-8 py-2 text-xs bg-white rounded-xl border border-slate-200/80 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 text-slate-800 placeholder-slate-400 transition-all shadow-2xs"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              aria-label="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex flex-col gap-1.5">
          {/* Status Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-0.5">
            {[
              { id: "all", label: `All (${initialAssignments.length})` },
              { id: "pending", label: "Pending" },
              { id: "draft", label: "Draft" },
              { id: "submitted", label: "Submitted" },
              { id: "graded", label: "Graded" }
            ].map(status => (
              <button
                key={status.id}
                onClick={() => setStatusFilter(status.id)}
                className={`shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  statusFilter === status.id
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/70"
                }`}
              >
                {status.label}
              </button>
            ))}
          </div>

          {/* Category Pills (if categories exist) */}
          {categoriesList.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-0.5">
              <button
                onClick={() => setCategoryFilter("all")}
                className={`shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  categoryFilter === "all"
                    ? "bg-indigo-600 text-white shadow-2xs"
                    : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/70"
                }`}
              >
                All Categories
              </button>
              {categoriesList.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    categoryFilter === cat
                      ? "bg-indigo-600 text-white shadow-2xs"
                      : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/70"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Projects List */}
      {!filteredAssignments || filteredAssignments.length === 0 ? (
        <div className="p-10 text-center bg-white rounded-2xl border border-slate-200/70 shadow-2xs">
          <div className="w-11 h-11 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 mx-auto mb-2.5 border border-slate-100">
            <BookOpen size={20} />
          </div>
          <p className="text-xs font-bold text-slate-700">No projects found</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {searchQuery || statusFilter !== "all" || categoryFilter !== "all"
              ? "Try changing your search or filter options"
              : "No projects available for your enrolled courses."}
          </p>
          {(searchQuery || statusFilter !== "all" || categoryFilter !== "all") && (
            <button
              onClick={() => { setSearchQuery(""); setStatusFilter("all"); setCategoryFilter("all"); }}
              className="mt-3 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-1.5 sm:space-y-2">
          {filteredAssignments.map((task: any) => {
            const submission = getSubmission(task);
            const dueDate = getDueDate(task);
            const isProject = (task.lesson_type || task.type || "").toLowerCase() === "project";

            const dueDateStr = dueDate
              ? dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              : "No deadline";

            const progress = getProgress(task, submission);
            const atRisk = checkAtRisk(task, submission, dueDate);
            const categoryLabel = task.category || (isProject ? "Project" : "Assignment");
            const config = getCategoryConfig(categoryLabel);
            const { Icon } = config;
            const hasExternalLink = task.description && (task.description.startsWith("http://") || task.description.startsWith("https://"));

            const isSubmitted = submission?.status === "submitted";
            const isGraded = submission?.status === "graded";
            const isDraft = submission?.status === "draft";

            return (
              <div 
                key={task.id} 
                onClick={() => handleOpenSubmission(task)}
                className="w-full min-w-0 bg-white rounded-xl border border-slate-200/75 hover:border-indigo-300 hover:shadow-2xs active:scale-[0.99] transition-all p-2.5 sm:p-3 flex items-center justify-between gap-2.5 cursor-pointer group"
              >
                {/* Left: Compact Icon */}
                <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center border transition-transform group-hover:scale-105 ${config.iconCls}`}>
                  <Icon size={16} />
                </div>

                {/* Middle: Title & Metadata */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <h4 className="text-xs sm:text-[13px] font-bold text-slate-800 truncate leading-snug group-hover:text-indigo-600 transition-colors">
                      {task.title}
                    </h4>
                    {(isSubmitted || isGraded) && (
                      <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200/70 shrink-0">
                        <CheckCircle2 size={9} />
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-400 font-medium leading-none">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide border leading-none ${config.badgeCls}`}>
                      {config.label}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className={`flex items-center gap-0.5 ${atRisk ? 'text-rose-600 font-bold' : 'text-slate-500'}`}>
                      <Calendar size={9} /> {dueDateStr}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="font-semibold text-slate-600">{progress}%</span>
                    {(isGraded || isSubmitted || isDraft) && (
                      <>
                        <span className="text-slate-300">•</span>
                        <span className={`font-bold ${isGraded ? 'text-indigo-600' : isSubmitted ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {isGraded ? `Graded (${submission.score || 'Done'})` : isSubmitted ? 'Submitted' : 'Draft'}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Right: Actions */}
                <div 
                  className="shrink-0 flex items-center gap-1.5" 
                  onClick={(e) => e.stopPropagation()}
                >
                  {hasExternalLink && (
                    <a
                      href={task.description}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-7 px-2 rounded-lg border border-slate-200/80 text-slate-600 hover:bg-slate-50 flex items-center justify-center transition-all shadow-2xs"
                      title="Open Resource"
                    >
                      <ExternalLink size={11} />
                    </a>
                  )}

                  <button
                    onClick={() => handleOpenSubmission(task)}
                    className={`h-7 px-2.5 min-w-[58px] sm:min-w-[64px] rounded-lg text-[11px] font-bold flex items-center justify-center active:scale-95 transition-all shadow-2xs ${
                      isGraded || isSubmitted
                        ? "bg-slate-900 hover:bg-slate-800 text-white"
                        : isDraft
                          ? "bg-amber-500 hover:bg-amber-600 text-white"
                          : "bg-indigo-600 hover:bg-indigo-700 text-white"
                    }`}
                  >
                    {isGraded ? "Graded" : isSubmitted ? "Review" : isDraft ? "Draft" : "Submit"}
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
        const isFinalized = getSubmission(activeAssignment)?.status === "submitted" || getSubmission(activeAssignment)?.status === "graded";

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
                  {"Submit Project"}
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
                    {getSubmission(activeAssignment)?.status === "graded" ? "Project Graded" : "Project Finalized & Submitted"}
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

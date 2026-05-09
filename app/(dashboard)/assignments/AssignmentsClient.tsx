"use client";

import { useState } from "react";
import { 
  PenTool, 
  FileUp,
  BookOpen,
  X,
  Calendar,
  FileText,
  Info,
  CheckCircle2,
  Upload,
  Loader2,
  Clock
} from "lucide-react";
import { createClient as createPublicSupabaseClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";

export default function AssignmentsClient({ initialAssignments, initialSubmissions, studentId }: { initialAssignments: any[], initialSubmissions: any[], studentId: string }) {
  const router = useRouter();
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [isSubmittingModal, setIsSubmittingModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [activeAssignment, setActiveAssignment] = useState<any>(null);
  const [submissionUrl, setSubmissionUrl] = useState("");
  const [submissions, setSubmissions] = useState<any[]>(initialSubmissions);

  const supabase = createPublicSupabaseClient();

  const handleOpenSubmission = (assignment: any) => {
    setActiveAssignment(assignment);
    const existing = initialSubmissions.find(s => s.assignment_id === assignment.id);
    setSubmissionUrl(existing?.content_url || "");
    setIsSubmittingModal(true);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      const { error } = await supabase
        .from("submissions")
        .upsert([{
          assignment_id: activeAssignment.id,
          student_id: studentId,
          content_url: submissionUrl,
          status: 'submitted'
        }], { onConflict: 'assignment_id,student_id' });

      if (error) throw error;
      
      // Update local state
      setSubmissions(prev => [
        ...prev.filter(s => s.assignment_id !== activeAssignment.id),
        {
          assignment_id: activeAssignment.id,
          student_id: studentId,
          content_url: submissionUrl,
          status: 'submitted'
        }
      ]);
      
      setIsSubmittingModal(false);
    } catch (err) {
      console.error("Error submitting assignment:", err);
      alert("Failed to submit assignment");
    } finally {
      setIsUploading(false);
    }
  };

  const coursesList = Array.from(new Set(initialAssignments.map(a => a.courses?.title))).filter(Boolean);
  const filteredAssignments = selectedCourse === "all" 
    ? initialAssignments 
    : initialAssignments.filter(a => a.courses?.title === selectedCourse);

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
          <p className="text-slate-400 font-bold">No assignments found for this course.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden animate-in fade-in duration-500">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-400 text-[9px] uppercase font-black tracking-[0.2em] border-b border-slate-100">
                  <th className="px-6 py-4">Task Title</th>
                  <th className="px-6 py-4">Course</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Due Date</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredAssignments.map((task: any) => (
                  <tr key={task.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                          <PenTool size={16} />
                        </div>
                        <p className="font-black text-slate-900 text-sm">{task.title}</p>
                        {submissions.find(s => s.assignment_id === task.id) && (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[8px] font-black uppercase tracking-widest border border-emerald-100">
                            Completed
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-500">
                      {task.courses?.title}
                    </td>
                    <td className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {new Date(task.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 text-slate-500">
                        <div className="flex items-center gap-2">
                          <Calendar size={12} className="text-amber-500" />
                          <span className="text-xs font-bold">{new Date(task.due_date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock size={12} className="text-indigo-400" />
                          <span className="text-[10px] font-bold">
                            {new Date(task.due_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <button 
                         onClick={() => handleOpenSubmission(task)}
                         disabled={!!submissions.find(s => s.assignment_id === task.id)}
                         className={`inline-flex items-center gap-2 px-4 py-2 text-[10px] font-black rounded-xl transition-all shadow-md active:scale-95 ${
                         submissions.find(s => s.assignment_id === task.id)
                           ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                           : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100"
                       }`}>
                        <FileUp size={12} />
                        {submissions.find(s => s.assignment_id === task.id) ? "Submitted" : "Submit Task"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Submission Modal */}
      {isSubmittingModal && activeAssignment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-300">
            <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
                  <FileUp size={20} />
                </div>
                <div>
                  <h3 className="font-black text-slate-900">Submit Assignment</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{activeAssignment.courses?.title}</p>
                </div>
              </div>
              <button onClick={() => setIsSubmittingModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-all"><X size={20} /></button>
            </div>

            <div className="p-8 space-y-6">
              {/* Assignment Info */}
              <div className="bg-indigo-50/50 rounded-3xl p-6 border border-indigo-100/50">
                <h4 className="text-sm font-black text-slate-900 mb-2 flex items-center gap-2">
                  <Info size={16} className="text-indigo-600" />
                  {activeAssignment.title}
                </h4>
                <div className="prose prose-sm max-h-40 overflow-y-auto pr-2 scrollbar-hide">
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    {activeAssignment.description || "No specific instructions provided for this task."}
                  </p>
                </div>
                <div className="mt-4 pt-4 border-t border-indigo-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-rose-500" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      Due: {new Date(activeAssignment.due_date).toLocaleString()}
                    </span>
                  </div>
                  {submissions.find(s => s.assignment_id === activeAssignment.id) && (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500 text-white rounded-full text-[8px] font-black uppercase tracking-widest">
                      <CheckCircle2 size={10} /> Already Submitted
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
                      <Upload size={18} />
                    </div>
                    <input 
                      required
                      type="url"
                      value={submissionUrl}
                      onChange={(e) => setSubmissionUrl(e.target.value)}
                      placeholder="Paste your Google Drive, Github or Drive link here..."
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:border-indigo-600 focus:bg-white transition-all text-sm font-bold text-slate-900 shadow-inner"
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setIsSubmittingModal(false)}
                    className="flex-1 py-4 bg-slate-50 hover:bg-slate-100 text-slate-600 font-black text-xs uppercase tracking-widest rounded-2xl transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    disabled={isUploading || !!submissions.find(s => s.assignment_id === activeAssignment.id)}
                    className="flex-[2] py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-indigo-100 disabled:opacity-50 disabled:bg-slate-200 disabled:text-slate-400 flex items-center justify-center gap-2"
                  >
                    {isUploading ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      <CheckCircle2 size={18} />
                    )}
                    {submissions.find(s => s.assignment_id === activeAssignment.id) ? "Already Submitted" : "Submit Assignment"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

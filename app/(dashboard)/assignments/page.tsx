import { 
  PenTool, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  FileUp,
  ChevronRight
} from "lucide-react";

export default function AssignmentsPage() {
  const assignments: any[] = [];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-1">Assignments</h1>
        <p className="text-sm text-slate-500 font-medium">Keep track of your tasks and submission deadlines.</p>
      </section>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-[9px] uppercase font-black tracking-[0.2em] border-b border-slate-100">
                <th className="px-6 py-4">Task Title</th>
                <th className="px-6 py-4">Due Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {assignments.map((task) => (
                <tr key={task.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                        <PenTool size={16} />
                      </div>
                      <p className="font-black text-slate-900 text-sm">{task.title}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Clock size={12} />
                      <span className="text-xs font-bold">{new Date(task.dueDate).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                      task.status === 'Submitted' 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                        : 'bg-amber-50 text-amber-700 border border-amber-100'
                    }`}>
                      {task.status === 'Submitted' ? <CheckCircle size={10} /> : <AlertCircle size={10} />}
                      {task.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {task.status === 'Submitted' ? (
                      <div className="text-right">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Score</p>
                        <p className="text-xs font-black text-emerald-600">{task.score}</p>
                      </div>
                    ) : (
                      <button className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black rounded-xl transition-all shadow-md">
                        <FileUp size={12} />
                        Submit Task
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {assignments.length === 0 && (
        <div className="p-20 text-center bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
          <p className="text-slate-400 font-bold">No assignments available yet.</p>
        </div>
      )}
    </div>
  );
}

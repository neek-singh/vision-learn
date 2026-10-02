"use client";

import { useState, useRef, useEffect, useCallback, useMemo, ReactNode } from "react";
import dynamic from "next/dynamic";
import {
  Send,
  ChevronDown,
  X,
  Copy,
  Check,
  RotateCcw,
  Lightbulb,
  Code2,
  HelpCircle,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  FileSpreadsheet,
  Plus,
  Trash2,
  Maximize2,
  Minimize2,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  Zap,
  Crown,
  Settings,
  Globe,
  ChevronRight,
  User,
  ExternalLink,
  Download,
  Camera,
  Image as ImageIcon,
  SwitchCamera,
  Brain,
  Loader2,
  CheckCircle2,
  Pencil,
} from "lucide-react";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

const SyntaxHighlighter = dynamic(
  () => import("react-syntax-highlighter").then((mod) => mod.Prism),
  {
    ssr: false,
    loading: () => (
      <div className="p-3 bg-[#1e1e2e] text-xs font-mono text-slate-400 rounded-xl">
        Loading code...
      </div>
    ),
  }
);

// ─── Types ───────────────────────────────────────────────────────────────────

export type ModelTier = "vision" | "vision-pro" | "vision-elite";
export type PluginType = "notes" | "quiz" | "coder" | "study";

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  instructor: string;
}

interface Material {
  id: string;
  course_id: string;
  title: string;
  type: string;
  content_url: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "model";
  content: string;
  timestamp: string;
  modelUsed?: ModelTier;
  pluginUsed?: PluginType | null;
  imageUrl?: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  modelTier: ModelTier;
  courseId?: string;
}

interface Props {
  studentId?: string;
  studentName: string;
  courses: Course[];
  materials: Material[];
}

// ─── Model Config ─────────────────────────────────────────────────────────────

const MODEL_TIERS: {
  id: ModelTier;
  name: string;
  badge: string;
  icon: any;
  desc: string;
}[] = [
  {
    id: "vision",
    name: "Vision",
    badge: "Fast",
    icon: Zap,
    desc: "Instant definitions, quick answers & rapid doubts",
  },
  {
    id: "vision-pro",
    name: "Vision Pro",
    badge: "Default",
    icon: Sparkles,
    desc: "Balanced intelligence, step-by-step logic & coding",
  },
  {
    id: "vision-elite",
    name: "Vision Elite",
    badge: "Master",
    icon: Crown,
    desc: "Deep reasoning, full viva mastery & architectures",
  },
];

// ─── Plugins Config ───────────────────────────────────────────────────────────

const PLUGINS: {
  id: PluginType;
  tag: string;
  name: string;
  icon: any;
  desc: string;
}[] = [
  {
    id: "study",
    tag: "@study",
    name: "Study",
    icon: Lightbulb,
    desc: "Deep concept explanation with analogies",
  },
  {
    id: "coder",
    tag: "@coder",
    name: "Coder",
    icon: Code2,
    desc: "Code snippets, debugging & clean code",
  },
  {
    id: "quiz",
    tag: "@quiz",
    name: "Quiz",
    icon: HelpCircle,
    desc: "Interactive practice MCQs with scoring",
  },
  {
    id: "notes",
    tag: "@notes",
    name: "Notes",
    icon: FileSpreadsheet,
    desc: "Exam revision notes & formula sheets",
  },
];

// ─── IndexedDB Permanent Storage ──────────────────────────────────────────────

const IDB_NAME = "VisionLearnPermanentChatDB";
const IDB_VERSION = 1;
const IDB_STORE = "sessions";

function openChatIDB(): Promise<IDBDatabase | null> {
  if (typeof window === "undefined" || !("indexedDB" in window)) return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(IDB_NAME, IDB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE, { keyPath: "id" });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function saveSessionsToIDB(sessions: ChatSession[]): Promise<void> {
  const db = await openChatIDB();
  if (!db) return;
  try {
    const tx = db.transaction(IDB_STORE, "readwrite");
    const store = tx.objectStore(IDB_STORE);
    store.clear();
    sessions.forEach((s) => store.put(s));
  } catch (err) {
    console.warn("Failed to persist to IndexedDB:", err);
  }
}

async function loadSessionsFromIDB(): Promise<ChatSession[]> {
  const db = await openChatIDB();
  if (!db) return [];
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, "readonly");
      const store = tx.objectStore(IDB_STORE);
      const req = store.getAll();
      req.onsuccess = () => {
        const items = req.result || [];
        items.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        resolve(items);
      };
      req.onerror = () => resolve([]);
    } catch {
      resolve([]);
    }
  });
}

// ─── Markdown Renderer ────────────────────────────────────────────────────────

function MarkdownMessage({
  content,
  onOptionClick,
}: {
  content: string;
  onOptionClick: (option: string) => void;
}) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [selectedOpt, setSelectedOpt] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOptionSubmit = (opt: string) => {
    if (isSubmitting || selectedOpt) return;
    setSelectedOpt(opt);
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      onOptionClick(`My answer is: ${opt}`);
    }, 450);
  };

  const parts = useMemo(() => {
    const regex = /```(\w*)\n([\s\S]*?)```/g;
    const segments: Array<
      | { type: "code"; lang: string; code: string }
      | { type: "text"; text: string }
    > = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        segments.push({
          type: "text",
          text: content.substring(lastIndex, match.index),
        });
      }
      segments.push({
        type: "code",
        lang: match[1] || "text",
        code: match[2].trimEnd(),
      });
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < content.length) {
      segments.push({
        type: "text",
        text: content.substring(lastIndex),
      });
    }

    return segments;
  }, [content]);

  const quizOptions = useMemo(() => {
    const detected: string[] = [];
    const optionMatches = content.match(
      /(?:^|\n)\s*(?:[-*]\s*)?([A-D]\s*[\)\.]\s*[^\n]+)/gi
    );
    if (optionMatches && optionMatches.length >= 2) {
      optionMatches.forEach((opt) => {
        const clean = opt.replace(/^[\s\n-*]+/, "").trim();
        if (clean) detected.push(clean);
      });
    }
    return detected;
  }, [content]);

  const copyCode = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const parseInline = (text: string): ReactNode => {
    const partsList: ReactNode[] = [];
    const combinedRegex = /(\[[^\]]+\]\(https?:\/\/[^\s\)]+\)|https?:\/\/[^\s\)]+|`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
    let match;
    let lastPos = 0;
    let keyIdx = 0;

    while ((match = combinedRegex.exec(text)) !== null) {
      if (match.index > lastPos) {
        partsList.push(text.substring(lastPos, match.index));
      }

      const matchStr = match[0];

      // Markdown Link: [Title](https://...)
      const mdLinkMatch = matchStr.match(/^\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)$/);
      if (mdLinkMatch) {
        const linkText = mdLinkMatch[1];
        const href = mdLinkMatch[2];
        partsList.push(
          <a
            key={keyIdx++}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 text-indigo-600 hover:text-indigo-800 font-semibold underline decoration-indigo-400 hover:decoration-indigo-600 underline-offset-2 transition-colors cursor-pointer"
          >
            <span>{linkText}</span>
            <ExternalLink size={11} className="inline shrink-0" />
          </a>
        );
      } else if (matchStr.startsWith("http://") || matchStr.startsWith("https://")) {
        // Raw URL: https://...
        partsList.push(
          <a
            key={keyIdx++}
            href={matchStr}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 text-indigo-600 hover:text-indigo-800 font-medium underline decoration-indigo-300 hover:decoration-indigo-600 underline-offset-2 break-all transition-colors cursor-pointer"
          >
            <span>{matchStr}</span>
            <ExternalLink size={11} className="inline shrink-0" />
          </a>
        );
      } else if (matchStr.startsWith("`") && matchStr.endsWith("`")) {
        partsList.push(
          <code
            key={keyIdx++}
            className="px-1.5 py-0.5 mx-0.5 bg-slate-100 text-slate-800 font-mono text-[12px] rounded font-medium"
          >
            {matchStr.slice(1, -1)}
          </code>
        );
      } else if (matchStr.startsWith("**") && matchStr.endsWith("**")) {
        partsList.push(
          <strong key={keyIdx++} className="font-semibold text-slate-900">
            {matchStr.slice(2, -2)}
          </strong>
        );
      } else if (matchStr.startsWith("*") && matchStr.endsWith("*")) {
        partsList.push(
          <em key={keyIdx++} className="italic text-slate-700">
            {matchStr.slice(1, -1)}
          </em>
        );
      }

      lastPos = combinedRegex.lastIndex;
    }

    if (lastPos < text.length) {
      partsList.push(text.substring(lastPos));
    }

    return partsList.length > 0 ? partsList : text;
  };

  const renderFormattedText = (rawText: string) => {
    const lines = rawText.split("\n");
    return lines.map((line, lIdx) => {
      const trimmed = line.trim();
      if (!trimmed) {
        return <div key={lIdx} className="h-2" />;
      }

      if (trimmed.startsWith("### ")) {
        return (
          <h4 key={lIdx} className="text-sm font-semibold text-slate-900 mt-3 mb-1">
            {parseInline(trimmed.replace(/^###\s+/, ""))}
          </h4>
        );
      }
      if (trimmed.startsWith("## ")) {
        return (
          <h3 key={lIdx} className="text-base font-bold text-slate-900 mt-4 mb-1.5">
            {parseInline(trimmed.replace(/^##\s+/, ""))}
          </h3>
        );
      }
      if (trimmed.startsWith("# ")) {
        return (
          <h2 key={lIdx} className="text-lg font-bold text-slate-900 mt-4 mb-2">
            {parseInline(trimmed.replace(/^#\s+/, ""))}
          </h2>
        );
      }

      if (trimmed.startsWith("> ")) {
        return (
          <blockquote key={lIdx} className="border-l-2 border-slate-300 pl-3 my-2 text-slate-600 italic">
            {parseInline(trimmed.replace(/^>\s+/, ""))}
          </blockquote>
        );
      }

      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        return (
          <div key={lIdx} className="flex items-start gap-2 my-1 pl-1 text-slate-800">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 shrink-0" />
            <span className="flex-1 leading-relaxed text-[14px]">
              {parseInline(trimmed.replace(/^[-*]\s+/, ""))}
            </span>
          </div>
        );
      }

      const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
      if (numMatch) {
        return (
          <div key={lIdx} className="flex items-start gap-2 my-1 pl-1 text-slate-800">
            <span className="text-xs font-semibold text-slate-500 shrink-0 mt-0.5">
              {numMatch[1]}.
            </span>
            <span className="flex-1 leading-relaxed text-[14px]">
              {parseInline(numMatch[2])}
            </span>
          </div>
        );
      }

      return (
        <p key={lIdx} className="my-1 text-slate-800 leading-relaxed text-[14px]">
          {parseInline(line)}
        </p>
      );
    });
  };

  return (
    <div className="space-y-1.5">
      {parts.map((part, idx) => {
        if (part.type === "text") {
          return <div key={idx}>{renderFormattedText(part.text)}</div>;
        }

        return (
          <div
            key={idx}
            className="my-3 rounded-xl overflow-hidden border border-slate-200/90 bg-[#181825] shadow-xs"
          >
            <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#12121e] border-b border-slate-800">
              <span className="text-[11px] font-mono text-slate-400 lowercase">
                {part.lang || "code"}
              </span>
              <button
                onClick={() => copyCode(part.code, idx)}
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white px-2 py-0.5 rounded transition-colors cursor-pointer"
              >
                {copiedIndex === idx ? (
                  <>
                    <Check size={12} className="text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy size={12} />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            <SyntaxHighlighter
              language={part.lang || "javascript"}
              style={oneDark}
              customStyle={{
                margin: 0,
                padding: "12px 16px",
                fontSize: 12.5,
                lineHeight: 1.6,
                background: "#181825",
                maxHeight: "380px",
                overflowX: "auto",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              }}
              wrapLines
              wrapLongLines={false}
            >
              {part.code}
            </SyntaxHighlighter>
          </div>
        );
      })}

      {quizOptions.length > 0 && (
        <div className="mt-3 p-3 sm:p-3.5 bg-gradient-to-br from-slate-50 via-slate-50 to-indigo-50/20 border border-slate-200/90 rounded-2xl shadow-xs transition-all">
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <span>Select an answer:</span>
            </p>
            {selectedOpt && (
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 animate-in fade-in zoom-in-95 duration-200">
                <CheckCircle2 size={11} /> Answer Submitted
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {quizOptions.map((opt, oIdx) => {
              const letter = opt.slice(0, 1).toUpperCase();
              const isSelected = selectedOpt === opt;
              const hasSelection = Boolean(selectedOpt);

              return (
                <button
                  key={oIdx}
                  type="button"
                  disabled={hasSelection}
                  onClick={() => handleOptionSubmit(opt)}
                  className={`group relative flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all duration-300 text-xs font-medium overflow-hidden ${
                    isSelected
                      ? isSubmitting
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-md scale-[1.02] ring-4 ring-indigo-200/60"
                        : "bg-emerald-50 text-emerald-950 border-emerald-500 shadow-xs ring-2 ring-emerald-200"
                      : hasSelection
                      ? "bg-white/60 text-slate-400 border-slate-200/60 opacity-50 cursor-not-allowed scale-[0.98]"
                      : "bg-white text-slate-800 border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 hover:shadow-sm hover:scale-[1.01] active:scale-[0.98] cursor-pointer"
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-lg font-bold flex items-center justify-center text-[11px] shrink-0 transition-all duration-300 ${
                      isSelected
                        ? isSubmitting
                          ? "bg-white/20 text-white"
                          : "bg-emerald-600 text-white"
                        : "bg-slate-100 text-slate-700 group-hover:bg-indigo-100 group-hover:text-indigo-700"
                    }`}
                  >
                    {isSelected ? (
                      isSubmitting ? (
                        <Loader2 size={13} className="animate-spin text-white" />
                      ) : (
                        <Check size={13} className="stroke-[3]" />
                      )
                    ) : (
                      letter
                    )}
                  </span>

                  <span className="truncate flex-1 font-medium">{opt}</span>

                  {isSelected && (
                    <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded transition-all">
                      {isSubmitting ? (
                        <span className="flex items-center gap-1 text-white animate-pulse">
                          Submitting...
                        </span>
                      ) : (
                        <span className="text-emerald-700 flex items-center gap-0.5">
                          Submitted
                        </span>
                      )}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Image Compression Helper ───────────────────────────────────────────────
function compressImage(file: File, maxDim = 1200, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AITutorClient({ studentId, studentName, courses }: Props) {
  const storageKey = useMemo(() => {
    return studentId ? `vision_ai_sessions_${studentId}` : "vision_ai_sessions_default";
  }, [studentId]);

  const modelStorageKey = useMemo(() => {
    return studentId ? `vision_ai_model_${studentId}` : "vision_ai_model_default";
  }, [studentId]);

  const memoryStorageKey = useMemo(() => {
    return studentId ? `vision_ai_memories_${studentId}` : "vision_ai_memories_default";
  }, [studentId]);

  // Student long-term memory
  const [memories, setMemories] = useState<string[]>([]);
  const [newMemoryInput, setNewMemoryInput] = useState("");

  const saveMemories = useCallback((newMemories: string[]) => {
    setMemories(newMemories);
    try {
      localStorage.setItem(memoryStorageKey, JSON.stringify(newMemories));
    } catch {}
  }, [memoryStorageKey]);

  // Model tier
  const [modelTier, setModelTier] = useState<ModelTier>("vision-pro");
  const [showModelDropdown, setShowModelDropdown] = useState(false);

  // Active plugin (@notes, @quiz, @coder, @study)
  const [activePlugin, setActivePlugin] = useState<PluginType | null>(null);

  // Plugin popup menu triggered by typing @ or clicking +
  const [showPluginMenu, setShowPluginMenu] = useState(false);
  const [menuTriggerSource, setMenuTriggerSource] = useState<"plus" | "at" | null>(null);
  const [pluginFilter, setPluginFilter] = useState("");
  const [selectedPluginIndex, setSelectedPluginIndex] = useState(0);

  // Sessions state
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Rename & Title dropdown states
  const [showTitleMenu, setShowTitleMenu] = useState(false);
  const [isRenamingTitle, setIsRenamingTitle] = useState(false);
  const [renamedTitle, setRenamedTitle] = useState("");
  const renameInputRef = useRef<HTMLInputElement>(null);

  // Active messages
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Layout & UI
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Speech & Audio
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  // Profile Menu, Settings & Help Modals
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showLanguageSubmenu, setShowLanguageSubmenu] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("hinglish");
  const [responseTone, setResponseTone] = useState<string>("balanced");
  const [customInstructions, setCustomInstructions] = useState<string>("");
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Camera & Image Attachment
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraFacing, setCameraFacing] = useState<"environment" | "user">("environment");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const startCamera = async (facing: "environment" | "user" = "environment") => {
    try {
      if (cameraStream) {
        cameraStream.getTracks().forEach((t) => t.stop());
      }
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }
      setCameraStream(stream);
      setCameraFacing(facing);
      setShowCameraModal(true);
    } catch {
      alert("Camera access denied or not available. Please allow camera permissions in your browser.");
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((t) => t.stop());
      setCameraStream(null);
    }
    setShowCameraModal(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.88);
      setAttachedImage(dataUrl);
    }
    stopCamera();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      setAttachedImage(compressed);
    } catch (err) {
      console.error("Image read failed:", err);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  useEffect(() => {
    if (showCameraModal && cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().catch(() => {});
    }
  }, [showCameraModal, cameraStream]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const filteredPlugins = useMemo(() => {
    if (!pluginFilter) return PLUGINS;
    const lower = pluginFilter.toLowerCase();
    return PLUGINS.filter(
      (p) =>
        p.id.toLowerCase().includes(lower) ||
        p.tag.toLowerCase().includes(lower) ||
        p.name.toLowerCase().includes(lower)
    );
  }, [pluginFilter]);

  // Load from Storage & IndexedDB
  useEffect(() => {
    async function initHistory() {
      try {
        const savedModel = localStorage.getItem(modelStorageKey) as ModelTier | null;
        if (savedModel && ["vision", "vision-pro", "vision-elite"].includes(savedModel)) {
          setModelTier(savedModel);
        }

        const savedLang = localStorage.getItem("vision_ai_language");
        if (savedLang) setSelectedLanguage(savedLang);

        const savedTone = localStorage.getItem("vision_ai_tone");
        if (savedTone) setResponseTone(savedTone);

        const savedInstructions = localStorage.getItem("vision_ai_custom_instructions");
        if (savedInstructions) setCustomInstructions(savedInstructions);

        const rawMemories = localStorage.getItem(memoryStorageKey);
        if (rawMemories) {
          try {
            setMemories(JSON.parse(rawMemories));
          } catch {}
        }

        let loaded: ChatSession[] = [];
        const raw = localStorage.getItem(storageKey);
        if (raw) {
          try {
            loaded = JSON.parse(raw);
          } catch {}
        }

        if (!loaded || loaded.length === 0) {
          const fromIDB = await loadSessionsFromIDB();
          if (fromIDB.length > 0) {
            loaded = fromIDB;
            try {
              localStorage.setItem(storageKey, JSON.stringify(fromIDB));
            } catch {}
          }
        }

        if (Array.isArray(loaded) && loaded.length > 0) {
          setSessions(loaded);
          // Always open a fresh new chat when visiting AI Tutor
          setActiveSessionId(null);
          setMessages([]);
        }
      } catch (e) {
        console.error("Failed to load history:", e);
      }
    }
    initHistory();
  }, [storageKey, modelStorageKey, memoryStorageKey]);

  // Global shortcut: Ctrl+Shift+, (or Cmd+Shift+,) for Settings
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "," || e.key === "<")) {
        e.preventDefault();
        setShowSettingsModal((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Click outside to close profile popup menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
        setShowLanguageSubmenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const changeModelTier = (tier: ModelTier) => {
    setModelTier(tier);
    setShowModelDropdown(false);
    try {
      localStorage.setItem(modelStorageKey, tier);
    } catch {}
  };

  const saveSessions = useCallback(
    (updated: ChatSession[]) => {
      setSessions(updated);
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (e) {
        console.error("Storage error:", e);
      }
      saveSessionsToIDB(updated);
    },
    [storageKey]
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) setSpeechSupported(true);
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-dropdown]")) {
        setShowModelDropdown(false);
      }
      if (!target.closest("[data-plugin-menu]")) {
        setShowPluginMenu(false);
        setMenuTriggerSource(null);
      }
      if (!target.closest("[data-title-menu]")) {
        setShowTitleMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // ── Session Controls ──
  const startNewChat = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setActiveSessionId(null);
    setMessages([]);
    setInput("");
    setActivePlugin(null);
    setSpeakingMsgId(null);
    if (inputRef.current) inputRef.current.focus();
  }, []);

  const selectSession = useCallback((session: ChatSession) => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setActiveSessionId(session.id);
    setMessages(session.messages || []);
    if (session.modelTier) setModelTier(session.modelTier);
    setActivePlugin(null);
    setSpeakingMsgId(null);
  }, []);

  const deleteSession = useCallback(
    (e: React.MouseEvent, id: string, title: string) => {
      e.stopPropagation();
      const confirmed = window.confirm(`Delete chat "${title || "this chat"}"?`);
      if (!confirmed) return;

      const updated = sessions.filter((s) => s.id !== id);
      saveSessions(updated);

      if (activeSessionId === id) {
        if (updated.length > 0) {
          selectSession(updated[0]);
        } else {
          startNewChat();
        }
      }
    },
    [sessions, activeSessionId, saveSessions, selectSession, startNewChat]
  );

  const handleSaveRename = useCallback(() => {
    const trimmed = renamedTitle.trim();
    if (!trimmed) {
      setIsRenamingTitle(false);
      return;
    }

    const nowIso = new Date().toISOString();
    const updated = sessions.map((s) => {
      if (s.id === activeSessionId) {
        return { ...s, title: trimmed, updatedAt: nowIso };
      }
      return s;
    });

    if (!sessions.some((s) => s.id === activeSessionId)) {
      if (activeSessionId) {
        const newSession: ChatSession = {
          id: activeSessionId,
          title: trimmed,
          messages: messages,
          createdAt: nowIso,
          updatedAt: nowIso,
          modelTier: modelTier,
        };
        saveSessions([newSession, ...sessions]);
      }
    } else {
      saveSessions(updated);
    }

    setIsRenamingTitle(false);
  }, [renamedTitle, sessions, activeSessionId, messages, modelTier, saveSessions]);

  const attachPlugin = useCallback((pluginId: PluginType) => {
    setActivePlugin(pluginId);
    setShowPluginMenu(false);
    setMenuTriggerSource(null);
    if (inputRef.current) {
      const text = inputRef.current.value;
      const cleaned = text.replace(/@\w*$/, "").trim();
      setInput(cleaned ? `${cleaned} ` : "");
      inputRef.current.focus();
    }
  }, []);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInput(val);
    e.target.style.height = "40px";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`;

    const cursorPos = e.target.selectionStart;
    const textBefore = val.slice(0, cursorPos);
    const atMatch = textBefore.match(/@(\w*)$/);

    if (atMatch) {
      setShowPluginMenu(true);
      setMenuTriggerSource("at");
      setPluginFilter(atMatch[1]);
      setSelectedPluginIndex(0);
    } else {
      if (menuTriggerSource === "at") {
        setShowPluginMenu(false);
        setMenuTriggerSource(null);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showPluginMenu && menuTriggerSource === "at" && filteredPlugins.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedPluginIndex((prev) => (prev + 1) % filteredPlugins.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedPluginIndex((prev) => (prev - 1 + filteredPlugins.length) % filteredPlugins.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        attachPlugin(filteredPlugins[selectedPluginIndex].id);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setShowPluginMenu(false);
        setMenuTriggerSource(null);
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  // ── Speech-to-Text ──
  const toggleListening = () => {
    if (!speechSupported) {
      alert("Speech Recognition not supported in this browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "hi-IN";

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((r: any) => r[0].transcript)
          .join("");
        setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  // ── Text-to-Speech ──
  const toggleSpeak = (msgId: string, text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }

    window.speechSynthesis.cancel();

    const cleanSpeech = text
      .replace(/```[\s\S]*?```/g, "Code block omitted.")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/[*#_~]/g, "")
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanSpeech);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const preferredVoice =
      voices.find((v) => v.lang.includes("hi-IN")) ||
      voices.find((v) => v.lang.includes("en-IN")) ||
      voices.find((v) => v.lang.includes("en-US"));
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);

    setSpeakingMsgId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  // ── Send Message ──
  const sendMessage = useCallback(
    async (messageText: string) => {
      const trimmed = messageText.trim();
      if ((!trimmed && !attachedImage) || isLoading) return;

      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        setSpeakingMsgId(null);
      }

      const imageToSend = attachedImage;
      setAttachedImage(null);

      let pluginToSend = activePlugin;
      let cleanedText = trimmed;
      for (const p of PLUGINS) {
        if (trimmed.startsWith(p.tag)) {
          pluginToSend = p.id;
          cleanedText = trimmed.replace(p.tag, "").trim();
          break;
        }
      }

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: trimmed || (imageToSend ? "Photo attached for analysis" : ""),
        timestamp: new Date().toISOString(),
        modelUsed: modelTier,
        pluginUsed: pluginToSend,
        imageUrl: imageToSend || undefined,
      };

      const updatedMessages = [...messages, userMsg];
      setMessages(updatedMessages);
      setInput("");
      setIsLoading(true);

      if (inputRef.current) {
        inputRef.current.style.height = "40px";
      }

      let currentSessionId = activeSessionId;
      let newSessions = [...sessions];

      if (!currentSessionId) {
        currentSessionId = `session-${Date.now()}`;
        setActiveSessionId(currentSessionId);
        const newSession: ChatSession = {
          id: currentSessionId,
          title: (trimmed || (imageToSend ? "Photo Analysis" : "New Chat")).slice(0, 36) + (trimmed.length > 36 ? "..." : ""),
          messages: updatedMessages,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          modelTier,
        };
        newSessions = [newSession, ...newSessions];
        saveSessions(newSessions);
      } else {
        newSessions = newSessions.map((s) =>
          s.id === currentSessionId
            ? {
                ...s,
                messages: updatedMessages,
                updatedAt: new Date().toISOString(),
                modelTier,
              }
            : s
        );
        saveSessions(newSessions);
      }

      try {
        const history = messages.slice(-10).map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const res = await fetch("/api/ai-tutor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: cleanedText || trimmed || (imageToSend ? "Please analyze this uploaded photo and explain the concepts or solve the problem shown." : ""),
            history,
            modelTier,
            activePlugin: pluginToSend,
            preferredLanguage: selectedLanguage,
            customInstructions: customInstructions.trim() || undefined,
            imageUrl: imageToSend || undefined,
            studentMemories: memories,
          }),
        });

        const data = await res.json();

        let rawReply = data.reply || data.error || "Something went wrong. Please try again.";

        // Autonomous memory extraction: AI emits [REMEMBER: fact]
        const rememberMatches = rawReply.match(/\[REMEMBER:\s*([^\]]+)\]/gi);
        if (rememberMatches && rememberMatches.length > 0) {
          const newFacts: string[] = [];
          rememberMatches.forEach((tag: string) => {
            const m = tag.match(/\[REMEMBER:\s*([^\]]+)\]/i);
            if (m && m[1]) {
              const fact = m[1].trim();
              if (fact && !memories.includes(fact) && !newFacts.includes(fact)) {
                newFacts.push(fact);
              }
            }
          });
          if (newFacts.length > 0) {
            const updated = [...memories, ...newFacts];
            saveMemories(updated);
          }
          rawReply = rawReply.replace(/\[REMEMBER:\s*[^\]]+\]/gi, "").trim();
        }

        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: "model",
          content: rawReply,
          timestamp: new Date().toISOString(),
          modelUsed: modelTier,
          pluginUsed: pluginToSend,
        };

        const finalMessages = [...updatedMessages, aiMsg];
        setMessages(finalMessages);

        const updatedWithAi = newSessions.map((s) =>
          s.id === currentSessionId
            ? {
                ...s,
                messages: finalMessages,
                updatedAt: new Date().toISOString(),
              }
            : s
        );
        saveSessions(updatedWithAi);
      } catch {
        const errMsg: ChatMessage = {
          id: `err-${Date.now()}`,
          role: "model",
          content: "Network issue. Please check your connection and try again.",
          timestamp: new Date().toISOString(),
          modelUsed: modelTier,
          pluginUsed: pluginToSend,
        };
        const finalMessages = [...updatedMessages, errMsg];
        setMessages(finalMessages);
      } finally {
        setIsLoading(false);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    },
    [isLoading, messages, activeSessionId, sessions, saveSessions, modelTier, activePlugin, selectedLanguage, customInstructions, memories, saveMemories, attachedImage]
  );

  const copyMessage = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const activeSessionTitle = useMemo(() => {
    const s = sessions.find((item) => item.id === activeSessionId);
    return s?.title || "New Chat";
  }, [sessions, activeSessionId]);

  const currentModelConfig =
    MODEL_TIERS.find((m) => m.id === modelTier) || MODEL_TIERS[1];
  const currentPluginConfig = activePlugin
    ? PLUGINS.find((p) => p.id === activePlugin)
    : null;

  return (
    <>
      <style>{`
        .claude-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .claude-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .claude-scroll::-webkit-scrollbar-thumb {
          background: rgba(150, 150, 150, 0.2);
          border-radius: 4px;
        }
        .claude-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(150, 150, 150, 0.4);
        }
      `}</style>

      {/* ── Main Container: Simple Claude Style ── */}
      <div
        className={`flex w-full bg-white text-slate-800 font-sans ${
          isFullscreen
            ? "fixed inset-0 z-[100] h-screen w-screen overflow-hidden"
            : "h-full flex-1 overflow-hidden"
        }`}
      >
        {/* ── Left Sidebar (Claude Style) ── */}
        <aside
          className={`flex flex-col bg-[#fafaf9] border-r border-slate-200/80 transition-all duration-200 shrink-0 z-20 ${
            isSidebarOpen
              ? "w-60 sm:w-64"
              : "w-0 -translate-x-full lg:w-0 lg:translate-x-0 overflow-hidden border-none"
          }`}
        >
          {/* Top Brand & New Chat */}
          <div className="p-3">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-base font-semibold text-slate-900 tracking-tight">
                Vision AI
              </span>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors cursor-pointer"
                title="Close sidebar"
              >
                <PanelLeftClose size={16} />
              </button>
            </div>

            {/* + New Button */}
            <button
              onClick={startNewChat}
              className="w-full flex items-center gap-2 py-1.5 px-3 bg-white hover:bg-slate-100/80 text-slate-700 rounded-lg text-xs font-medium border border-slate-200 shadow-2xs transition-colors cursor-pointer"
            >
              <Plus size={14} className="text-slate-500" />
              <span>New chat</span>
            </button>
          </div>

          {/* Chats and tasks list */}
          <div className="flex-1 overflow-y-auto claude-scroll px-2 py-1 space-y-0.5">
            <div className="px-2 py-1.5 text-[11px] font-medium text-slate-400">
              Chats and tasks
            </div>

            {sessions.length === 0 ? (
              <div className="px-2 py-6 text-center text-xs text-slate-400">
                No past chats yet.
              </div>
            ) : (
              sessions.map((s) => {
                const isActive = activeSessionId === s.id;
                return (
                  <div
                    key={s.id}
                    onClick={() => selectSession(s)}
                    className={`group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                      isActive
                        ? "bg-[#eeeee9] text-slate-900 font-medium"
                        : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-900"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isActive ? "bg-slate-800" : "bg-transparent"}`} />
                      <span className="truncate">{s.title || "Chat"}</span>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          selectSession(s);
                          setRenamedTitle(s.title);
                          setIsRenamingTitle(true);
                          setTimeout(() => renameInputRef.current?.select(), 50);
                        }}
                        className="text-slate-400 hover:text-slate-700 p-0.5 rounded transition-colors"
                        title="Rename chat"
                      >
                        <Pencil size={11} />
                      </button>
                      <button
                        onClick={(e) => deleteSession(e, s.id, s.title)}
                        className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition-colors"
                        title="Delete chat"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Bottom Student Profile */}
          <div className="p-2 border-t border-slate-200/80 relative" ref={profileMenuRef}>
            {/* Dark Profile Popup Menu (matching user's screenshot) */}
            {showProfileMenu && (
              <div className="absolute bottom-full left-2 right-2 mb-2 bg-[#1b1b1b] text-slate-200 rounded-xl shadow-2xl border border-[#2e2e2e] py-1 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150 select-none">
                {/* Settings */}
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    setShowLanguageSubmenu(false);
                    setShowSettingsModal(true);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-200 hover:bg-[#282828] rounded-lg transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Settings size={15} className="text-slate-300" />
                    <span className="font-normal text-[13px] text-slate-100">Settings</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono tracking-tight">Ctrl+Shift+,</span>
                </button>

                {/* Language */}
                <div className="relative">
                  <button
                    onClick={() => setShowLanguageSubmenu((prev) => !prev)}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-200 hover:bg-[#282828] rounded-lg transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Globe size={15} className="text-slate-300" />
                      <span className="font-normal text-[13px] text-slate-100">Language</span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-slate-400">
                      <span>{selectedLanguage === "hi" ? "हिन्दी" : selectedLanguage === "en" ? "English" : "Hinglish"}</span>
                      <ChevronRight size={12} />
                    </div>
                  </button>

                  {/* Language Flyout Submenu */}
                  {showLanguageSubmenu && (
                    <div className="absolute bottom-0 left-full ml-1 w-40 bg-[#222222] border border-[#333333] rounded-xl shadow-2xl py-1 z-50">
                      {[
                        { id: "hinglish", label: "Hinglish (Mix)" },
                        { id: "en", label: "English" },
                        { id: "hi", label: "हिन्दी (Hindi)" },
                      ].map((lang) => (
                        <button
                          key={lang.id}
                          onClick={() => {
                            setSelectedLanguage(lang.id);
                            try {
                              localStorage.setItem("vision_ai_language", lang.id);
                            } catch {}
                            setShowLanguageSubmenu(false);
                            setShowProfileMenu(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-[#2f2f2f] transition-colors cursor-pointer ${
                            selectedLanguage === lang.id ? "text-indigo-400 font-semibold" : "text-slate-300"
                          }`}
                        >
                          <span>{lang.label}</span>
                          {selectedLanguage === lang.id && <Check size={12} />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Get help */}
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    setShowLanguageSubmenu(false);
                    setShowHelpModal(true);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-200 hover:bg-[#282828] rounded-lg transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <HelpCircle size={15} className="text-slate-300" />
                    <span className="font-normal text-[13px] text-slate-100">Get help</span>
                  </div>
                </button>
              </div>
            )}

            {/* Profile trigger button */}
            <button
              onClick={() => {
                setShowProfileMenu((prev) => !prev);
                setShowLanguageSubmenu(false);
              }}
              className={`w-full flex items-center justify-between p-2 rounded-lg text-xs text-slate-700 hover:bg-slate-200/70 transition-colors cursor-pointer ${
                showProfileMenu ? "bg-slate-200/80" : ""
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-full bg-slate-300 text-slate-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                  {studentName ? studentName[0].toUpperCase() : "S"}
                </div>
                <span className="truncate font-medium text-slate-800">{studentName} · Free</span>
              </div>
            </button>
          </div>
        </aside>

        {/* ── Main Chat Area (Claude Simple Canvas) ── */}
        <div className="flex-1 flex flex-col h-full min-w-0 bg-white">
          
          {/* ── Simple Top Header ── */}
          <header className="h-12 border-b border-slate-100 px-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              {!isSidebarOpen && (
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="p-1 text-slate-500 hover:text-slate-800 rounded transition-colors cursor-pointer mr-1"
                  title="Open sidebar"
                >
                  <PanelLeftOpen size={16} />
                </button>
              )}

              {/* Chat Title with Dropdown & Rename Feature */}
              {isRenamingTitle ? (
                <div className="flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-150">
                  <input
                    ref={renameInputRef}
                    type="text"
                    value={renamedTitle}
                    onChange={(e) => setRenamedTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveRename();
                      if (e.key === "Escape") setIsRenamingTitle(false);
                    }}
                    placeholder="Enter chat title..."
                    className="text-xs font-semibold text-slate-800 bg-white border border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 rounded-md px-2 py-1 w-36 sm:w-56 shadow-2xs"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveRename}
                    className="p-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors cursor-pointer"
                    title="Save name"
                  >
                    <Check size={14} className="stroke-[2.5]" />
                  </button>
                  <button
                    onClick={() => setIsRenamingTitle(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                    title="Cancel"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="relative" data-title-menu>
                  <div className="flex items-center">
                    <button
                      onClick={() => setShowTitleMenu((prev) => !prev)}
                      className="group flex items-center gap-1.5 text-xs font-semibold text-slate-800 hover:text-slate-900 hover:bg-slate-100/80 px-2 py-1 rounded-lg transition-colors cursor-pointer max-w-[180px] sm:max-w-xs truncate"
                      title="Chat options (Rename / Delete)"
                    >
                      <span className="truncate">{activeSessionTitle}</span>
                      <ChevronDown
                        size={12}
                        className={`text-slate-400 group-hover:text-slate-700 shrink-0 transition-transform duration-200 ${
                          showTitleMenu ? "rotate-180 text-indigo-600" : ""
                        }`}
                      />
                    </button>

                    {/* Quick rename pencil icon right next to arrow for instant rename */}
                    <button
                      onClick={() => {
                        setRenamedTitle(activeSessionTitle);
                        setIsRenamingTitle(true);
                        setTimeout(() => renameInputRef.current?.select(), 50);
                      }}
                      className="p-1 text-slate-300 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer ml-0.5"
                      title="Rename chat"
                    >
                      <Pencil size={11} />
                    </button>
                  </div>

                  {/* Dropdown Menu when Arrow is clicked */}
                  {showTitleMenu && (
                    <div className="absolute top-full left-0 mt-1.5 w-44 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-50 animate-in fade-in zoom-in-95 duration-150">
                      <button
                        onClick={() => {
                          setShowTitleMenu(false);
                          setRenamedTitle(activeSessionTitle);
                          setIsRenamingTitle(true);
                          setTimeout(() => renameInputRef.current?.select(), 50);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors text-left cursor-pointer"
                      >
                        <Pencil size={13} className="text-slate-500" />
                        <span>Rename chat</span>
                      </button>

                      {sessions.find((s) => s.id === activeSessionId) && (
                        <button
                          onClick={(e) => {
                            setShowTitleMenu(false);
                            if (activeSessionId) {
                              deleteSession(e, activeSessionId, activeSessionTitle);
                            }
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors text-left cursor-pointer"
                        >
                          <Trash2 size={13} className="text-rose-500" />
                          <span>Delete chat</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right: Fullscreen Toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors cursor-pointer"
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              >
                {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </button>
            </div>
          </header>

          {/* ── Chat Messages Canvas ── */}
          <div
            ref={chatContainerRef}
            className={`flex-1 overflow-y-auto claude-scroll px-3 sm:px-8 lg:px-12 py-3 sm:py-6 ${
              messages.length === 0 ? "flex flex-col justify-center items-center" : ""
            }`}
          >
            <div className={`max-w-2xl mx-auto w-full ${messages.length === 0 ? "my-auto" : "space-y-6"}`}>
              
              {/* Empty / Welcome State (Vertically & Horizontally in Middle) */}
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center text-center py-4 px-3 animate-in fade-in zoom-in-95 duration-200">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-3 sm:mb-4 shadow-2xs text-indigo-600">
                    <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 fill-indigo-200" />
                  </div>
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold text-slate-900 tracking-tight leading-snug mb-2 sm:mb-2.5">
                    Welcome, {studentName}! I&apos;m Vision AI.
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-sm sm:max-w-md mx-auto mb-2 sm:mb-3">
                    Bring me anything—a tough problem, a concept you need explained, code you want to debug. We&apos;ll figure it out together.
                  </p>
                  <p className="text-xs sm:text-sm font-semibold text-slate-800">
                    Where do you want to start?
                  </p>
                </div>
              )}

              {/* Messages Flow */}
              {messages.map((msg) => {
                const isUser = msg.role === "user";
                const isSpeakingThis = speakingMsgId === msg.id;

                return (
                  <div key={msg.id} className="space-y-1">
                    {isUser ? (
                      /* User message: clean simple grey pill on right */
                      <div className="flex justify-end animate-in fade-in-50 slide-in-from-bottom-2 duration-200">
                        <div className="flex flex-col items-end gap-1.5 max-w-[85%] sm:max-w-[75%]">
                          {msg.imageUrl && (
                            <img
                              src={msg.imageUrl}
                              alt="Attached problem"
                              className="max-h-56 max-w-full rounded-2xl object-cover border border-slate-200/90 shadow-2xs cursor-pointer hover:opacity-95 transition"
                              onClick={() => setPreviewImage(msg.imageUrl || null)}
                            />
                          )}
                          {msg.content && (
                            <div className="bg-[#f0f0ee] text-slate-800 px-4 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap">
                              {msg.content}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* Assistant response: flowing text on canvas like Claude */
                      <div className="space-y-2 pt-2 animate-in fade-in duration-300">
                        {/* Vision AI Brand Mark */}
                        <div className="flex items-center gap-1.5">
                          <Sparkles size={15} className="text-indigo-600 fill-indigo-100 shrink-0" />
                          <span className="text-xs font-semibold text-slate-800">
                            Vision AI
                          </span>
                          {msg.pluginUsed && (
                            <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded font-mono">
                              @{msg.pluginUsed}
                            </span>
                          )}
                        </div>

                        {/* Content */}
                        <div className="text-[14px] text-slate-800 leading-relaxed pl-1">
                          <MarkdownMessage
                            content={msg.content}
                            onOptionClick={(opt) => sendMessage(opt)}
                          />
                        </div>

                        {/* Minimal action buttons below response */}
                        <div className="flex items-center gap-1 text-slate-400 pt-1 pl-1">
                          <button
                            onClick={() => copyMessage(msg.id, msg.content)}
                            className="p-1 hover:text-slate-700 rounded transition-colors cursor-pointer"
                            title="Copy"
                          >
                            {copiedMsgId === msg.id ? (
                              <Check size={13} className="text-emerald-500" />
                            ) : (
                              <Copy size={13} />
                            )}
                          </button>

                          <button
                            onClick={() => toggleSpeak(msg.id, msg.content)}
                            className={`p-1 hover:text-slate-700 rounded transition-colors cursor-pointer ${
                              isSpeakingThis ? "text-indigo-600" : ""
                            }`}
                            title={isSpeakingThis ? "Stop audio" : "Read aloud"}
                          >
                            {isSpeakingThis ? <VolumeX size={13} /> : <Volume2 size={13} />}
                          </button>

                          <button
                            onClick={() => sendMessage(messages[messages.indexOf(msg) - 1]?.content || "")}
                            className="p-1 hover:text-slate-700 rounded transition-colors cursor-pointer"
                            title="Retry"
                          >
                            <RotateCcw size={13} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Typing indicator */}
              {isLoading && (
                <div className="space-y-1 pt-2">
                  <div className="flex items-center gap-2">
                    <Sparkles size={15} className="text-indigo-600 fill-indigo-200 animate-pulse shrink-0" />
                    <span className="text-xs text-slate-500 font-medium">Thinking...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* ── Bottom Input Section (Claude Style) ── */}
          <div className="p-4 bg-white shrink-0">
            <div className="max-w-2xl mx-auto relative">
              
              {/* Hidden file input for Photo Upload */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />

              {/* Plugin & Attachment dropdown menu (when user clicks + or types @) */}
              {showPluginMenu && (
                <div
                  data-plugin-menu
                  className="absolute bottom-full left-0 mb-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-50 overflow-hidden divide-y divide-slate-100 animate-in fade-in slide-in-from-bottom-2 duration-150"
                >
                  {/* Photo & Camera section: Only show when opened via "+" button, never when typing "@" */}
                  {menuTriggerSource === "plus" && (
                    <div className="p-1 space-y-0.5">
                      <div className="px-2.5 py-1 text-[10px] font-semibold uppercase text-slate-400">
                        Attachments
                      </div>

                      {/* Upload Photo Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setShowPluginMenu(false);
                          setMenuTriggerSource(null);
                          fileInputRef.current?.click();
                        }}
                        className="w-full text-left p-2 rounded-lg flex items-center gap-2.5 hover:bg-slate-50 transition-colors cursor-pointer text-slate-700"
                      >
                        <ImageIcon size={15} className="text-indigo-600 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-semibold text-slate-900">Upload Photo</span>
                          <span className="text-[11px] text-slate-400 ml-1.5">(JPG, PNG, WebP)</span>
                        </div>
                      </button>

                      {/* Camera Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setShowPluginMenu(false);
                          setMenuTriggerSource(null);
                          startCamera();
                        }}
                        className="w-full text-left p-2 rounded-lg flex items-center gap-2.5 hover:bg-slate-50 transition-colors cursor-pointer text-slate-700"
                      >
                        <Camera size={15} className="text-emerald-600 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-semibold text-slate-900">Take Photo</span>
                          <span className="text-[11px] text-slate-400 ml-1.5">(Camera)</span>
                        </div>
                      </button>
                    </div>
                  )}

                  {/* Plugins section: Only show when typing "@", never when clicking "+" */}
                  {menuTriggerSource === "at" && filteredPlugins.length > 0 && (
                    <div>
                      <div className="px-3 py-1.5 text-[10px] font-semibold uppercase text-slate-400">
                        Plugins
                      </div>
                      <div className="p-1 space-y-0.5">
                        {filteredPlugins.map((plugin, idx) => {
                          const PIcon = plugin.icon;
                          const isHighlighted = idx === selectedPluginIndex;
                          return (
                            <button
                              key={plugin.id}
                              onClick={() => attachPlugin(plugin.id)}
                              className={`w-full text-left p-2 rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer ${
                                isHighlighted ? "bg-slate-100 font-medium" : "hover:bg-slate-50"
                              }`}
                            >
                              <PIcon size={14} className="text-slate-500 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <span className="text-xs font-semibold text-slate-900">{plugin.tag}</span>
                                <span className="text-[11px] text-slate-400 ml-1.5">({plugin.name})</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Active Attached Plugin pill */}
              {currentPluginConfig && (
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                    {currentPluginConfig.tag}
                    <button
                      onClick={() => setActivePlugin(null)}
                      className="hover:text-slate-900 ml-0.5 cursor-pointer"
                    >
                      <X size={11} />
                    </button>
                  </span>
                </div>
              )}

              {/* Attached Image Thumbnail Preview */}
              {attachedImage && (
                <div className="mb-2 relative inline-flex items-center gap-2 p-1.5 bg-slate-50 border border-slate-200 rounded-xl shadow-2xs group">
                  <img
                    src={attachedImage}
                    alt="Preview"
                    className="w-12 h-12 rounded-lg object-cover cursor-pointer hover:opacity-90 border border-slate-200"
                    onClick={() => setPreviewImage(attachedImage)}
                  />
                  <div className="pr-6 text-left">
                    <p className="text-xs font-medium text-slate-800">Photo attached</p>
                    <p className="text-[10px] text-slate-400">Click to enlarge</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAttachedImage(null)}
                    className="absolute top-1.5 right-1.5 text-slate-400 hover:text-rose-600 p-1 rounded-full hover:bg-slate-200 transition cursor-pointer"
                    title="Remove photo"
                  >
                    <X size={13} />
                  </button>
                </div>
              )}

              {/* Listening banner */}
              {isListening && (
                <div className="mb-2 px-3 py-1 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-between text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    <span>Listening... Speak now</span>
                  </div>
                  <button onClick={toggleListening} className="text-slate-500 hover:text-slate-800 text-[11px] cursor-pointer">
                    Stop
                  </button>
                </div>
              )}

              {/* Claude Style Input Box */}
              <div className="flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-3 py-2 shadow-2xs focus-within:border-slate-400 transition-colors">
                
                {/* Left + Button (Trigger for attachments & plugins) */}
                <button
                  type="button"
                  onClick={() => {
                    if (showPluginMenu && menuTriggerSource === "plus") {
                      setShowPluginMenu(false);
                      setMenuTriggerSource(null);
                    } else {
                      setShowPluginMenu(true);
                      setMenuTriggerSource("plus");
                      setPluginFilter("");
                      setSelectedPluginIndex(0);
                    }
                  }}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-md transition-colors cursor-pointer shrink-0"
                  title="Upload photo or take camera photo"
                >
                  <Plus size={17} />
                </button>

                {/* Input Textarea */}
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={handleTextareaChange}
                  onKeyDown={handleKeyDown}
                  placeholder={attachedImage ? "Ask a question about this photo..." : "Write a message..."}
                  rows={1}
                  className="flex-1 resize-none bg-transparent py-0.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none max-h-32 claude-scroll"
                  style={{ height: "24px" }}
                  disabled={isLoading}
                />

                {/* Right: Mic when empty, Send when typed or photo attached */}
                {input.trim() || attachedImage ? (
                  <button
                    onClick={() => sendMessage(input)}
                    disabled={isLoading}
                    className={`p-1.5 rounded-lg transition-all cursor-pointer shrink-0 ${
                      isLoading
                        ? "text-indigo-400 bg-indigo-50 cursor-not-allowed"
                        : "text-slate-700 hover:text-indigo-600 hover:bg-slate-100 active:scale-90"
                    }`}
                    title="Send"
                  >
                    {isLoading ? (
                      <Loader2 size={15} className="animate-spin text-indigo-600" />
                    ) : (
                      <Send size={15} />
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={toggleListening}
                    className={`p-1 rounded-md transition-colors cursor-pointer shrink-0 ${
                      isListening
                        ? "text-rose-500 animate-pulse"
                        : "text-slate-400 hover:text-slate-700"
                    }`}
                    title={isListening ? "Stop listening" : "Voice input"}
                  >
                    {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                  </button>
                )}
              </div>

              {/* Bottom Minimal Footer (Claude Style) */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 mt-2">
                <span>Vision AI is AI and can make mistakes. Please double-check responses.</span>

                {/* Model Selector Menu at Bottom Right */}
                <div className="relative" data-dropdown>
                  <button
                    onClick={() => setShowModelDropdown(!showModelDropdown)}
                    className="flex items-center gap-1 font-medium text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                  >
                    <span>{currentModelConfig.name}</span>
                    <span className="text-[10px] text-slate-400">{currentModelConfig.badge}</span>
                    <ChevronDown size={11} />
                  </button>

                  {showModelDropdown && (
                    <div className="absolute bottom-full right-0 mb-1 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-50 min-w-[200px]">
                      <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase">
                        Models
                      </div>
                      {MODEL_TIERS.map((tier) => (
                        <button
                          key={tier.id}
                          onClick={() => changeModelTier(tier.id)}
                          className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer ${
                            modelTier === tier.id ? "font-semibold text-slate-900 bg-slate-50" : "text-slate-600"
                          }`}
                        >
                          <div>
                            <p>{tier.name}</p>
                            <p className="text-[10px] text-slate-400">{tier.desc}</p>
                          </div>
                          {modelTier === tier.id && <Check size={12} className="text-slate-700" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* ── Settings Modal ── */}
      {showSettingsModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          onClick={() => setShowSettingsModal(false)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[88vh] animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Settings size={18} className="text-slate-800" />
                <h3 className="font-semibold text-slate-800 text-base">Settings</h3>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto">
              {/* Language Selection */}
              <div>
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                  Language Preference
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "hinglish", label: "Hinglish", desc: "Hindi + English mix" },
                    { id: "en", label: "English", desc: "Strictly English" },
                    { id: "hi", label: "हिन्दी", desc: "Pure Hindi" },
                  ].map((lang) => (
                    <button
                      key={lang.id}
                      onClick={() => {
                        setSelectedLanguage(lang.id);
                        try {
                          localStorage.setItem("vision_ai_language", lang.id);
                        } catch {}
                      }}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        selectedLanguage === lang.id
                          ? "border-indigo-600 bg-indigo-50/50 text-indigo-950 font-medium ring-1 ring-indigo-600"
                          : "border-slate-200 hover:border-slate-300 text-slate-700 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold">{lang.label}</span>
                        {selectedLanguage === lang.id && <Check size={14} className="text-indigo-600" />}
                      </div>
                      <span className="text-[10px] text-slate-500 block leading-tight">{lang.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Response Tone */}
              <div>
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                  AI Response Tone
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "balanced", label: "Balanced", desc: "Clear & engaging" },
                    { id: "concise", label: "Concise", desc: "Short & direct" },
                    { id: "deep", label: "Deep Explainer", desc: "In-depth with examples" },
                  ].map((tone) => (
                    <button
                      key={tone.id}
                      onClick={() => {
                        setResponseTone(tone.id);
                        try {
                          localStorage.setItem("vision_ai_tone", tone.id);
                        } catch {}
                      }}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        responseTone === tone.id
                          ? "border-indigo-600 bg-indigo-50/50 text-indigo-950 font-medium ring-1 ring-indigo-600"
                          : "border-slate-200 hover:border-slate-300 text-slate-700 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold">{tone.label}</span>
                        {responseTone === tone.id && <Check size={14} className="text-indigo-600" />}
                      </div>
                      <span className="text-[10px] text-slate-500 block leading-tight">{tone.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat History & Data Storage */}
              <div className="pt-2 border-t border-slate-100">
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                  Chat Data & Storage
                </label>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <div>
                    <p className="text-xs font-semibold text-slate-800">
                      Permanent History
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {sessions.length} chat {sessions.length === 1 ? "session" : "sessions"} stored securely in your browser
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const blob = new Blob([JSON.stringify(sessions, null, 2)], { type: "application/json" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `vision-ai-chats-${new Date().toISOString().slice(0, 10)}.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="px-2.5 py-1.5 text-xs text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-1 cursor-pointer font-medium"
                      title="Export all chat sessions to JSON"
                    >
                      <Download size={13} />
                      <span>Export</span>
                    </button>

                    <button
                      onClick={() => {
                        if (confirm("Are you sure you want to permanently delete all chat history? This cannot be undone.")) {
                          saveSessions([]);
                          setMessages([]);
                          setActiveSessionId(null);
                          setShowSettingsModal(false);
                        }
                      }}
                      className="px-2.5 py-1.5 text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors flex items-center gap-1 cursor-pointer font-medium"
                    >
                      <Trash2 size={13} />
                      <span>Clear All</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Custom Instructions */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Custom Instructions
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {customInstructions.length}/500
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mb-2 leading-relaxed">
                  Apne personal preferences likhein jo Vision AI har response me yaad rakhe (e.g. learning goals, preferred code languages, explanation style).
                </p>
                <div className="relative">
                  <textarea
                    value={customInstructions}
                    maxLength={500}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCustomInstructions(val);
                      try {
                        localStorage.setItem("vision_ai_custom_instructions", val);
                      } catch {}
                    }}
                    placeholder="e.g., Explain complex concepts using simple real-world analogies. Always include clean commented code snippets in JavaScript/Python. Keep explanations friendly and structured..."
                    rows={4}
                    className="w-full text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 focus:bg-white transition-all resize-none leading-relaxed placeholder:text-slate-400"
                  />
                  {customInstructions && (
                    <button
                      type="button"
                      onClick={() => {
                        setCustomInstructions("");
                        try {
                          localStorage.removeItem("vision_ai_custom_instructions");
                        } catch {}
                      }}
                      className="absolute top-2 right-2 text-slate-400 hover:text-rose-600 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 hover:bg-rose-50 transition-colors"
                      title="Clear custom instructions"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Quick preset chips */}
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] text-slate-400">Quick ideas:</span>
                  {[
                    "Use simple analogies",
                    "Include code with comments",
                    "Exam preparation focus",
                    "Keep answers concise",
                  ].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => {
                        const newText = customInstructions
                          ? `${customInstructions.trim()}, ${chip}`
                          : chip;
                        if (newText.length <= 500) {
                          setCustomInstructions(newText);
                          try {
                            localStorage.setItem("vision_ai_custom_instructions", newText);
                          } catch {}
                        }
                      }}
                      className="text-[10px] bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                    >
                      +{chip}
                    </button>
                  ))}
                </div>

                <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                  <span>Saved automatically to your profile</span>
                  {customInstructions.trim() && (
                    <span className="text-emerald-600 font-medium flex items-center gap-1">
                      <Check size={11} />
                      Active for all chats
                    </span>
                  )}
                </div>
              </div>

              {/* Student Memory & Friendship */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <Brain size={13} className="text-indigo-600" />
                    <label className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
                      Student Memory & Friendship
                    </label>
                  </div>
                  {memories.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm("Kya aap Vision AI ki saari saved memories delete karna chahte hain?")) {
                          saveMemories([]);
                        }
                      }}
                      className="text-[10px] text-rose-500 hover:text-rose-700 font-medium cursor-pointer"
                    >
                      Clear All Memories
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mb-2 leading-relaxed">
                  Vision AI aapka sachha dost hai aur chat ke dauran aapke goals, exam dates, pasand aur struggles ko automatically yaad rakhta hai.
                </p>

                {/* Memories list */}
                <div className="space-y-1.5 mb-2.5 max-h-36 overflow-y-auto pr-1">
                  {memories.length === 0 ? (
                    <div className="text-[11px] text-slate-400 italic bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      Abhi koi memory saved nahi hai. AI se chat karte waqt wo aapki baatein automatically yaad kar lega!
                    </div>
                  ) : (
                    memories.map((mem, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-2 px-2.5 py-1.5 bg-indigo-50/60 border border-indigo-100 text-indigo-950 rounded-lg text-xs"
                      >
                        <span className="leading-snug">🧠 {mem}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = memories.filter((_, i) => i !== idx);
                            saveMemories(updated);
                          }}
                          className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition-colors shrink-0 cursor-pointer"
                          title="Remove this memory"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Add memory input */}
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={newMemoryInput}
                    onChange={(e) => setNewMemoryInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newMemoryInput.trim()) {
                        e.preventDefault();
                        if (!memories.includes(newMemoryInput.trim())) {
                          saveMemories([...memories, newMemoryInput.trim()]);
                        }
                        setNewMemoryInput("");
                      }
                    }}
                    placeholder="Nayi memory add karein (e.g. 15 Oct ko BCA exam hai)..."
                    className="flex-1 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newMemoryInput.trim()) {
                        if (!memories.includes(newMemoryInput.trim())) {
                          saveMemories([...memories, newMemoryInput.trim()]);
                        }
                        setNewMemoryInput("");
                      }
                    }}
                    disabled={!newMemoryInput.trim()}
                    className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-lg text-xs font-medium transition cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="font-mono text-[11px]">Shortcut: Ctrl+Shift+,</span>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-medium transition cursor-pointer text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Get Help Modal ── */}
      {showHelpModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          onClick={() => setShowHelpModal(false)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[88vh] animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <HelpCircle size={18} className="text-indigo-600" />
                <h3 className="font-semibold text-slate-800 text-base">Vision AI Help & Guide</h3>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto text-xs text-slate-700">
              {/* Plugins Guide */}
              <div>
                <h4 className="font-semibold text-slate-900 text-sm mb-2 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-indigo-600" />
                  <span>Using Plugins</span>
                </h4>
                <p className="text-slate-600 leading-relaxed mb-3">
                  Click the <span className="font-bold text-slate-800">+</span> button on the left of input or type <span className="font-mono text-indigo-600 font-bold">@</span> to summon specialized AI assistants:
                </p>
                <div className="space-y-2">
                  {[
                    { tag: "@notes", name: "Notes & Cheatsheets", desc: "Generates high-yield exam summaries and revision cards." },
                    { tag: "@quiz", name: "Practice Quiz", desc: "Generates interactive MCQs to test your concepts." },
                    { tag: "@coder", name: "Coder & Debugger", desc: "Writes clean code snippets, finds errors, and explains logic." },
                    { tag: "@study", name: "Concept Tutor", desc: "Explains tough concepts from scratch with practical analogies." },
                  ].map((p) => (
                    <div key={p.tag} className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="font-mono font-bold text-indigo-600 bg-white border border-indigo-100 px-2 py-0.5 rounded text-[11px] shrink-0">
                        {p.tag}
                      </span>
                      <div>
                        <p className="font-semibold text-slate-800">{p.name}</p>
                        <p className="text-[11px] text-slate-500 leading-tight">{p.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Models Guide */}
              <div className="pt-2 border-t border-slate-100">
                <h4 className="font-semibold text-slate-900 text-sm mb-2 flex items-center gap-1.5">
                  <Zap size={14} className="text-amber-500" />
                  <span>AI Models</span>
                </h4>
                <div className="space-y-1.5">
                  <p><strong className="text-slate-900">Vision:</strong> Fast response, ideal for quick queries.</p>
                  <p><strong className="text-slate-900">Vision Pro:</strong> Recommended balanced model for daily studies & coding.</p>
                  <p><strong className="text-slate-900">Vision Elite:</strong> High intelligence for complex algorithmic and reasoning challenges.</p>
                </div>
              </div>

              {/* Keyboard Shortcuts */}
              <div className="pt-2 border-t border-slate-100">
                <h4 className="font-semibold text-slate-900 text-sm mb-2">Keyboard Shortcuts</h4>
                <div className="space-y-1 font-mono text-[11px]">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Send message</span>
                    <span className="font-bold text-slate-800">Enter</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">New line</span>
                    <span className="font-bold text-slate-800">Shift + Enter</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Trigger Plugin Menu</span>
                    <span className="font-bold text-slate-800">+ or @</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Open Settings</span>
                    <span className="font-bold text-slate-800">Ctrl + Shift + ,</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-600">Close modal / menu</span>
                    <span className="font-bold text-slate-800">Escape</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <button
                onClick={() => setShowHelpModal(false)}
                className="px-4 py-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-xs font-medium transition cursor-pointer"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Camera Capture Modal ── */}
      {showCameraModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#18181b] text-white rounded-2xl overflow-hidden shadow-2xl border border-zinc-800 flex flex-col animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Camera size={16} className="text-emerald-400" />
                <span className="text-sm font-semibold">Take Photo</span>
              </div>
              <button
                onClick={stopCamera}
                className="text-zinc-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Viewport */}
            <div className="relative bg-black aspect-4/3 flex items-center justify-center overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-5 border border-white/20 rounded-xl pointer-events-none" />
            </div>

            {/* Controls */}
            <div className="p-4 flex items-center justify-between bg-zinc-900">
              <button
                type="button"
                onClick={() => startCamera(cameraFacing === "environment" ? "user" : "environment")}
                className="p-2.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition cursor-pointer"
                title="Switch camera"
              >
                <SwitchCamera size={18} />
              </button>

              <button
                type="button"
                onClick={capturePhoto}
                className="w-14 h-14 rounded-full bg-white hover:bg-zinc-200 border-4 border-emerald-500 shadow-lg flex items-center justify-center active:scale-95 transition cursor-pointer"
                title="Capture"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-500" />
              </button>

              <button
                type="button"
                onClick={stopCamera}
                className="text-xs text-zinc-400 hover:text-white font-medium px-3 py-1.5 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Fullscreen Image Preview Modal ── */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={previewImage}
              alt="Full preview"
              className="max-w-full max-h-[85vh] rounded-xl object-contain shadow-2xl"
            />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-3 -right-3 bg-white text-slate-900 rounded-full p-1.5 shadow-lg hover:bg-slate-100 transition cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

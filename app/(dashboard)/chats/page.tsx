"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import NextLink from "next/link";
import { createClient } from "@/lib/supabase-browser";
import {
  Send, Search, Pin, Info, X, Smile,
  Paperclip, Download, Reply, Trash2,
  Loader2, Wifi, WifiOff, ChevronDown,
  FileText, Link as LinkIcon, ArrowLeft, SquarePen, UserCircle2,
  MessageSquare, MoreVertical, Copy, Check, Edit3,
  Mic, Play, Pause, Volume2, Code2, Bell, BellOff,
  Plus, Camera, BookOpen, Award, ExternalLink, RotateCw
} from "lucide-react";
import dynamic from "next/dynamic";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

const SyntaxHighlighter = dynamic(
  () => import("react-syntax-highlighter").then((mod) => mod.Prism),
  {
    ssr: false,
    loading: () => (
      <div className="p-3 bg-[#181825] text-xs font-mono text-slate-400">
        Loading code...
      </div>
    ),
  }
);

/* ── Types ── */
interface Room {
  id: string; name: string; type: string;
  last_message?: string; last_message_at?: string; unread?: number;
  dm_user1?: string; dm_user2?: string;
}
interface Profile { id: string; full_name: string | null; role: string; avatar_url?: string | null; username?: string | null; }
interface OtherUser { id: string; full_name: string | null; role: string; avatar_url?: string | null; username?: string | null; }
interface Message {
  id: string; room_id: string; sender_id: string; text: string;
  reply_to: string | null; is_deleted: boolean; created_at: string;
  file_url?: string | null; file_name?: string | null; file_type?: string | null; file_size?: number | null;
  reactions?: Record<string, string[]>;
  is_pinned?: boolean;
  profiles?: Profile;
  status?: "sending" | "sent" | "seen";
}

/* ── Helpers ── */
const EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏", "🔥", "👏"];
const TAB = ["All", "Pin", "Unread", "Groups"] as const;
type TabT = typeof TAB[number];

function Avatar({ name, size = "md", url }: { name: string; size?: "sm" | "md" | "lg"; url?: string | null }) {
  const initials = (name || "?").split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  const colors = ["bg-indigo-500", "bg-rose-500", "bg-emerald-500", "bg-amber-500", "bg-violet-500", "bg-teal-500"];
  const color = colors[(name?.charCodeAt(0) || 0) % colors.length];
  const sz = size === "sm" ? "w-8 h-8 text-[10px]" : size === "lg" ? "w-16 h-16 text-xl" : "w-10 h-10 text-xs";
  if (url) return <img src={url} alt={name} className={`${sz} rounded-full object-cover shrink-0`} />;
  return <div className={`${sz} ${color} text-white rounded-full flex items-center justify-center font-black shrink-0`}>{initials}</div>;
}

function formatTime(ts: string) {
  const d = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 86400000 && d.getDate() === now.getDate())
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  if (diff < 604800000) return d.toLocaleDateString("en-IN", { weekday: "short" });
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "2-digit" });
}
function formatDateLabel(ts: string) {
  const d = new Date(ts); const now = new Date();
  const yest = new Date(now); yest.setDate(now.getDate() - 1);
  if (d.toDateString() === now.toDateString()) return "Today";
  if (d.toDateString() === yest.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}
function formatShortDate(ts: string) {
  const d = new Date(ts);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
function formatFileSize(bytes?: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ── Code Highlighting & Detection Helpers ── */
function normalizePrismLang(lang: string): string {
  const l = (lang || "").toLowerCase().trim();
  switch (l) {
    case "html":
    case "xml":
    case "svg":
    case "markup":
      return "markup";
    case "js":
    case "javascript":
    case "jsx":
      return "javascript";
    case "ts":
    case "typescript":
    case "tsx":
      return "typescript";
    case "py":
    case "python":
      return "python";
    case "css":
    case "scss":
    case "less":
      return "css";
    case "json":
      return "json";
    case "sql":
      return "sql";
    case "c":
      return "c";
    case "cpp":
    case "c++":
      return "cpp";
    case "java":
      return "java";
    case "bash":
    case "sh":
    case "shell":
    case "zsh":
      return "bash";
    default:
      return l || "markup";
  }
}

function hasMultipleHtmlTags(str: string): boolean {
  const matches = str.match(/<\/?(?:div|p|h[1-6]|span|a|ul|ol|li|table|tr|td|th|form|button|input|textarea|header|footer|nav|section|article|script|style|title|head|body|html|doctype)[>\s]/gi);
  return (matches ? matches.length : 0) >= 2;
}

function detectCodeInText(str: string): { isCode: boolean; lang: string } {
  const trimmed = str.trim();
  const lower = trimmed.toLowerCase();

  // HTML / XML detection
  if (
    lower.startsWith("<!doctype") ||
    lower.startsWith("<html") ||
    (lower.includes("<head") && lower.includes("</head>")) ||
    (lower.includes("<body") && lower.includes("</body>")) ||
    hasMultipleHtmlTags(trimmed)
  ) {
    return { isCode: true, lang: "html" };
  }

  // JSON detection
  if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
    try {
      JSON.parse(trimmed);
      return { isCode: true, lang: "json" };
    } catch {}
  }

  // Multiline programming code detection
  const lines = trimmed.split("\n");
  if (lines.length >= 2) {
    // Python
    if (
      /\b(def\s+\w+\s*\(|class\s+\w+.*:|import\s+[\w.]+|from\s+[\w.]+\s+import|print\s*\(|elif\s+|if\s+__name__)\b/.test(trimmed)
    ) {
      return { isCode: true, lang: "python" };
    }

    // JavaScript / TypeScript / React JSX
    if (
      /\b(const\s+\w+\s*=|let\s+\w+\s*=|var\s+\w+\s*=|function\s*\w*\s*\(|console\.(log|error|warn)|import\s+.*from|export\s+(default|const|function)|=>\s*\{)/.test(trimmed) ||
      /<[A-Z]\w+(\s+[^>]*)?>[\s\S]*<\/[A-Z]\w+>/.test(trimmed)
    ) {
      return { isCode: true, lang: "javascript" };
    }

    // CSS
    if (/([.#]?[a-zA-Z0-9_-]+\s*\{[\s\S]*?:[\s\S]*?\})/m.test(trimmed) && (lower.includes("color:") || lower.includes("background:") || lower.includes("margin:") || lower.includes("display:"))) {
      return { isCode: true, lang: "css" };
    }

    // SQL
    if (/\b(SELECT\s+[\s\S]*?\s+FROM|INSERT\s+INTO|CREATE\s+TABLE|UPDATE\s+[\s\S]*?\s+SET|DROP\s+TABLE)\b/i.test(trimmed)) {
      return { isCode: true, lang: "sql" };
    }

    // C / C++
    if (/#include\s*<|std::|printf\s*\(/.test(trimmed)) {
      return { isCode: true, lang: "cpp" };
    }

    // Java
    if (/\b(public\s+class|public\s+static\s+void\s+main|System\.out\.println)\b/.test(trimmed)) {
      return { isCode: true, lang: "java" };
    }
  }

  return { isCode: false, lang: "text" };
}

function formatRecordTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

function AudioMessagePlayer({ url, isOwn, duration }: { url: string; isOwn: boolean; duration?: number }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration || 0);
  const [playbackRate, setPlaybackRate] = useState(1);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setTotalDuration(audio.duration);
      }
    };

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);

    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
    };
  }, []);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(e => console.error("Audio playback error:", e));
    }
  };

  const cycleSpeed = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    const nextSpeed = playbackRate === 1 ? 1.5 : playbackRate === 1.5 ? 2 : 1;
    audioRef.current.playbackRate = nextSpeed;
    setPlaybackRate(nextSpeed);
  };

  const formatAudioTime = (sec: number) => {
    if (isNaN(sec) || !isFinite(sec)) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const progress = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;
  const barHeights = [30, 65, 45, 90, 100, 55, 80, 50, 95, 70, 40, 85, 95, 60, 75, 45, 65, 90, 55, 35];

  return (
    <div className="flex flex-col gap-1.5 py-1 px-0.5 min-w-[210px] max-w-[270px]">
      <audio ref={audioRef} src={url} preload="metadata" />
      <div className="flex items-center gap-2.5">
        {/* Play/Pause Button */}
        <button
          type="button"
          onClick={togglePlay}
          className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all active:scale-95 shadow-sm ${
            isOwn
              ? "bg-white text-indigo-600 hover:bg-slate-100"
              : "bg-indigo-600 text-white hover:bg-indigo-700"
          }`}
        >
          {isPlaying ? <Pause size={15} className="fill-current" /> : <Play size={15} className="fill-current ml-0.5" />}
        </button>

        {/* Waveform Visualization & Time */}
        <div className="flex-1 flex flex-col justify-center gap-1.5">
          <div
            className="flex items-center gap-[2.5px] h-5 w-full cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              const rect = e.currentTarget.getBoundingClientRect();
              const clickPos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
              if (audioRef.current && totalDuration) {
                const newTime = clickPos * totalDuration;
                audioRef.current.currentTime = newTime;
                setCurrentTime(newTime);
              }
            }}
          >
            {barHeights.map((h, i) => {
              const barProgress = (i / barHeights.length) * 100;
              const isPlayed = barProgress <= progress;
              return (
                <div
                  key={i}
                  style={{ height: `${h}%` }}
                  className={`flex-1 rounded-full transition-colors duration-100 ${
                    isPlayed
                      ? isOwn ? "bg-white" : "bg-indigo-600"
                      : isOwn ? "bg-indigo-300/50" : "bg-slate-200 dark:bg-slate-700"
                  }`}
                />
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[9px] font-mono font-medium">
            <span className={isOwn ? "text-indigo-100" : "text-slate-400"}>
              {formatAudioTime(currentTime)} / {formatAudioTime(totalDuration || 0)}
            </span>
            <button
              type="button"
              onClick={cycleSpeed}
              className={`px-1.5 py-0.5 rounded-full font-black text-[8px] transition-colors ${
                isOwn
                  ? "bg-indigo-600/70 text-white hover:bg-indigo-600"
                  : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              {playbackRate}x
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LMSChatPage() {
  const supabase = createClient();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [seenMessageIds, setSeenMessageIds] = useState<Set<string>>(new Set());
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<TabT>("All");
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [hoveredMsg, setHoveredMsg] = useState<string | null>(null);
  const [emojiTarget, setEmojiTarget] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [pinned, setPinned] = useState<Set<string>>(new Set());
  const [isOnline, setIsOnline] = useState(true);
  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<OtherUser[]>([]);
  const [showNewDM, setShowNewDM] = useState(false);
  const [dmSearch, setDmSearch] = useState("");
  const [creatingDM, setCreatingDM] = useState<string | null>(null);
  const [dmPartners, setDmPartners] = useState<Record<string, OtherUser>>({});
  const [sending, setSending] = useState(false);
  const [showScroll, setShowScroll] = useState(false);
  const [infoTab, setInfoTab] = useState<"Media" | "Files" | "Links">("Media");
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [menuTarget, setMenuTarget] = useState<string | null>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [copiedCodeKey, setCopiedCodeKey] = useState<string | null>(null);
  const [editingMsg, setEditingMsg] = useState<{ id: string; text: string } | null>(null);
  const [blockedUsers, setBlockedUsers] = useState<Set<string>>(new Set());
  const channelRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [uploadingFile, setUploadingFile] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const [typingUsers, setTypingUsers] = useState<Record<string, { name: string; ts: number }>>({});
  const presenceChannelRef = useRef<any>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    try { return localStorage.getItem("vision_chat_muted") === "true"; } catch { return false; }
  });

  /* Attachment Drawer & Features State */
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showMaterialsModal, setShowMaterialsModal] = useState(false);
  const [showTestsModal, setShowTestsModal] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [materialsList, setMaterialsList] = useState<any[]>([]);
  const [testsList, setTestsList] = useState<any[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [loadingTests, setLoadingTests] = useState(false);
  const [materialSearch, setMaterialSearch] = useState("");
  const [testSearch, setTestSearch] = useState("");
  const cameraFileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);

  /* Play notification chime via Web Audio API */
  const playNotificationSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      // Note 1 — short rising chime
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(600, ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.1);
      gain1.gain.setValueAtTime(0.3, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.35);
      // Note 2 — slightly delayed higher note
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(900, ctx.currentTime + 0.18);
      osc2.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.32);
      gain2.gain.setValueAtTime(0.0, ctx.currentTime + 0.18);
      gain2.gain.setValueAtTime(0.25, ctx.currentTime + 0.19);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);
      osc2.start(ctx.currentTime + 0.18);
      osc2.stop(ctx.currentTime + 0.55);
      // Close context after sounds finish
      setTimeout(() => ctx.close(), 700);
    } catch (e) {
      // Audio API not available (e.g., SSR) — silently skip
    }
  }, []);

  // Cleanup media recording on unmount
  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  // Load blocked users from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("vision_blocked_users");
      if (stored) setBlockedUsers(new Set(JSON.parse(stored)));
    } catch {}
  }, []);

  const toggleBlockContact = (partnerId: string) => {
    setBlockedUsers(prev => {
      const next = new Set(prev);
      if (next.has(partnerId)) next.delete(partnerId);
      else next.add(partnerId);
      try {
        localStorage.setItem("vision_blocked_users", JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
  };

  const deleteContact = async (roomId: string) => {
    if (!confirm("Are you sure you want to delete this conversation?")) return;
    try {
      await supabase.from("lms_messages").delete().eq("room_id", roomId);
      await supabase.from("lms_chat_rooms").delete().eq("id", roomId);
      setRooms(prev => prev.filter(r => r.id !== roomId));
      setSelectedRoom(rooms.find(r => r.id !== roomId && r.type !== "dm") || null);
      setShowInfo(false);
    } catch (e) {
      console.error("Delete contact error:", e);
    }
  };

  /* Init */
  useEffect(() => {
    async function init() {
      try {
        let currentId: string | null = null;
        let currentName = "User";
        let currentAvatar: string | null = null;
        let currentRole = "student";

        // 1. Try to get logged-in student via session profile endpoint
        try {
          const res = await fetch("/api/auth/profile");
          if (res.ok) {
            const s = await res.json();
            if (s?.id) {
              currentId = s.id;
              currentName = s.name || "Student";
              currentAvatar = s.photo_url || null;
            }
          }
        } catch (e) {
          console.error("Profile endpoint error:", e);
        }

        // 2. Fallback to Supabase auth (for admins / teachers)
        if (!currentId) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user?.id) {
            currentId = user.id;
            currentRole = "admin";
          }
        }

        if (!currentId) {
          setLoading(false);
          return;
        }

        setUserId(currentId);

        // Fetch user's profile details
        const { data: prof } = await supabase
          .from("profiles")
          .select("id,full_name,role,avatar_url,username")
          .eq("id", currentId)
          .maybeSingle();

        setProfile(
          prof || {
            id: currentId,
            full_name: currentName,
            role: currentRole,
            avatar_url: currentAvatar,
          }
        );

        // Load group rooms
        const { data: roomData } = await supabase
          .from("lms_chat_rooms")
          .select("id,name,type,dm_user1,dm_user2")
          .neq("type", "dm")
          .order("created_at");

        // Load DM rooms for this user
        const { data: dmRooms } = await supabase
          .from("lms_chat_rooms")
          .select("id,name,type,dm_user1,dm_user2")
          .eq("type", "dm")
          .or(`dm_user1.eq.${currentId},dm_user2.eq.${currentId}`);

        // Build partner map for DM rooms
        if (dmRooms && dmRooms.length > 0) {
          const partnerIds = dmRooms
            .map((r: any) => (r.dm_user1 === currentId ? r.dm_user2 : r.dm_user1))
            .filter((id: string) => id && id !== "null");

          if (partnerIds.length > 0) {
            const { data: partners } = await supabase
              .from("profiles")
              .select("id,full_name,role,avatar_url,username")
              .in("id", partnerIds);

            if (partners) {
              const map: Record<string, OtherUser> = {};
              partners.forEach((p: any) => {
                map[p.id] = p;
              });
              setDmPartners(map);
            }
          }
        }

        const allRooms = [...(roomData || []), ...(dmRooms || [])];
        setRooms(allRooms as any);
        if (allRooms.length > 0) setSelectedRoom(allRooms[0] as any);

        // Load only users who have a username set
        const { data: users } = await supabase
          .from("profiles")
          .select("id,full_name,role,avatar_url,username")
          .neq("id", currentId)
          .not("username", "is", null)
          .neq("username", "")
          .order("full_name");
        if (users) {
          setAllUsers(
            (users as any[]).filter(u => Boolean(u.username && u.username.trim()))
          );
        }

        // Load pinned
        const { data: pins } = await supabase
          .from("lms_pinned_rooms")
          .select("room_id")
          .eq("user_id", currentId);
        if (pins) setPinned(new Set(pins.map((p: any) => p.room_id)));
      } catch (e) {
        console.error("Chat init error:", e);
      } finally {
        setLoading(false);
      }
    }
    init();
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => { window.removeEventListener("online", onOnline); window.removeEventListener("offline", onOffline); };
  }, []);

  // Ensure allUsers are loaded whenever DM modal opens (only users with username)
  useEffect(() => {
    if (showNewDM) {
      supabase
        .from("profiles")
        .select("id,full_name,role,avatar_url,username")
        .not("username", "is", null)
        .neq("username", "")
        .order("full_name")
        .then(({ data }: any) => {
          if (data) {
            setAllUsers(
              data.filter((u: any) => (!userId || u.id !== userId) && Boolean(u.username && u.username.trim())) as any
            );
          }
        });
    }
  }, [showNewDM, userId]);

  /* Load messages */
  const loadMessages = useCallback(async (roomId: string) => {
    const { data } = await supabase
      .from("lms_messages")
      .select(`id,room_id,sender_id,text,reply_to,is_deleted,created_at,file_url,file_name,file_type,file_size,reactions,is_pinned,profiles:sender_id(id,full_name,role,avatar_url)`)
      .eq("room_id", roomId).order("created_at", { ascending: true }).limit(200);
    setMessages((data as any) || []);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }, []);

  useEffect(() => {
    if (!selectedRoom) return;
    loadMessages(selectedRoom.id);
    if (channelRef.current) supabase.removeChannel(channelRef.current);
    const ch = supabase.channel(`lms-room-${selectedRoom.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "lms_messages", filter: `room_id=eq.${selectedRoom.id}` },
        async (payload: any) => {
          const { data } = await supabase.from("lms_messages")
            .select(`id,room_id,sender_id,text,reply_to,is_deleted,created_at,file_url,file_name,file_type,file_size,reactions,is_pinned,profiles:sender_id(id,full_name,role,avatar_url)`)
            .eq("id", payload.new.id).single();
          if (data) {
            setMessages(prev => {
              if (prev.some(m => m.id === data.id)) return prev;
              return [...prev.filter(m => !m.id.startsWith("opt-")), data as any];
            });
            const el = containerRef.current;
            if (!el || el.scrollHeight - el.scrollTop - el.clientHeight < 150)
              setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
          }
        })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "lms_messages", filter: `room_id=eq.${selectedRoom.id}` },
        (payload: any) => setMessages(prev => prev.map(m => m.id === payload.new.id ? { ...m, ...(payload.new as any) } : m)))
      .subscribe((s: string) => setIsOnline(s === "SUBSCRIBED"));
    channelRef.current = ch;
    return () => { supabase.removeChannel(ch); };
  }, [selectedRoom]);

  // Presence channel for typing indicators
  useEffect(() => {
    if (!selectedRoom || !userId || !profile) return;

    // Clean up old presence channel
    if (presenceChannelRef.current) {
      supabase.removeChannel(presenceChannelRef.current);
      presenceChannelRef.current = null;
    }
    setTypingUsers({});

    const presenceCh = supabase.channel(`typing-${selectedRoom.id}`, {
      config: { presence: { key: userId } }
    });

    presenceCh
      .on("broadcast", { event: "typing" }, ({ payload }: any) => {
        if (!payload?.userId || payload.userId === userId) return;
        setTypingUsers(prev => ({
          ...prev,
          [payload.userId]: { name: payload.name || "Someone", ts: Date.now() }
        }));
        // Auto-clear typing indicator after 3 seconds of silence
        setTimeout(() => {
          setTypingUsers(prev => {
            const next = { ...prev };
            if (next[payload.userId] && Date.now() - next[payload.userId].ts >= 2800) {
              delete next[payload.userId];
            }
            return next;
          });
        }, 3000);
      })
      .on("broadcast", { event: "stop_typing" }, ({ payload }: any) => {
        if (!payload?.userId || payload.userId === userId) return;
        setTypingUsers(prev => {
          const next = { ...prev };
          delete next[payload.userId];
          return next;
        });
      })
      .on("broadcast", { event: "seen" }, ({ payload }: any) => {
        // Partner saw our messages — update all our sent messages to seen
        if (!payload?.viewerUserId || payload.viewerUserId === userId) return;
        setMessages(prev => prev.map(m => {
          if (m.sender_id === userId && (m.status === "sent" || !m.status) && !m.id.startsWith("opt-")) {
            return { ...m, status: "seen" as const };
          }
          return m;
        }));
      })
      .subscribe();

    presenceChannelRef.current = presenceCh;
    return () => {
      if (presenceChannelRef.current) {
        supabase.removeChannel(presenceChannelRef.current);
        presenceChannelRef.current = null;
      }
    };
  }, [selectedRoom, userId, profile]);

  /* Broadcast typing to presence channel */
  const broadcastTyping = useCallback(() => {
    if (!presenceChannelRef.current || !userId || !profile) return;
    presenceChannelRef.current.send({
      type: "broadcast",
      event: "typing",
      payload: { userId, name: profile.full_name || "User" }
    });
    // Schedule stop_typing after 2.5 seconds of inactivity
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      presenceChannelRef.current?.send({
        type: "broadcast",
        event: "stop_typing",
        payload: { userId }
      });
    }, 2500);
  }, [userId, profile]);

  /* Auto-resize textarea to expand on more text */
  const adjustTextareaHeight = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    const nextHeight = Math.min(el.scrollHeight, 140);
    el.style.height = `${Math.max(nextHeight, 38)}px`;
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputText, adjustTextareaHeight]);

  // Global listener for incoming messages and new DM rooms across all chats
  useEffect(() => {
    if (!userId) return;

    const globalChannel = supabase
      .channel(`lms-global-${userId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "lms_messages" }, async (payload: any) => {
        const newMsg = payload.new;
        if (!selectedRoom || selectedRoom.id !== newMsg.room_id) {
          setRooms(prev => prev.map(r => {
            if (r.id === newMsg.room_id) {
              return {
                ...r,
                unread: (r.unread || 0) + 1,
                last_message: newMsg.text,
                last_message_at: newMsg.created_at,
              };
            }
            return r;
          }));
          // Play notification for messages from others in other rooms
          if (newMsg.sender_id !== userId && !isMuted) playNotificationSound();
        } else if (newMsg.sender_id !== userId && !isMuted) {
          // Also play for messages in current room from others
          playNotificationSound();
        }
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "lms_chat_rooms" }, async (payload: any) => {
        const newRoom = payload.new;
        if (newRoom.type === "dm" && (newRoom.dm_user1 === userId || newRoom.dm_user2 === userId)) {
          setRooms(prev => {
            if (prev.some(r => r.id === newRoom.id)) return prev;
            return [...prev, newRoom];
          });
          const partnerId = newRoom.dm_user1 === userId ? newRoom.dm_user2 : newRoom.dm_user1;
          if (partnerId) {
            const { data: p } = await supabase.from("profiles").select("id,full_name,role,avatar_url,username").eq("id", partnerId).maybeSingle();
            if (p) {
              setDmPartners(prev => ({ ...prev, [partnerId]: p }));
            }
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(globalChannel);
    };
  }, [userId, selectedRoom]);

  /* Mark partner's messages as seen via presence broadcast */
  const markRoomAsSeen = useCallback(() => {
    if (!selectedRoom || !userId || !presenceChannelRef.current) return;
    // Broadcast seen event so sender can update their tick
    presenceChannelRef.current.send({
      type: "broadcast",
      event: "seen",
      payload: { viewerUserId: userId, roomId: selectedRoom.id }
    });
  }, [selectedRoom, userId]);

  // Mark messages as seen when room loads or new message arrives
  useEffect(() => {
    if (!selectedRoom || !userId || !messages.length) return;
    const partnerMessages = messages.filter(m => m.sender_id !== userId && !m.id.startsWith("opt-"));
    if (!partnerMessages.length) return;
    // Use a small delay so channel is connected
    const t = setTimeout(() => markRoomAsSeen(), 600);
    return () => clearTimeout(t);
  }, [messages, selectedRoom, userId, markRoomAsSeen]);

  // Listen to seen broadcasts from partner to update our sent → seen
  useEffect(() => {
    if (!selectedRoom || !userId || !presenceChannelRef.current) return;
    // This is handled inside the presence channel subscription in the useEffect above
  }, [selectedRoom, userId]);

  /* Send message */
  const sendMessage = async (textOverride?: string) => {
    const text = (textOverride ?? inputText).trim();
    if (!text || !selectedRoom || !userId || sending) return;
    setSending(true);
    const optId = `opt-${Date.now()}`;
    const optimistic: Message = { id: optId, room_id: selectedRoom.id, sender_id: userId, text, reply_to: replyTo?.id || null, is_deleted: false, created_at: new Date().toISOString(), profiles: profile || undefined, status: "sending" };
    setMessages(prev => [...prev, optimistic]);
    if (!textOverride) setInputText("");
    setReplyTo(null);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    try {
      const { data, error } = await supabase
        .from("lms_messages")
        .insert({ room_id: selectedRoom.id, sender_id: userId, text, reply_to: replyTo?.id || null })
        .select(`id,room_id,sender_id,text,reply_to,is_deleted,created_at,file_url,file_name,file_type,file_size,reactions,is_pinned,profiles:sender_id(id,full_name,role,avatar_url)`)
        .single();

      if (error) {
        console.error("Message send error:", error);
        setMessages(prev => prev.filter(m => m.id !== optId));
        setInputText(text);
      } else if (data) {
        setMessages(prev => prev.map(m => m.id === optId ? { ...(data as any), status: "sent" } : m));
        setRooms(prev => prev.map(r => r.id === selectedRoom.id ? { ...r, last_message: text, last_message_at: data.created_at } : r));
      }
    } catch (e) {
      console.error("Send message exception:", e);
      setMessages(prev => prev.filter(m => m.id !== optId));
      setInputText(text);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  /* Start audio recording */
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : "";
      const options = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.start(200);
      setIsRecording(true);
      setRecordingDuration(0);

      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error("Microphone access error:", err);
      alert("Microphone permission is required to record voice notes. Please allow microphone access in your browser.");
    }
  };

  /* Cancel / discard recording */
  const cancelRecording = () => {
    if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    setIsRecording(false);
    setRecordingDuration(0);
    audioChunksRef.current = [];
  };

  /* Stop & send voice note */
  const stopAndSendRecording = () => {
    if (!mediaRecorderRef.current || !selectedRoom || !userId) return;
    if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);

    const durationSec = recordingDuration;
    setIsRecording(false);
    setSending(true);

    mediaRecorderRef.current.onstop = async () => {
      try {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop());
        }
        const finalType = mediaRecorderRef.current?.mimeType || "audio/webm";
        const audioBlob = new Blob(audioChunksRef.current, { type: finalType });
        if (audioBlob.size === 0) {
          setSending(false);
          return;
        }

        const ext = finalType.includes("mp4") ? "mp4" : "webm";
        const fileName = `voice_${Date.now()}.${ext}`;
        const filePath = `voice/${userId}/${fileName}`;

        // Upload to Supabase chat-attachments bucket
        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from("chat-attachments")
          .upload(filePath, audioBlob, {
            contentType: finalType,
            upsert: true,
          });

        if (uploadErr) {
          console.error("Audio upload error:", uploadErr);
          alert("Failed to upload audio message. Please try again.");
          setSending(false);
          return;
        }

        const { data: { publicUrl } } = supabase.storage
          .from("chat-attachments")
          .getPublicUrl(filePath);

        const textLabel = `🎤 Voice Note (${formatRecordTime(durationSec)})`;
        const optId = `opt-${Date.now()}`;
        const optimistic: Message = {
          id: optId,
          room_id: selectedRoom.id,
          sender_id: userId,
          text: textLabel,
          file_url: publicUrl,
          file_name: fileName,
          file_type: finalType,
          file_size: audioBlob.size,
          reply_to: replyTo?.id || null,
          is_deleted: false,
          created_at: new Date().toISOString(),
          profiles: profile || undefined,
        };

        setMessages(prev => [...prev, optimistic]);
        setReplyTo(null);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);

        const { data, error } = await supabase
          .from("lms_messages")
          .insert({
            room_id: selectedRoom.id,
            sender_id: userId,
            text: textLabel,
            file_url: publicUrl,
            file_name: fileName,
            file_type: finalType,
            file_size: audioBlob.size,
            reply_to: replyTo?.id || null,
          })
          .select(`id,room_id,sender_id,text,reply_to,is_deleted,created_at,file_url,file_name,file_type,file_size,reactions,is_pinned,profiles:sender_id(id,full_name,role,avatar_url)`)
          .single();

        if (error) {
          console.error("Audio message insert error:", error);
          setMessages(prev => prev.filter(m => m.id !== optId));
        } else if (data) {
          setMessages(prev => prev.map(m => m.id === optId ? (data as any) : m));
          setRooms(prev => prev.map(r => r.id === selectedRoom.id ? { ...r, last_message: textLabel, last_message_at: data.created_at } : r));
        }
      } catch (e) {
        console.error("Stop and send exception:", e);
      } finally {
        setSending(false);
        setRecordingDuration(0);
      }
    };

    mediaRecorderRef.current.stop();
  };

  /* File upload via paperclip */
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedRoom || !userId) return;
    setUploadingFile(true);
    try {
      const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const filePath = `files/${userId}/${Date.now()}_${cleanName}`;
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from("chat-attachments")
        .upload(filePath, file, { upsert: true });

      if (uploadErr) {
        console.error("File upload error:", uploadErr);
        alert("Failed to upload file. Please try again.");
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("chat-attachments")
        .getPublicUrl(filePath);

      const isImage = file.type.startsWith("image/");
      const isAud = file.type.startsWith("audio/");
      const textLabel = isImage ? "📷 Image" : isAud ? "🎵 Audio" : `📎 ${file.name}`;
      const optId = `opt-${Date.now()}`;
      const optimistic: Message = {
        id: optId,
        room_id: selectedRoom.id,
        sender_id: userId,
        text: textLabel,
        file_url: publicUrl,
        file_name: file.name,
        file_type: file.type || "application/octet-stream",
        file_size: file.size,
        reply_to: replyTo?.id || null,
        is_deleted: false,
        created_at: new Date().toISOString(),
        profiles: profile || undefined,
      };

      setMessages(prev => [...prev, optimistic]);
      setReplyTo(null);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);

      const { data, error } = await supabase
        .from("lms_messages")
        .insert({
          room_id: selectedRoom.id,
          sender_id: userId,
          text: textLabel,
          file_url: publicUrl,
          file_name: file.name,
          file_type: file.type || "application/octet-stream",
          file_size: file.size,
          reply_to: replyTo?.id || null,
        })
        .select(`id,room_id,sender_id,text,reply_to,is_deleted,created_at,file_url,file_name,file_type,file_size,reactions,is_pinned,profiles:sender_id(id,full_name,role,avatar_url)`)
        .single();

      if (error) {
        setMessages(prev => prev.filter(m => m.id !== optId));
      } else if (data) {
        setMessages(prev => prev.map(m => m.id === optId ? (data as any) : m));
        setRooms(prev => prev.map(r => r.id === selectedRoom.id ? { ...r, last_message: textLabel, last_message_at: data.created_at } : r));
      }
    } catch (err) {
      console.error("File upload exception:", err);
    } finally {
      setUploadingFile(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  /* ── Camera Handlers ── */
  const openCameraModal = async () => {
    setShowAttachMenu(false);
    setShowCameraModal(true);
    setCapturedPhoto(null);
    setCapturedBlob(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Webcam not supported");
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
        audio: false
      });
      cameraStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn("Camera access failed or unavailable, triggering device camera:", err);
      closeCameraModal();
      cameraFileRef.current?.click();
    }
  };

  const closeCameraModal = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(track => track.stop());
      cameraStreamRef.current = null;
    }
    setShowCameraModal(false);
    setCapturedPhoto(null);
    setCapturedBlob(null);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setCapturedPhoto(dataUrl);
    canvas.toBlob(blob => {
      if (blob) setCapturedBlob(blob);
    }, "image/jpeg", 0.9);
  };

  const retakePhoto = () => {
    setCapturedPhoto(null);
    setCapturedBlob(null);
  };

  const sendCapturedPhoto = async () => {
    if (!capturedBlob || !selectedRoom || !userId) return;
    setUploadingFile(true);
    closeCameraModal();
    try {
      const fileName = `camera_photo_${Date.now()}.jpg`;
      const filePath = `files/${userId}/${Date.now()}_${fileName}`;
      const { error: uploadErr } = await supabase.storage
        .from("chat-attachments")
        .upload(filePath, capturedBlob, { contentType: "image/jpeg", upsert: true });

      if (uploadErr) {
        console.error("Camera photo upload error:", uploadErr);
        alert("Failed to upload photo. Please try again.");
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("chat-attachments")
        .getPublicUrl(filePath);

      const optId = `opt-${Date.now()}`;
      const optimistic: Message = {
        id: optId,
        room_id: selectedRoom.id,
        sender_id: userId,
        text: "📷 Photo",
        file_url: publicUrl,
        file_name: fileName,
        file_type: "image/jpeg",
        file_size: capturedBlob.size,
        reply_to: replyTo?.id || null,
        is_deleted: false,
        created_at: new Date().toISOString(),
        profiles: profile || undefined,
      };

      setMessages(prev => [...prev, optimistic]);
      setReplyTo(null);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);

      const { data, error } = await supabase
        .from("lms_messages")
        .insert({
          room_id: selectedRoom.id,
          sender_id: userId,
          text: "📷 Photo",
          file_url: publicUrl,
          file_name: fileName,
          file_type: "image/jpeg",
          file_size: capturedBlob.size,
          reply_to: replyTo?.id || null,
        })
        .select(`id,room_id,sender_id,text,reply_to,is_deleted,created_at,file_url,file_name,file_type,file_size,reactions,is_pinned,profiles:sender_id(id,full_name,role,avatar_url)`)
        .single();

      if (error) {
        setMessages(prev => prev.filter(m => m.id !== optId));
      } else if (data) {
        setMessages(prev => prev.map(m => m.id === optId ? (data as any) : m));
        setRooms(prev => prev.map(r => r.id === selectedRoom.id ? { ...r, last_message: "📷 Photo", last_message_at: data.created_at } : r));
      }
    } catch (e) {
      console.error("Error sending captured photo:", e);
    } finally {
      setUploadingFile(false);
    }
  };

  /* ── Notes & Materials Handlers ── */
  const openMaterialsModal = async () => {
    setShowAttachMenu(false);
    setShowMaterialsModal(true);
    setLoadingMaterials(true);
    try {
      const { data } = await supabase
        .from("materials")
        .select("id, title, type, content_url, file_size, created_at, courses(title)")
        .order("created_at", { ascending: false })
        .limit(30);

      if (data) {
        setMaterialsList(data);
      }
    } catch (e) {
      console.error("Error loading materials:", e);
    } finally {
      setLoadingMaterials(false);
    }
  };

  const sendMaterialItem = async (mat: any) => {
    setShowMaterialsModal(false);
    const courseTitle = mat.courses?.title ? ` (${mat.courses.title})` : "";
    const msgText = `📚 **[Study Material] ${mat.title}${courseTitle}**\n${mat.content_url || "Check Notes & Materials in portal"}`;
    await sendMessage(msgText);
  };

  /* ── Tests & Quizzes Handlers ── */
  const openTestsModal = async () => {
    setShowAttachMenu(false);
    setShowTestsModal(true);
    setLoadingTests(true);
    try {
      const { data: testsData } = await supabase
        .from("tests")
        .select("id, title, duration, total_marks, courses(title)")
        .order("created_at", { ascending: false })
        .limit(20);

      const { data: assignmentsData } = await supabase
        .from("assignments")
        .select("id, title, total_marks, created_at")
        .order("created_at", { ascending: false })
        .limit(20);

      const combined: any[] = [];
      if (testsData && testsData.length > 0) {
        testsData.forEach((t: any) => combined.push({ ...t, itemType: "test" }));
      }
      if (assignmentsData && assignmentsData.length > 0) {
        assignmentsData.forEach((a: any) => combined.push({ ...a, itemType: "assignment" }));
      }

      setTestsList(combined);
    } catch (e) {
      console.error("Error loading tests:", e);
    } finally {
      setLoadingTests(false);
    }
  };

  const sendTestItem = async (item: any) => {
    setShowTestsModal(false);
    const isTest = item.itemType === "test";
    const course = item.courses?.title ? ` - ${item.courses.title}` : "";
    const msgText = isTest
      ? `📝 **[Test] ${item.title}${course}**\n${item.duration ? `Duration: ${item.duration} mins | ` : ""}${item.total_marks ? `Marks: ${item.total_marks}` : "Online Test"}\nAttempt Test: /tests`
      : `📝 **[Assignment] ${item.title}**\n${item.total_marks ? `Total Marks: ${item.total_marks}` : "Class Assignment"}\nSubmit in portal`;
    await sendMessage(msgText);
  };

  /* ── Code Snippet Handler ── */
  const insertCodeSnippet = () => {
    setShowAttachMenu(false);
    const el = inputRef.current;
    if (!el) return;
    const start = el.selectionStart || 0;
    const end = el.selectionEnd || 0;
    const selected = inputText.slice(start, end);
    const template = selected.trim()
      ? `\`\`\`html\n${selected}\n\`\`\``
      : `\`\`\`html\n<!DOCTYPE html>\n<html>\n  <head>\n    <title>Page</title>\n  </head>\n  <body>\n    \n  </body>\n</html>\n\`\`\``;
    const next = inputText.slice(0, start) + template + inputText.slice(end);
    setInputText(next);
    setTimeout(() => {
      el.focus();
      const cursorPos = selected.trim() ? start + template.length : start + 8 + 39;
      el.setSelectionRange(cursorPos, cursorPos);
    }, 20);
  };

  /* Start/Open DM with a user */
  const startDM = async (targetUser: OtherUser) => {
    setCreatingDM(targetUser.id);
    try {
      const res = await fetch("/api/chat/dm", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_user_id: targetUser.id }),
      });
      const { room_id } = await res.json();
      if (!room_id) return;
      setDmPartners(prev => ({ ...prev, [targetUser.id]: targetUser }));
      const existingRoom = rooms.find(r => r.id === room_id);
      if (existingRoom) {
        setSelectedRoom(existingRoom);
      } else {
        const newRoom: Room = { id: room_id, name: "dm", type: "dm", dm_user1: userId!, dm_user2: targetUser.id };
        setRooms(prev => [...prev, newRoom]);
        setSelectedRoom(newRoom);
      }
      setShowNewDM(false); setDmSearch(""); setShowMobileChat(true);
    } finally { setCreatingDM(null); }
  };

  /* React to message */
  const addReaction = async (msgId: string, emoji: string) => {
    if (!userId) return;
    setEmojiTarget(null);
    const msg = messages.find(m => m.id === msgId);
    if (!msg) return;
    const reactions = { ...(msg.reactions || {}) };
    const users: string[] = reactions[emoji] || [];
    if (users.includes(userId)) reactions[emoji] = users.filter(u => u !== userId);
    else reactions[emoji] = [...users, userId];
    if (!reactions[emoji].length) delete reactions[emoji];
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, reactions } : m));
    await supabase.from("lms_messages").update({ reactions }).eq("id", msgId);
  };

  /* Delete */
  const deleteMsg = async (msg: Message) => {
    if (msg.sender_id !== userId && profile?.role !== "admin") return;
    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, is_deleted: true } : m));
    await supabase.from("lms_messages").update({ is_deleted: true }).eq("id", msg.id);
  };

  /* Copy text */
  const copyText = (msg: Message) => {
    if (msg.text) {
      navigator.clipboard.writeText(msg.text);
      setCopiedMsgId(msg.id);
      setTimeout(() => setCopiedMsgId(null), 2000);
    }
    setMenuTarget(null);
  };

  /* Pin message */
  const togglePinMessage = async (msg: Message) => {
    setMenuTarget(null);
    const newPinned = !msg.is_pinned;
    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, is_pinned: newPinned } : m));
    await supabase.from("lms_messages").update({ is_pinned: newPinned }).eq("id", msg.id);
  };

  /* Save edit */
  const saveEditMsg = async (msgId: string, newText: string) => {
    const trimmed = newText.trim();
    if (!trimmed) return;
    setEditingMsg(null);
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, text: trimmed } : m));
    await supabase.from("lms_messages").update({ text: trimmed }).eq("id", msgId);
  };

  /* Pin room */
  const togglePin = async (roomId: string) => {
    if (!userId) return;
    if (pinned.has(roomId)) {
      await supabase.from("lms_pinned_rooms").delete().eq("user_id", userId).eq("room_id", roomId);
      setPinned(prev => { const s = new Set(prev); s.delete(roomId); return s; });
    } else {
      await supabase.from("lms_pinned_rooms").insert({ user_id: userId, room_id: roomId });
      setPinned(prev => new Set([...prev, roomId]));
    }
  };

  /* Shared media in info panel */
  const sharedMedia = messages.filter(m => m.file_url && m.file_type?.startsWith("image/"));
  const sharedFiles = messages.filter(m => m.file_url && !m.file_type?.startsWith("image/"));
  const sharedLinks = messages.filter(m => !m.file_url && /(https?:\/\/[^\s]+|www\.[^\s]+)/i.test(m.text));

  /* Filtered rooms */
  const filteredRooms = rooms.filter(r => {
    if (searchQuery && !r.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (activeTab === "Pin") return pinned.has(r.id);
    if (activeTab === "Groups") return r.type === "batch" || r.type === "course";
    if (activeTab === "Unread") return (r.unread || 0) > 0;
    return true;
  });


  /* Render a formatted code block with syntax colors, mac dots, badge & copy */
  const renderCodeBlock = (code: string, rawLang: string, key: string) => {
    const detected = detectCodeInText(code);
    const chosenLang = (rawLang && rawLang !== "code" && rawLang !== "text") ? rawLang : (detected.isCode ? detected.lang : "html");
    const prismLang = normalizePrismLang(chosenLang);
    const displayBadge = (chosenLang === "markup" || chosenLang === "html" ? "HTML" : chosenLang).toUpperCase();

    return (
      <div key={key} className="my-2 rounded-xl overflow-hidden border border-slate-700/60 shadow-md text-left w-full max-w-[540px]">
        {/* Code header bar */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-[#1e1e2e] border-b border-slate-700/60 select-none">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
            </div>
            <div className="flex items-center gap-1 ml-1 text-indigo-400">
              <Code2 size={12} />
              <span className="text-[10px] text-slate-300 font-mono font-bold tracking-wider">{displayBadge}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              navigator.clipboard.writeText(code);
              setCopiedCodeKey(key);
              setTimeout(() => setCopiedCodeKey(null), 2000);
            }}
            className="text-[10px] text-slate-400 hover:text-white px-2 py-0.5 rounded-md hover:bg-slate-700/60 transition-all flex items-center gap-1"
          >
            {copiedCodeKey === key ? (
              <>
                <Check size={11} className="text-emerald-400" />
                <span className="text-emerald-400 font-semibold">Copied!</span>
              </>
            ) : (
              <>
                <Copy size={11} />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        {/* Syntax Highlighter with Prism */}
        <SyntaxHighlighter
          language={prismLang}
          style={oneDark}
          customStyle={{
            margin: 0,
            padding: "10px 14px",
            fontSize: 11.5,
            lineHeight: 1.6,
            background: "#181825",
            maxHeight: 340,
            overflowX: "auto",
            overflowY: "auto",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
          }}
          wrapLines
          wrapLongLines={false}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    );
  };

  /* ── Render message text with code highlighting, inline code, links ── */
  const renderMessageText = (text: string, isOwn: boolean, msgId: string = "msg") => {
    if (!text) return null;

    // 0. Check for Study Material Card
    if (text.startsWith("📚 **[Study Material]")) {
      const titleMatch = text.match(/📚 \*\*\[Study Material\] ([^*]+)\*\*/);
      const title = titleMatch ? titleMatch[1] : "Study Material";
      const lines = text.split("\n");
      const urlLine = lines[1] || "";
      const isUrl = urlLine.startsWith("http");

      return (
        <div className="my-1 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-left min-w-[220px] max-w-[340px]">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/25 shrink-0">
              <BookOpen size={16} />
            </div>
            <div className="min-w-0">
              <span className="text-[9px] font-black uppercase tracking-wider text-amber-500 block">Notes & Material</span>
              <p className={`text-xs font-bold truncate ${isOwn ? "text-white" : "text-slate-800 dark:text-slate-100"}`}>{title}</p>
            </div>
          </div>
          {isUrl ? (
            <a
              href={urlLine}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="w-full py-1.5 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95"
            >
              <span>Open / Download</span>
              <ExternalLink size={12} />
            </a>
          ) : (
            <NextLink
              href="/materials"
              onClick={e => e.stopPropagation()}
              className="w-full py-1.5 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95"
            >
              <span>View in Portal</span>
              <ExternalLink size={12} />
            </NextLink>
          )}
        </div>
      );
    }

    // 0.1 Check for Test Card
    if (text.startsWith("📝 **[Test]") || text.startsWith("📝 **[Assignment]")) {
      const isAssignment = text.startsWith("📝 **[Assignment]");
      const titleMatch = text.match(/📝 \*\*\[(?:Test|Assignment)\] ([^*]+)\*\*/);
      const title = titleMatch ? titleMatch[1] : (isAssignment ? "Assignment" : "Online Test");
      const details = text.split("\n")[1] || "";

      return (
        <div className="my-1 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-left min-w-[220px] max-w-[340px]">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-md shadow-rose-500/25 shrink-0">
              <Award size={16} />
            </div>
            <div className="min-w-0">
              <span className="text-[9px] font-black uppercase tracking-wider text-rose-500 block">
                {isAssignment ? "LMS Assignment" : "Online Test / Quiz"}
              </span>
              <p className={`text-xs font-bold truncate ${isOwn ? "text-white" : "text-slate-800 dark:text-slate-100"}`}>{title}</p>
            </div>
          </div>
          {details && <p className={`text-[10px] mb-2 ${isOwn ? "text-indigo-100" : "text-slate-500 dark:text-slate-400"}`}>{details}</p>}
          <NextLink
            href={isAssignment ? "/dashboard" : "/tests"}
            onClick={e => e.stopPropagation()}
            className="w-full py-1.5 px-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95"
          >
            <span>{isAssignment ? "View Assignment" : "Start Test Now"}</span>
            <ExternalLink size={12} />
          </NextLink>
        </div>
      );
    }

    // 1. Split text by fenced code blocks: ```lang\ncode```
    if (text.includes("```")) {
      const fencedRegex = /```(\w*)\n?([\s\S]*?)```/g;
      const parts: React.ReactNode[] = [];
      let lastIndex = 0;
      let match;
      let keyIdx = 0;

      while ((match = fencedRegex.exec(text)) !== null) {
        const before = text.slice(lastIndex, match.index);
        if (before) parts.push(renderInlineText(before, isOwn, keyIdx++));

        const lang = match[1] || "";
        const code = match[2].trimEnd();
        parts.push(renderCodeBlock(code, lang, `${msgId}-fence-${keyIdx++}`));
        lastIndex = match.index + match[0].length;
      }

      const remaining = text.slice(lastIndex);
      if (remaining) parts.push(renderInlineText(remaining, isOwn, keyIdx++));

      return <>{parts}</>;
    }

    // 2. Check if text contains an HTML document or block
    const htmlBlockRegex = /(<!DOCTYPE\s+html[\s\S]*?<\/html>|<html[\s\S]*?<\/html>)/i;
    const htmlMatch = htmlBlockRegex.exec(text);
    if (htmlMatch) {
      const before = text.slice(0, htmlMatch.index);
      const htmlCode = htmlMatch[0].trim();
      const after = text.slice(htmlMatch.index + htmlMatch[0].length);
      return (
        <>
          {before ? renderInlineText(before, isOwn, 101) : null}
          {renderCodeBlock(htmlCode, "html", `${msgId}-html-auto`)}
          {after ? renderInlineText(after, isOwn, 102) : null}
        </>
      );
    }

    // 3. Auto-detect if raw message is code (e.g. HTML tags, Python, JS, etc.)
    const codeCheck = detectCodeInText(text);
    if (codeCheck.isCode) {
      return renderCodeBlock(text.trim(), codeCheck.lang, `${msgId}-auto-${codeCheck.lang}`);
    }

    // 4. Default inline text (with `code` and URLs)
    return renderInlineText(text, isOwn, 0);
  };

  /* Render inline text: detects `code`, URLs, plain text */
  const renderInlineText = (text: string, isOwn: boolean, keyBase: number): React.ReactNode => {
    // Split by inline code `...`
    const inlineRegex = /`([^`]+)`|(https?:\/\/[^\s]+|www\.[^\s]+)/g;
    const segments: React.ReactNode[] = [];
    let last = 0;
    let m;
    let k = keyBase * 1000;

    while ((m = inlineRegex.exec(text)) !== null) {
      if (m.index > last) {
        segments.push(<span key={k++}>{text.slice(last, m.index)}</span>);
      }
      if (m[1]) {
        // Inline code
        segments.push(
          <code key={k++} className={`px-1.5 py-0.5 rounded-md text-[11px] font-mono ${
            isOwn ? "bg-indigo-400/40 text-indigo-100" : "bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200"
          }`}>{m[1]}</code>
        );
      } else if (m[2]) {
        // URL
        const url = m[2].startsWith("http") ? m[2] : `https://${m[2]}`;
        segments.push(
          <a key={k++} href={url} target="_blank" rel="noreferrer"
            onClick={e => e.stopPropagation()}
            className={`underline underline-offset-2 break-all ${
              isOwn ? "text-indigo-200 hover:text-white" : "text-indigo-600 dark:text-indigo-400 hover:text-indigo-800"
            }`}>
            {m[2]}
          </a>
        );
      }
      last = m.index + m[0].length;
    }
    if (last < text.length) segments.push(<span key={k++}>{text.slice(last)}</span>);
    return segments.length ? <span key={keyBase}>{segments}</span> : <span key={keyBase}>{text}</span>;
  };

  /* Group messages by date */
  const grouped: { date: string; msgs: Message[] }[] = [];
  messages.forEach(m => {
    const d = formatDateLabel(m.created_at);
    const last = grouped[grouped.length - 1];
    if (last?.date === d) last.msgs.push(m);
    else grouped.push({ date: d, msgs: [m] });
  });

  const isReadOnly = selectedRoom?.type === "announcement" && profile?.role !== "admin";

  if (loading) return (
    <div className="fixed inset-0 z-[60] bg-white dark:bg-slate-900 md:relative md:inset-auto md:z-auto flex-1 flex items-center justify-center h-[100dvh] md:h-[calc(100vh-120px)]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Loading chat...</p>
      </div>
    </div>
  );

  return (
    <>
      <div 
        className="fixed inset-0 z-[60] h-[100dvh] w-full rounded-none border-0 md:relative md:inset-auto md:z-auto md:h-[calc(100vh-120px)] md:w-auto md:rounded-2xl md:border md:border-slate-200 md:dark:border-slate-800 md:shadow-sm flex bg-white dark:bg-slate-900 overflow-hidden" 
        onClick={() => { setEmojiTarget(null); setMenuTarget(null); }}
      >

      {/* ══════ LEFT SIDEBAR ══════ */}
      <div className={`${showMobileChat ? "hidden" : "flex"} md:flex w-full md:w-80 lg:w-88 border-r border-slate-200 dark:border-slate-800 flex-col shrink-0 bg-white dark:bg-slate-900 h-full`}>

        {/* Header */}
        <div className="px-4 pt-3.5 pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <NextLink href="/dashboard" className="md:hidden p-1.5 -ml-1 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" title="Back to Dashboard">
                <ArrowLeft size={18} />
              </NextLink>
              <h2 className="text-base font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
                Messages
              </h2>
            </div>
            <div className="flex items-center gap-1.5">
              {isOnline
                ? <span className="flex items-center gap-1 text-[9px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full"><Wifi size={10} /> Live</span>
                : <span className="flex items-center gap-1 text-[9px] font-black text-rose-500 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-full"><WifiOff size={10} /> Offline</span>}
              <button onClick={() => setShowNewDM(true)} title="New Direct Message"
                className="p-1.5 bg-indigo-50 dark:bg-indigo-950/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-500 rounded-xl transition-all">
                <SquarePen size={14} />
              </button>
            </div>
          </div>
          {/* Search */}
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search here..." value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-slate-100 dark:bg-slate-800/60 rounded-full text-xs text-slate-700 dark:text-slate-300 placeholder:text-slate-400 outline-none" />
          </div>
          {/* Tabs */}
          <div className="flex items-center gap-1 mt-3">
            {TAB.map(t => (
              <button key={t} onClick={() => setActiveTab(t)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-black transition-all ${activeTab === t ? "bg-indigo-500 text-white" : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"}`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Room list */}
        <div className="flex-1 overflow-y-auto">
          {filteredRooms.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">No conversations found</div>
          ) : filteredRooms.map(room => {
            const isSelected = room.id === selectedRoom?.id;
            const isPinned = pinned.has(room.id);
            const ICONS: Record<string, string> = { general: "💬", announcement: "📢", batch: "👥", course: "📚" };
            // For DM rooms — get partner
            const isDM = room.type === "dm";
            const partnerId = isDM ? (room.dm_user1 === userId ? room.dm_user2 : room.dm_user1) : null;
            const partner = partnerId ? dmPartners[partnerId] : null;
            const displayName = isDM ? (partner?.full_name || "Direct Message") : room.name;
            return (
              <button key={room.id} onClick={() => {
                setSelectedRoom(room);
                setShowMobileChat(true);
                setShowInfo(false);
                setRooms(prev => prev.map(r => r.id === room.id ? { ...r, unread: 0 } : r));
              }}
                className={`w-full flex items-center gap-3 px-4 py-3 transition-all border-b border-slate-50 dark:border-slate-800/50 text-left ${isSelected ? "bg-slate-50 dark:bg-slate-800/40" : "hover:bg-slate-50 dark:hover:bg-slate-800/30"}`}>
                {/* Avatar */}
                {isDM && partner ? (
                  <Avatar name={partner.full_name || "User"} size="md" url={partner.avatar_url} />
                ) : (
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center text-xl shrink-0 ${isSelected ? "bg-indigo-100 dark:bg-indigo-950/30" : "bg-slate-100 dark:bg-slate-800/60"}`}>
                    {ICONS[room.type] || "💬"}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm font-bold truncate ${isSelected ? "text-indigo-600 dark:text-indigo-400" : "text-slate-800 dark:text-slate-200"}`}>{displayName}</p>
                    <div className="flex items-center gap-1.5 shrink-0 ml-1">
                      {isPinned && <Pin size={9} className="text-indigo-400 fill-indigo-400" />}
                      {(room.unread || 0) > 0 && (
                        <span className="min-w-4 h-4 px-1 rounded-full bg-indigo-600 text-white text-[9px] font-black flex items-center justify-center animate-pulse">
                          {room.unread}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">
                    {room.last_message || (isDM ? (partner?.username ? `@${partner.username}` : "Direct Message") : `${room.type} channel`)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Profile footer */}
        {profile && (
          <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2.5">
            <Avatar name={profile.full_name || "User"} size="sm" url={profile.avatar_url} />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-black text-slate-800 dark:text-slate-200 truncate">{profile.full_name || "User"}</p>
              <p className="text-[10px] text-slate-400 capitalize">
                {profile.role}{profile.username ? ` · @${profile.username}` : ""}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ══════ CHAT PANEL ══════ */}
      {selectedRoom ? (
        <div className={`${!showMobileChat ? "hidden" : "flex"} md:flex flex-1 flex-col min-w-0 relative`}>

          {/* Chat Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <button onClick={() => setShowMobileChat(false)} className="md:hidden p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
              <ArrowLeft size={16} className="text-slate-500" />
            </button>
            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-950/30 flex items-center justify-center text-xl shrink-0">
              {({ general: "💬", announcement: "📢", batch: "👥", course: "📚" } as any)[selectedRoom.type] || "💬"}
            </div>
            <div className="flex-1 min-w-0">
              {/* DM: show partner name; Group: show room name */}
              {selectedRoom.type === "dm" ? (() => {
                const pid = selectedRoom.dm_user1 === userId ? selectedRoom.dm_user2 : selectedRoom.dm_user1;
                const p = pid ? dmPartners[pid] : null;
                return (<>
                  <div className="flex items-center gap-2">
                    <p className="font-black text-sm text-slate-800 dark:text-slate-200">{p?.full_name || "Direct Message"}</p>
                    {p?.username && (
                      <span className="text-xs font-black text-indigo-500">@{p.username}</span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400">
                    {messages.filter(m => !m.is_deleted).length} messages
                  </p>
                </>);
              })() : (<>
                <p className="font-black text-sm text-slate-800 dark:text-slate-200">{selectedRoom.name}</p>
                <p className="text-[10px] text-slate-400 capitalize">{selectedRoom.type} · {messages.filter(m => !m.is_deleted).length} messages</p>
              </>)}
            </div>
            <div className="flex items-center gap-1.5">
              {/* Mute/Unmute toggle */}
              <button
                onClick={() => setIsMuted(v => {
                  const next = !v;
                  try { localStorage.setItem("vision_chat_muted", String(next)); } catch {}
                  return next;
                })}
                title={isMuted ? "Unmute notifications" : "Mute notifications"}
                className={`p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all ${
                  isMuted ? "text-rose-400" : "text-slate-400"
                }`}
              >
                {isMuted ? <BellOff size={15} /> : <Bell size={15} />}
              </button>
              <button onClick={() => togglePin(selectedRoom.id)} title={pinned.has(selectedRoom.id) ? "Unpin" : "Pin"}
                className={`p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all ${pinned.has(selectedRoom.id) ? "text-indigo-500" : "text-slate-400"}`}>
                <Pin size={15} className={pinned.has(selectedRoom.id) ? "fill-indigo-500" : ""} />
              </button>
              <button onClick={() => setShowInfo(v => !v)}
                className={`p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all ${showInfo ? "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-500" : "text-slate-400"}`}>
                <Info size={15} />
              </button>
            </div>
          </div>

          {/* Messages area */}
          <div ref={containerRef} onScroll={() => {
            const el = containerRef.current;
            if (el) setShowScroll(el.scrollHeight - el.scrollTop - el.clientHeight > 200);
          }} className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-slate-50/30 dark:bg-slate-950/10">

            {grouped.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 py-16 text-center">
                <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/30 rounded-full flex items-center justify-center text-3xl">💬</div>
                <p className="font-bold text-sm text-slate-600 dark:text-slate-400">No messages yet</p>
                <p className="text-xs text-slate-400">Be the first to say something! 👋</p>
              </div>
            ) : grouped.map(({ date, msgs }) => (
              <div key={date}>
                {/* Date separator */}
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                  <span className="text-[10px] font-bold text-slate-400 bg-white dark:bg-slate-900 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm">{date}</span>
                  <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                </div>

                <div className="space-y-1.5">
                  {msgs.map((msg, i) => {
                    const isOwn = msg.sender_id === userId;
                    const senderName = (msg.profiles as any)?.full_name || "User";
                    const senderRole = (msg.profiles as any)?.role || "student";
                    const showSender = !isOwn && (i === 0 || msgs[i - 1]?.sender_id !== msg.sender_id);
                    const replyMsg = msg.reply_to ? messages.find(m => m.id === msg.reply_to) : null;
                    const totalReactions = Object.values(msg.reactions || {}).flat().length;
                    const isImg = msg.file_type?.startsWith("image/");
                    const isAudio = Boolean(
                      msg.file_type?.startsWith("audio/") ||
                      msg.file_name?.endsWith(".webm") ||
                      msg.file_name?.endsWith(".mp3") ||
                      msg.file_name?.endsWith(".wav") ||
                      msg.file_name?.endsWith(".ogg") ||
                      msg.file_name?.endsWith(".m4a")
                    );

                    if (msg.is_deleted) return (
                      <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                        <p className="text-[10px] italic text-slate-400 px-3 py-1.5 bg-slate-100 dark:bg-slate-800/50 rounded-xl">🚫 This message was deleted</p>
                      </div>
                    );

                    return (
                      <div key={msg.id}
                        className={`flex gap-2 group ${isOwn ? "flex-row-reverse" : "flex-row"}`}
                        onMouseEnter={() => setHoveredMsg(msg.id)}
                        onMouseLeave={() => { setHoveredMsg(null); }}>

                        {/* Avatar */}
                        <div className="w-8 shrink-0">
                          {!isOwn && showSender && <Avatar name={senderName} size="sm" url={(msg.profiles as any)?.avatar_url} />}
                        </div>

                        <div className={`max-w-[85%] md:max-w-[75%] flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
                          {/* Sender + time */}
                          {showSender && !isOwn && (
                            <div className="flex items-center gap-2 mb-1 px-1">
                              <span className="text-[10px] font-black text-slate-700 dark:text-slate-300">{senderName}</span>
                              {senderRole === "admin" && <span className="text-[8px] bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 px-1.5 rounded-full font-black">ADMIN</span>}
                            </div>
                          )}

                          {/* Reply preview */}
                          {replyMsg && !replyMsg.is_deleted && (
                            <div className={`px-3 py-1.5 rounded-t-xl text-[10px] mb-0.5 border-l-2 border-indigo-400 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 truncate max-w-full`}>
                              <span className="font-black text-indigo-500">{(replyMsg.profiles as any)?.full_name || "User"}: </span>
                              {replyMsg.text}
                            </div>
                          )}

                          {/* Bubble */}
                          <div className={`relative px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-sm ${isOwn ? "bg-indigo-500 text-white rounded-tr-sm" : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/60 rounded-tl-sm"}`}>
                            {msg.is_pinned && (
                              <div className={`flex items-center gap-1 text-[9px] font-black mb-1 ${isOwn ? "text-indigo-200" : "text-amber-500"}`}>
                                <Pin size={10} className="fill-current" />
                                <span>Pinned</span>
                              </div>
                            )}

                            {/* Editing inline */}
                            {editingMsg?.id === msg.id ? (
                              <div className="flex flex-col gap-2 min-w-[200px]" onClick={e => e.stopPropagation()}>
                                <input
                                  type="text"
                                  value={editingMsg.text}
                                  onChange={e => setEditingMsg({ id: msg.id, text: e.target.value })}
                                  autoFocus
                                  className={`w-full px-2.5 py-1.5 rounded-lg text-xs outline-none border ${isOwn ? "bg-indigo-600 text-white border-indigo-400 placeholder:text-indigo-300" : "bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 border-slate-300 dark:border-slate-600"}`}
                                  onKeyDown={e => {
                                    if (e.key === "Enter") saveEditMsg(msg.id, editingMsg.text);
                                    if (e.key === "Escape") setEditingMsg(null);
                                  }}
                                />
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => setEditingMsg(null)}
                                    className={`px-2 py-0.5 text-[10px] font-bold ${isOwn ? "text-white/80 hover:text-white" : "text-slate-500 hover:text-slate-700"}`}
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => saveEditMsg(msg.id, editingMsg.text)}
                                    className={`px-2.5 py-0.5 text-[10px] font-black rounded-md shadow-sm ${isOwn ? "bg-white text-indigo-600 hover:bg-indigo-50" : "bg-indigo-500 text-white hover:bg-indigo-600"}`}
                                  >
                                    Save
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                {/* File attachment */}
                                {msg.file_url && (
                                  isImg ? (
                                    <img src={msg.file_url} alt={msg.file_name || "img"} className="rounded-xl mb-2 max-w-[200px] cursor-pointer" onClick={() => window.open(msg.file_url!, "_blank")} />
                                  ) : isAudio ? (
                                    <div className="mb-0.5">
                                      <AudioMessagePlayer url={msg.file_url} isOwn={isOwn} />
                                    </div>
                                  ) : (
                                    <div className={`flex items-center gap-2 mb-2 p-2 rounded-xl ${isOwn ? "bg-indigo-400/40" : "bg-slate-100 dark:bg-slate-700/50"}`}>
                                      <FileText size={16} className={isOwn ? "text-white/80" : "text-slate-400"} />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-bold truncate">{msg.file_name}</p>
                                        <p className={`text-[9px] ${isOwn ? "text-white/60" : "text-slate-400"}`}>{formatFileSize(msg.file_size)}</p>
                                      </div>
                                      <a href={msg.file_url} download target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                                        className={`p-1 rounded-lg ${isOwn ? "hover:bg-indigo-400" : "hover:bg-slate-200 dark:hover:bg-slate-600"}`}>
                                        <Download size={12} />
                                      </a>
                                    </div>
                                  )
                                )}
                                {!isAudio && (
                                  <div className={`text-xs leading-relaxed whitespace-pre-wrap break-words ${isOwn ? "text-white" : "text-slate-800 dark:text-slate-200"}`}>
                                    {renderMessageText(msg.text, isOwn, msg.id)}
                                  </div>
                                )}
                              </>
                            )}
                          </div>

                          {/* Reactions */}
                          {totalReactions > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1 px-1">
                              {Object.entries(msg.reactions || {}).map(([emoji, users]) => users.length > 0 && (
                                <button key={emoji} onClick={e => { e.stopPropagation(); addReaction(msg.id, emoji); }}
                                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all ${(users as string[]).includes(userId || "") ? "bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800 text-indigo-600" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"} hover:scale-105`}>
                                  {emoji} <span>{(users as string[]).length}</span>
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Time + Status Tick */}
                          <div className="flex items-center gap-1 mt-0.5 px-1">
                            <span className="text-[9px] text-slate-400">{formatTime(msg.created_at)}</span>
                            {isOwn && !msg.id.startsWith("opt-") && (
                              <span className={`flex items-center -space-x-1 ${
                                msg.status === "seen" ? "text-indigo-500" :
                                msg.status === "sending" ? "text-slate-300" :
                                "text-slate-400"
                              }`}>
                                {msg.status === "sending" ? (
                                  <Check size={10} strokeWidth={2.5} />
                                ) : msg.status === "seen" ? (
                                  <>
                                    <Check size={10} strokeWidth={2.5} />
                                    <Check size={10} strokeWidth={2.5} />
                                  </>
                                ) : (
                                  <>
                                    <Check size={10} strokeWidth={2.5} />
                                    <Check size={10} strokeWidth={2.5} />
                                  </>
                                )}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Hover actions + 3 Dot Menu */}
                        {(hoveredMsg === msg.id || menuTarget === msg.id || emojiTarget === msg.id) && (
                          <div className={`flex items-center gap-1 transition-all self-center ${isOwn ? "flex-row-reverse mr-1" : "ml-1"}`}>
                            {/* React button */}
                            <button onClick={e => { e.stopPropagation(); setEmojiTarget(prev => prev === msg.id ? null : msg.id); setMenuTarget(null); }}
                              title="Add reaction"
                              className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 shadow-sm transition-all">
                              <Smile size={12} />
                            </button>

                            {/* Reply button */}
                            <button onClick={() => { setReplyTo(msg); inputRef.current?.focus(); }}
                              title="Reply"
                              className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 shadow-sm transition-all">
                              <Reply size={12} />
                            </button>

                            {/* 3 DOTS MENU */}
                            <div className="relative">
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  setMenuTarget(prev => prev === msg.id ? null : msg.id);
                                  setEmojiTarget(null);
                                }}
                                title="More options"
                                className={`p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 shadow-sm transition-all ${menuTarget === msg.id ? "bg-indigo-50 text-indigo-600 border-indigo-300" : ""}`}>
                                <MoreVertical size={12} />
                              </button>

                              {/* Dropdown Menu */}
                              {menuTarget === msg.id && (
                                <div
                                  className={`absolute z-50 bottom-full mb-1.5 ${isOwn ? "right-0" : "left-0"} w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl py-1 text-xs backdrop-blur-md`}
                                  onClick={e => e.stopPropagation()}>
                                  
                                  {/* Copy Text */}
                                  <button
                                    onClick={() => copyText(msg)}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-800 hover:text-indigo-600 transition-colors text-left font-medium">
                                    {copiedMsgId === msg.id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                                    <span>{copiedMsgId === msg.id ? "Copied!" : "Copy Text"}</span>
                                  </button>

                                  {/* Reply */}
                                  <button
                                    onClick={() => {
                                      setReplyTo(msg);
                                      setMenuTarget(null);
                                      inputRef.current?.focus();
                                    }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-800 hover:text-indigo-600 transition-colors text-left font-medium">
                                    <Reply size={14} />
                                    <span>Reply</span>
                                  </button>

                                  {/* Pin / Unpin */}
                                  <button
                                    onClick={() => togglePinMessage(msg)}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-800 hover:text-indigo-600 transition-colors text-left font-medium">
                                    <Pin size={14} className={msg.is_pinned ? "text-indigo-500 fill-indigo-500" : ""} />
                                    <span>{msg.is_pinned ? "Unpin Message" : "Pin Message"}</span>
                                  </button>

                                  {/* Edit (only for own text messages) */}
                                  {isOwn && !msg.file_url && (
                                    <button
                                      onClick={() => {
                                        setEditingMsg({ id: msg.id, text: msg.text });
                                        setMenuTarget(null);
                                      }}
                                      className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-800 hover:text-indigo-600 transition-colors text-left font-medium">
                                      <Edit3 size={14} />
                                      <span>Edit Message</span>
                                    </button>
                                  )}

                                  {/* Delete */}
                                  {(isOwn || profile?.role === "admin") && (
                                    <button
                                      onClick={() => {
                                        deleteMsg(msg);
                                        setMenuTarget(null);
                                      }}
                                      className="w-full flex items-center gap-2.5 px-3 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors text-left font-medium border-t border-slate-100 dark:border-slate-800/60 mt-1 pt-1.5">
                                      <Trash2 size={14} />
                                      <span>Delete</span>
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Emoji picker */}
                        {emojiTarget === msg.id && (
                          <div className={`absolute z-50 flex items-center gap-1 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl ${isOwn ? "right-12" : "left-12"}`}
                            onClick={e => e.stopPropagation()}>
                            {EMOJIS.map(e => (
                              <button key={e} onClick={() => addReaction(msg.id, e)}
                                className="text-base hover:scale-125 transition-transform p-0.5">{e}</button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Scroll to bottom */}
          {showScroll && (
            <button onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })}
              className="absolute bottom-24 right-6 w-9 h-9 bg-indigo-500 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-indigo-600 transition-all z-10">
              <ChevronDown size={18} />
            </button>
          )}

          {/* Typing indicator */}
          {Object.keys(typingUsers).length > 0 && (
            <div className="px-4 py-1.5 flex items-center gap-2 animate-in fade-in duration-200">
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
              <span className="text-[10px] text-slate-400 italic">
                {Object.values(typingUsers).map(u => u.name).join(", ")}{" "}
                {Object.keys(typingUsers).length === 1 ? "is" : "are"} typing...
              </span>
            </div>
          )}

          {/* Reply banner */}
          {replyTo && (
            <div className="px-4 py-2 bg-indigo-50 dark:bg-indigo-950/20 border-t border-indigo-200/50 flex items-center gap-2">
              <Reply size={13} className="text-indigo-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-black text-indigo-600">Replying to {(replyTo.profiles as any)?.full_name || "User"}</p>
                <p className="text-[10px] text-slate-500 truncate">{replyTo.text}</p>
              </div>
              <button onClick={() => setReplyTo(null)} className="p-1 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-lg text-indigo-400">
                <X size={12} />
              </button>
            </div>
          )}

          {/* Input */}
          {selectedRoom.type === "dm" && (() => {
            const pid = selectedRoom.dm_user1 === userId ? selectedRoom.dm_user2 : selectedRoom.dm_user1;
            return pid && blockedUsers.has(pid);
          })() ? (
            <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-800 bg-rose-50 dark:bg-rose-950/20 flex items-center justify-between">
              <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                You have blocked this contact.
              </p>
              <button
                onClick={() => {
                  const pid = selectedRoom.dm_user1 === userId ? selectedRoom.dm_user2 : selectedRoom.dm_user1;
                  if (pid) toggleBlockContact(pid);
                }}
                className="text-xs font-black text-rose-600 hover:text-rose-700 underline"
              >
                Unblock
              </button>
            </div>
          ) : isReadOnly ? (
            <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2.5 bg-amber-50 dark:bg-amber-950/20">
              <span className="text-lg">📢</span>
              <div>
                <p className="text-xs font-black text-amber-700 dark:text-amber-400">Announcements — Read Only</p>
                <p className="text-[10px] text-amber-600/70">Only admins can post in this channel.</p>
              </div>
            </div>
          ) : isRecording ? (
            <div className="px-4 py-2.5 border-t border-slate-200 dark:border-slate-800 bg-rose-50/70 dark:bg-rose-950/20 flex items-center justify-between gap-3 animate-in fade-in duration-200">
              {/* Left: Pulsing red dot and recording timer */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="relative flex items-center justify-center">
                  <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping absolute" />
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 relative" />
                </div>
                <span className="font-mono text-xs font-black text-rose-600 dark:text-rose-400">
                  {formatRecordTime(recordingDuration)}
                </span>
              </div>

              {/* Center: Live soundwave bouncing animation */}
              <div className="flex-1 flex items-center justify-center gap-1 h-6 max-w-[200px] overflow-hidden">
                {[8, 16, 24, 12, 28, 20, 14, 26, 18, 10, 22, 14].map((h, i) => (
                  <div
                    key={i}
                    className="w-1 bg-rose-500/70 rounded-full animate-pulse"
                    style={{
                      height: `${h}px`,
                      animationDuration: `${0.4 + (i % 5) * 0.15}s`,
                      animationDelay: `${(i % 3) * 0.1}s`
                    }}
                  />
                ))}
              </div>

              {/* Right: Cancel & Send Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={cancelRecording}
                  title="Discard recording"
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-100 dark:hover:bg-slate-800 rounded-full transition-all"
                >
                  <Trash2 size={16} />
                </button>
                <button
                  type="button"
                  onClick={stopAndSendRecording}
                  disabled={sending}
                  title="Send voice note"
                  className="p-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-full transition-all shadow-md active:scale-95 flex items-center justify-center"
                >
                  {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                </button>
              </div>
            </div>
          ) : (
            <div className="px-4 py-2.5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <form onSubmit={e => { e.preventDefault(); sendMessage(); }} className="flex items-end gap-2">
                {/* Hidden file & camera inputs */}
                <input ref={fileRef} type="file" onChange={handleFileUpload} className="hidden" />
                <input ref={cameraFileRef} type="file" accept="image/*" capture="environment" onChange={handleFileUpload} className="hidden" />

                {/* Single Attachment Trigger Button & Drawer */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowAttachMenu(prev => !prev)}
                    disabled={uploadingFile}
                    title="Attach & Features"
                    className={`p-2 mb-0.5 rounded-xl transition-all shrink-0 flex items-center justify-center ${
                      showAttachMenu
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/25 rotate-45 scale-105"
                        : "text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
                    }`}
                  >
                    {uploadingFile ? <Loader2 size={16} className="animate-spin text-indigo-500" /> : <Plus size={18} className="transition-transform duration-200" />}
                  </button>

                  {/* Attachment Features Drawer Tray */}
                  {showAttachMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowAttachMenu(false)} />
                      <div className="absolute bottom-12 left-0 z-50 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl min-w-[280px] sm:min-w-[320px] animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-150">
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 px-1">
                          Share Feature
                        </p>
                        <div className="grid grid-cols-5 gap-1">
                          {/* 1. Camera */}
                          <button
                            type="button"
                            onClick={openCameraModal}
                            className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all group"
                          >
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-md shadow-emerald-500/25 group-hover:scale-110 transition-transform">
                              <Camera size={18} />
                            </div>
                            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">Camera</span>
                          </button>

                          {/* 2. Document / File */}
                          <button
                            type="button"
                            onClick={() => {
                              setShowAttachMenu(false);
                              fileRef.current?.click();
                            }}
                            className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all group"
                          >
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/25 group-hover:scale-110 transition-transform">
                              <FileText size={18} />
                            </div>
                            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">File</span>
                          </button>

                          {/* 3. Notes & Materials */}
                          <button
                            type="button"
                            onClick={openMaterialsModal}
                            className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all group"
                          >
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-400 text-white flex items-center justify-center shadow-md shadow-amber-500/25 group-hover:scale-110 transition-transform">
                              <BookOpen size={18} />
                            </div>
                            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">Notes</span>
                          </button>

                          {/* 4. Tests */}
                          <button
                            type="button"
                            onClick={openTestsModal}
                            className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all group"
                          >
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 text-white flex items-center justify-center shadow-md shadow-rose-500/25 group-hover:scale-110 transition-transform">
                              <Award size={18} />
                            </div>
                            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">Tests</span>
                          </button>

                          {/* 5. Code */}
                          <button
                            type="button"
                            onClick={insertCodeSnippet}
                            className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all group"
                          >
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-purple-500 text-white flex items-center justify-center shadow-md shadow-violet-500/25 group-hover:scale-110 transition-transform">
                              <Code2 size={18} />
                            </div>
                            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">Code</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={inputText}
                  onChange={e => {
                    setInputText(e.target.value);
                    broadcastTyping();
                  }}
                  placeholder="Write message... (Shift+Enter for newline)"
                  className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-800/60 rounded-2xl text-xs md:text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 outline-none focus:bg-white dark:focus:bg-slate-800 border border-transparent focus:border-indigo-300 dark:focus:border-indigo-500/50 transition-all resize-none leading-relaxed overflow-y-auto"
                  style={{ minHeight: "38px", maxHeight: "140px" }}
                  onKeyDown={e => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    } else if (e.key === "Escape") {
                      setReplyTo(null);
                    }
                  }}
                />

                {inputText.trim() ? (
                  <button type="submit" disabled={sending}
                    className="px-4 py-2.5 mb-0.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 text-white rounded-full text-xs font-black transition-all flex items-center gap-1.5 shrink-0 shadow-sm active:scale-95">
                    {sending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                    <span>Send</span>
                  </button>
                ) : (
                  <button type="button" onClick={startRecording} title="Record voice message"
                    className="p-2.5 mb-0.5 bg-indigo-50 dark:bg-indigo-950/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-full transition-all shrink-0 active:scale-95 shadow-sm">
                    <Mic size={16} />
                  </button>
                )}
              </form>
            </div>
          )}
        </div>
      ) : (
        <div className="hidden md:flex flex-1 flex-col items-center justify-center p-8 text-center text-slate-400 text-sm">
          <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
            <MessageSquare size={32} />
          </div>
          <p className="font-bold text-slate-700 dark:text-slate-300 mb-1">Vision Learn Chat</p>
          <p className="text-xs text-slate-400 mb-4">Select a conversation or start a new message</p>
          <button
            onClick={() => setShowNewDM(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
          >
            <SquarePen size={14} />
            <span>New Message</span>
          </button>
        </div>
      )}

      {/* ══════ INFO PANEL ══════ */}
      {showInfo && selectedRoom && (
        <div className="fixed inset-0 z-[70] lg:relative lg:inset-auto lg:z-auto w-full lg:w-72 border-l-0 lg:border-l border-slate-200 dark:border-slate-800 flex flex-col bg-white dark:bg-slate-900 overflow-y-auto animate-in slide-in-from-right duration-200">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <button onClick={() => setShowInfo(false)} className="lg:hidden p-1.5 -ml-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500" title="Back">
                <ArrowLeft size={18} />
              </button>
              <h3 className="font-black text-sm text-slate-800 dark:text-slate-200">
                {selectedRoom.type === "dm" ? "Contact Info" : "Room Info"}
              </h3>
            </div>
            <button onClick={() => setShowInfo(false)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400">
              <X size={16} />
            </button>
          </div>

          {/* Room info */}
          <div className="p-4 text-center border-b border-slate-100 dark:border-slate-800">
            {selectedRoom.type === "dm" ? (() => {
              const pid = selectedRoom.dm_user1 === userId ? selectedRoom.dm_user2 : selectedRoom.dm_user1;
              const p = pid ? dmPartners[pid] : null;
              return (
                <div className="flex flex-col items-center">
                  <div className="mb-2">
                    <Avatar name={p?.full_name || "User"} size="lg" url={p?.avatar_url} />
                  </div>
                  <h4 className="font-black text-sm text-slate-800 dark:text-slate-200">{p?.full_name || "Direct Message"}</h4>
                  {p?.username && (
                    <span className="text-xs font-black text-indigo-500 mt-0.5">@{p.username}</span>
                  )}
                  <span className="text-[10px] text-slate-400 mt-1">Direct Message</span>
                </div>
              );
            })() : (
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-950/30 flex items-center justify-center text-3xl mx-auto mb-2">
                  {({ general: "💬", announcement: "📢", batch: "👥", course: "📚" } as any)[selectedRoom.type] || "💬"}
                </div>
                <h4 className="font-black text-sm text-slate-800 dark:text-slate-200">{selectedRoom.name}</h4>
                <p className="text-[10px] text-slate-400 capitalize mt-0.5">{selectedRoom.type} channel</p>
              </div>
            )}
            <div className="flex items-center justify-center gap-3 mt-3">
              <button onClick={() => togglePin(selectedRoom.id)}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all ${pinned.has(selectedRoom.id) ? "text-indigo-500" : "text-slate-400"}`}>
                <Pin size={16} className={pinned.has(selectedRoom.id) ? "fill-indigo-500" : ""} />
                <span className="text-[9px] font-bold">{pinned.has(selectedRoom.id) ? "Unpin" : "Pin"}</span>
              </button>
            </div>
          </div>

          {/* Shared content tabs */}
          <div className="p-3 border-b border-slate-100 dark:border-slate-800">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Shared media ({sharedMedia.length + sharedFiles.length}+)</p>
            <div className="flex gap-1">
              {(["Media", "Files", "Links"] as const).map(t => (
                <button key={t} onClick={() => setInfoTab(t)}
                  className={`flex-1 py-1.5 rounded-xl text-[10px] font-black transition-all ${infoTab === t ? "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {infoTab === "Media" && (
              <div className="grid grid-cols-3 gap-1">
                {sharedMedia.length === 0 ? (
                  <div className="col-span-3 text-center py-8 text-xs text-slate-400">No shared media</div>
                ) : sharedMedia.map(m => (
                  <img key={m.id} src={m.file_url!} alt="" onClick={() => window.open(m.file_url!, "_blank")}
                    className="w-full aspect-square object-cover rounded-lg cursor-pointer hover:opacity-90 transition-all" />
                ))}
              </div>
            )}
            {infoTab === "Files" && (
              <div className="space-y-2">
                {sharedFiles.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400">No shared files</div>
                ) : sharedFiles.map(m => {
                  const ext = m.file_name?.split(".").pop()?.toLowerCase();
                  return (
                    <a key={m.id} href={m.file_url!} download target="_blank" rel="noreferrer"
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 transition-all group">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        ext === "pdf" ? "bg-rose-50 dark:bg-rose-950/30 text-rose-500" :
                        ext === "doc" || ext === "docx" ? "bg-blue-50 dark:bg-blue-950/30 text-blue-500" :
                        ext === "xls" || ext === "xlsx" ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500" :
                        ext === "fig" ? "bg-purple-50 dark:bg-purple-950/30 text-purple-500" :
                        "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-500"
                      }`}>
                        <FileText size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate group-hover:text-indigo-600 transition-colors">{m.file_name || "Document"}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{formatShortDate(m.created_at)} · {formatFileSize(m.file_size)}</p>
                      </div>
                      <div className="p-1.5 rounded-lg text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 dark:group-hover:bg-slate-700 transition-all shrink-0">
                        <Download size={14} />
                      </div>
                    </a>
                  );
                })}
              </div>
            )}
            {infoTab === "Links" && (
              <div className="space-y-2">
                {sharedLinks.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400">No shared links</div>
                ) : sharedLinks.map(m => {
                  const url = m.text.match(/(https?:\/\/[^\s]+|www\.[^\s]+)/i)?.[0] || "";
                  const href = url.startsWith("http") ? url : `https://${url}`;
                  return (
                    <a key={m.id} href={href} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 transition-all group">
                      <LinkIcon size={13} className="text-indigo-500 shrink-0 group-hover:scale-110 transition-transform" />
                      <p className="text-[10px] text-slate-600 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate font-medium">{url}</p>
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {/* Options: Favourites, Delete, Block */}
          {selectedRoom.type === "dm" && (() => {
            const pid = selectedRoom.dm_user1 === userId ? selectedRoom.dm_user2 : selectedRoom.dm_user1;
            const isBlocked = pid ? blockedUsers.has(pid) : false;
            const isFav = pinned.has(selectedRoom.id);

            return (
              <div className="border-t border-slate-100 dark:border-slate-800 p-4 space-y-3.5 bg-white dark:bg-slate-900 shrink-0">
                {/* Add to Favourites */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Add to Favourites
                  </span>
                  <button
                    type="button"
                    onClick={() => togglePin(selectedRoom.id)}
                    className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      isFav ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-700"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        isFav ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* Delete this Contact */}
                <button
                  onClick={() => deleteContact(selectedRoom.id)}
                  className="w-full flex items-center justify-between text-left text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 py-1 transition-colors"
                >
                  <span>Delete this Contact</span>
                </button>

                {/* Block this Contact */}
                {pid && (
                  <button
                    onClick={() => toggleBlockContact(pid)}
                    className="w-full flex items-center justify-between text-left text-xs font-semibold text-rose-500 hover:text-rose-600 py-1 transition-colors"
                  >
                    <span>{isBlocked ? "Unblock this Contact" : "Block this Contact"}</span>
                  </button>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>

    {/* ══════ NEW DM MODAL ══════ */}
    {showNewDM && (
      <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
        onClick={() => setShowNewDM(false)}>
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden"
          onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <SquarePen size={16} className="text-indigo-500" />
              <h3 className="font-black text-sm text-slate-800 dark:text-slate-200">New Direct Message</h3>
            </div>
            <button onClick={() => setShowNewDM(false)}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400">
              <X size={14} />
            </button>
          </div>
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Search by name or @username..."
                value={dmSearch} onChange={e => setDmSearch(e.target.value)} autoFocus
                className="w-full pl-8 pr-3 py-2.5 bg-slate-100 dark:bg-slate-800/60 rounded-xl text-xs text-slate-700 dark:text-slate-300 placeholder:text-slate-400 outline-none" />
            </div>
          </div>
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800/40">
            {(() => {
              const usersWithUsername = allUsers.filter(u => Boolean(u.username && u.username.trim()));
              const q = dmSearch.trim().toLowerCase().replace(/^@/, "");
              const filtered = usersWithUsername.filter(u => {
                if (!q) return true;
                return (
                  (u.full_name || "").toLowerCase().includes(q) ||
                  (u.username || "").toLowerCase().includes(q)
                );
              });

              if (filtered.length === 0) {
                return (
                  <div className="p-8 text-center text-xs text-slate-400">
                    <UserCircle2 size={24} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    {q ? `No user found matching "@${q}"` : "Only users with a registered @username appear here."}
                  </div>
                );
              }

              return filtered.map(u => (
                <button key={u.id} onClick={() => startDM(u)} disabled={creatingDM === u.id}
                  className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all text-left disabled:opacity-60 group">
                  <div className="relative">
                    <Avatar name={u.full_name || "User"} size="md" url={u.avatar_url} />
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {u.full_name || "Unknown"}
                      </p>
                      {creatingDM === u.id
                        ? <Loader2 size={14} className="animate-spin text-indigo-500 shrink-0" />
                        : <span className="text-[10px] text-indigo-500 font-black shrink-0">Message →</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] font-black text-indigo-500">
                        @{u.username}
                      </span>
                      {u.role === "admin" && (
                        <span className="text-[8px] bg-amber-100 text-amber-700 px-1.5 rounded font-black">
                          TEACHER
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ));
            })()}
          </div>
        </div>
      </div>
    )}

      {/* ══════ CAMERA CAPTURE MODAL ══════ */}
      {showCameraModal && (
        <div className="fixed inset-0 z-[80] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera size={18} className="text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Camera</h3>
              </div>
              <button
                onClick={closeCameraModal}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 flex flex-col items-center">
              {!capturedPhoto ? (
                <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden flex items-center justify-center shadow-inner">
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                  <div className="absolute inset-0 border-2 border-white/20 rounded-2xl pointer-events-none" />
                </div>
              ) : (
                <div className="w-full aspect-video bg-black rounded-2xl overflow-hidden flex items-center justify-center shadow-inner">
                  <img src={capturedPhoto} alt="Captured" className="w-full h-full object-contain" />
                </div>
              )}

              {/* Controls */}
              <div className="flex items-center justify-center gap-4 mt-5 w-full">
                {!capturedPhoto ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        closeCameraModal();
                        cameraFileRef.current?.click();
                      }}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-all"
                    >
                      Device Camera / Files
                    </button>
                    <button
                      type="button"
                      onClick={capturePhoto}
                      title="Snap photo"
                      className="w-14 h-14 rounded-full border-4 border-white bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/40 active:scale-90 transition-all flex items-center justify-center text-white"
                    >
                      <Camera size={22} />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={retakePhoto}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <RotateCw size={14} />
                      <span>Retake</span>
                    </button>
                    <button
                      type="button"
                      onClick={sendCapturedPhoto}
                      disabled={uploadingFile}
                      className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-md shadow-emerald-500/30 active:scale-95"
                    >
                      {uploadingFile ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                      <span>Send Photo</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════ NOTES & MATERIALS MODAL ══════ */}
      {showMaterialsModal && (
        <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-sm">
                  <BookOpen size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Share Notes & Materials</h3>
                  <p className="text-[10px] text-slate-400">Select material to send into this chat</p>
                </div>
              </div>
              <button
                onClick={() => setShowMaterialsModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {/* Search */}
            <div className="p-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs">
                <Search size={14} className="text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={materialSearch}
                  onChange={e => setMaterialSearch(e.target.value)}
                  placeholder="Search notes, shortcuts, PDF..."
                  className="bg-transparent outline-none w-full text-slate-800 dark:text-slate-200 placeholder:text-slate-400 text-xs"
                />
              </div>
            </div>

            {/* List */}
            <div className="p-3 overflow-y-auto space-y-2 flex-1">
              {loadingMaterials ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <Loader2 size={24} className="animate-spin text-amber-500" />
                  <p className="text-xs font-semibold">Loading materials...</p>
                </div>
              ) : materialsList.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No materials found in portal.
                </div>
              ) : (
                materialsList
                  .filter(m => !materialSearch || m.title.toLowerCase().includes(materialSearch.toLowerCase()))
                  .map(mat => (
                    <button
                      key={mat.id}
                      type="button"
                      onClick={() => sendMaterialItem(mat)}
                      className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 text-left transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          <FileText size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-amber-600 transition-colors">
                            {mat.title}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {mat.courses?.title || (mat.type ? `Type: ${mat.type}` : "Study Material")}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black text-amber-600 bg-amber-100 dark:bg-amber-950/60 px-2 py-1 rounded-lg shrink-0">
                        Send →
                      </span>
                    </button>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════ TESTS & QUIZZES MODAL ══════ */}
      {showTestsModal && (
        <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-sm">
                  <Award size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Share Tests & Quizzes</h3>
                  <p className="text-[10px] text-slate-400">Invite batch or students to attempt a test</p>
                </div>
              </div>
              <button
                onClick={() => setShowTestsModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {/* Search */}
            <div className="p-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs">
                <Search size={14} className="text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={testSearch}
                  onChange={e => setTestSearch(e.target.value)}
                  placeholder="Search tests, quizzes..."
                  className="bg-transparent outline-none w-full text-slate-800 dark:text-slate-200 placeholder:text-slate-400 text-xs"
                />
              </div>
            </div>

            {/* List */}
            <div className="p-3 overflow-y-auto space-y-2 flex-1">
              {loadingTests ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <Loader2 size={24} className="animate-spin text-rose-500" />
                  <p className="text-xs font-semibold">Loading tests...</p>
                </div>
              ) : testsList.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs space-y-3">
                  <p>No tests created yet.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setShowTestsModal(false);
                      sendMessage("📝 **[Test] Computer Fundamentals Practice Quiz**\nDuration: 30 mins | Marks: 50\nAttempt Test: /tests");
                    }}
                    className="px-4 py-2 bg-rose-500 text-white rounded-xl text-xs font-bold hover:bg-rose-600 transition-all shadow-sm"
                  >
                    Send Practice Quiz Card
                  </button>
                </div>
              ) : (
                testsList
                  .filter(t => !testSearch || t.title.toLowerCase().includes(testSearch.toLowerCase()))
                  .map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => sendTestItem(item)}
                      className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-rose-400 dark:hover:border-rose-500 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 text-left transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          <Award size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-rose-600 transition-colors">
                            {item.title}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {item.courses?.title || (item.total_marks ? `Marks: ${item.total_marks}` : "Online Test")}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black text-rose-600 bg-rose-100 dark:bg-rose-950/60 px-2 py-1 rounded-lg shrink-0">
                        Send →
                      </span>
                    </button>
                  ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

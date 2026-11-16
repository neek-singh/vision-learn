"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { saveOfflineData, OFFLINE_KEYS } from "@/lib/offline-store";
import { 
  Home, 
  ChevronRight, 
  User, 
  UserCheck,
  Camera, 
  Calendar as CalendarIcon, 
  ChevronDown, 
  FileText, 
  Plus, 
  X, 
  ShieldCheck, 
  CheckCircle2, 
  Lock, 
  Download, 
  Check, 
  AlertCircle,
  Bell, 
  Globe, 
  SlidersHorizontal, 
  KeyRound,
  Phone,
  Mail,
  GraduationCap
} from "lucide-react";

const settingsNavItems = [
  { id: "profile", label: "Profile", icon: User },
  { id: "account", label: "Account", icon: UserCheck },
  { id: "preferences", label: "Preferences", icon: SlidersHorizontal },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Privacy & Security", icon: ShieldCheck },
  { id: "connected", label: "Connected Accounts", icon: Globe },
];

interface SettingsClientProps {
  student: any;
  enrollments?: any[];
  course?: any;
}

export default function SettingsClient({ student, enrollments = [], course }: SettingsClientProps) {
  // Active Tab state
  const [activeTab, setActiveTab] = useState<string>("profile");

  const isUnadmitted = Boolean(
    student?.is_unadmitted ||
    student?.admission_status === "unadmitted" ||
    student?.admission_status === "pending" ||
    student?.status === "unadmitted" ||
    student?.status === "pending" ||
    enrollments.length === 0
  );

  const formatForDateInput = (val?: string | null): string => {
    if (!val) return "";
    try {
      const parsed = new Date(val);
      if (!isNaN(parsed.getTime())) {
        const year = parsed.getFullYear();
        const month = String(parsed.getMonth() + 1).padStart(2, "0");
        const day = String(parsed.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      }
    } catch {}
    return "";
  };

  // Form states with actual student data
  const [name, setName] = useState(student?.name || "");
  const studentId = student?.student_id || "";
  const [email, setEmail] = useState(student?.email || "");
  const [phone, setPhone] = useState(student?.phone || "");
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [dob, setDob] = useState(formatForDateInput(student?.dob));
  const dateInputRef = React.useRef<HTMLInputElement>(null);
  const [gender, setGender] = useState(
    student?.gender
      ? (student.gender.charAt(0).toUpperCase() + student.gender.slice(1).toLowerCase())
      : "Not Specified"
  );

  const resolveInitialClass = () => {
    const val = student?.education || student?.qualification || student?.course || "";
    if (val === "College Student") return "Graduation / UG";
    if (val === "Working Professional") return "Professional";
    return val;
  };

  const [studentClass, setStudentClass] = useState(resolveInitialClass());
  const [batch] = useState(
    student?.batch || enrollments[0]?.batch || ""
  );

  // Bio & Interests state
  const [bio, setBio] = useState(student?.bio || "");
  const [interests, setInterests] = useState<string[]>(
    student?.interests && Array.isArray(student.interests) && student.interests.length > 0
      ? student.interests
      : student?.category
      ? [student.category]
      : ["Computer Basics", "AI"]
  );
  const [newInterestInput, setNewInterestInput] = useState("");
  const [showInterestInput, setShowInterestInput] = useState(false);

  // Learning Preferences
  const [language, setLanguage] = useState("English");
  const [theme, setTheme] = useState("Light");
  const [contentNotifications, setContentNotifications] = useState(true);
  const [emailUpdates, setEmailUpdates] = useState(true);

  const applyTheme = (t: string) => {
    if (typeof window === "undefined") return;
    if (t === "Dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.style.colorScheme = "dark";
    } else if (t === "Light") {
      document.documentElement.classList.remove("dark");
      document.documentElement.style.colorScheme = "light";
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) {
        document.documentElement.classList.add("dark");
        document.documentElement.style.colorScheme = "dark";
      } else {
        document.documentElement.classList.remove("dark");
        document.documentElement.style.colorScheme = "light";
      }
    }
    window.dispatchEvent(new CustomEvent("vision_theme_change", { detail: { theme: t } }));
  };

  // Load preferences from localStorage if available
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedLang = localStorage.getItem("vision_pref_lang");
      if (savedLang) setLanguage(savedLang);
      const savedTheme = localStorage.getItem("vision_pref_theme");
      if (savedTheme) {
        setTheme(savedTheme);
        applyTheme(savedTheme);
      }
      const savedContentNotif = localStorage.getItem("vision_pref_content_notif");
      if (savedContentNotif !== null) setContentNotifications(savedContentNotif === "true");
      const savedEmailUpdates = localStorage.getItem("vision_pref_email_updates");
      if (savedEmailUpdates !== null) setEmailUpdates(savedEmailUpdates === "true");
    }
  }, []);

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    if (typeof window !== "undefined") {
      localStorage.setItem("vision_pref_lang", newLang);
    }
    setToastMessage(`Language set to ${newLang}`);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    if (typeof window !== "undefined") {
      localStorage.setItem("vision_pref_theme", newTheme);
      applyTheme(newTheme);
    }
    setToastMessage(`Theme switched to ${newTheme}`);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleToggleContentNotif = () => {
    const next = !contentNotifications;
    setContentNotifications(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("vision_pref_content_notif", String(next));
    }
    setToastMessage(`Content notifications ${next ? "enabled" : "disabled"}`);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleToggleEmailUpdates = () => {
    const next = !emailUpdates;
    setEmailUpdates(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("vision_pref_email_updates", String(next));
    }
    setToastMessage(`Email updates ${next ? "enabled" : "disabled"}`);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  // Save changes toast state
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [toastMessage, setToastMessage] = useState("Settings updated successfully!");
  const [isSaving, setIsSaving] = useState(false);

  // Password Modal State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordState, setPasswordState] = useState({ current: "", newPass: "", confirm: "" });
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Avatar Photo handling
  const [avatarPreview, setAvatarPreview] = useState<string | null>(student?.photo_url || null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("File size exceeds 2MB limit. Please choose a smaller file.");
        return;
      }
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        setAvatarPreview(base64);
        try {
          const res = await fetch("/api/auth/profile", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ photo_url: base64 })
          });
          if (res.ok) {
            const data = await res.json();
            if (data.student) {
              saveOfflineData(OFFLINE_KEYS.PROFILE, data.student);
            }
            setToastMessage("Profile photo updated!");
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 2500);
          }
        } catch (err) {
          console.warn("Avatar upload error:", err);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveInterest = (tag: string) => {
    setInterests(prev => prev.filter(t => t !== tag));
  };

  const handleAddInterest = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newInterestInput.trim();
    if (trimmed && !interests.includes(trimmed)) {
      setInterests(prev => [...prev, trimmed]);
      setNewInterestInput("");
      setShowInterestInput(false);
    }
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim() || null,
          phone: phone.trim() || null,
          gender: gender === "Not Specified" ? null : gender,
          dob: dob.trim() || null,
          bio: bio.trim() || null,
          interests,
          course: studentClass || null,
          education: studentClass || null,
          qualification: studentClass || null
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.student) {
          saveOfflineData(OFFLINE_KEYS.PROFILE, data.student);
        }
        setToastMessage("Profile settings saved successfully!");
        setSaveSuccess(true);
        setIsEditingPhone(false);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Failed to save profile");
      }
    } catch (e) {
      console.error("Save profile error:", e);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");

    if (passwordState.newPass !== passwordState.confirm) {
      setPasswordError("New passwords do not match");
      return;
    }

    if (passwordState.newPass.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const res = await fetch("/api/auth/profile/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordState.current,
          newPassword: passwordState.newPass
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setPasswordError(data.error || "Failed to update password");
        return;
      }

      setPasswordSuccess(true);
      setPasswordState({ current: "", newPass: "", confirm: "" });
    } catch (err) {
      setPasswordError("Network error. Please try again.");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleDownloadData = () => {
    const data = {
      profile: {
        name,
        studentId,
        email: email || "Not Provided",
        phone: phone || "Not Provided",
        dob: dob || "Not Provided",
        gender,
        course: studentClass || "Not Selected",
        class: studentClass || "Not Selected",
        batch,
        bio: bio || "None",
        interests
      },
      accountStatus: {
        isAdmitted: !isUnadmitted,
        enrolledCoursesCount: enrollments.length,
        status: student?.status || "Active"
      },
      preferences: {
        language,
        theme,
        contentNotifications,
        emailUpdates
      },
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vision_learn_profile_${studentId || "student"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Student initials calculation
  const initials = name
    ? name.trim().split(/\s+/).map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()
    : "ST";

  return (
    <div className="space-y-3.5 sm:space-y-4 animate-in fade-in duration-300 pb-16">
      {/* 1. Breadcrumb navigation */}
      <nav className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-400">
        <Link href="/dashboard" className="text-slate-400 hover:text-blue-600 transition-colors flex items-center gap-1">
          <Home size={13} />
          <span>Dashboard</span>
        </Link>
        <ChevronRight size={11} className="text-slate-300" />
        <span className="text-slate-700 font-semibold">Settings</span>
      </nav>

      {/* Save Success Banner */}
      {saveSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-top-2 duration-200">
          <Check size={16} className="text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Settings Layout */}
      <div className="flex flex-col lg:flex-row gap-3.5 sm:gap-5 items-start">
        {/* Navigation Menu */}
        <aside className="w-full lg:w-56 shrink-0 bg-white rounded-2xl border border-slate-200/80 p-1.5 sm:p-2.5 shadow-2xs flex flex-row overflow-x-auto scrollbar-hide lg:flex-col gap-1 sm:gap-1.5 sticky top-2 z-10 lg:static">
          {settingsNavItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`min-h-[38px] px-3 py-1.5 lg:py-2.5 lg:px-3.5 rounded-xl font-semibold text-xs sm:text-sm transition-all duration-150 text-left shrink-0 whitespace-nowrap lg:w-full flex items-center gap-2 touch-manipulation active:scale-95 cursor-pointer ${
                  isActive
                    ? "bg-blue-50 text-blue-700 border border-blue-200/60 font-bold shadow-2xs"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent"
                }`}
              >
                <Icon size={16} className={isActive ? "text-blue-600 stroke-[2.2] shrink-0" : "text-slate-400 shrink-0"} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </aside>

        {/* Settings Content Area */}
        <div className="flex-1 min-w-0 w-full">
          {/* TAB 1: PROFILE */}
          {activeTab === "profile" && (
            <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-200">
              <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 shadow-2xs space-y-4 sm:space-y-5">
                {/* Header */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                    <User size={17} />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-none">
                      Profile Information
                    </h3>
                    <p className="hidden sm:block text-xs text-slate-500 font-normal mt-1">
                      Update your personal information used across the platform.
                    </p>
                  </div>
                </div>

                {/* Avatar Section */}
                <div className="flex items-center gap-3.5 sm:gap-4 pt-1">
                  <div className="relative shrink-0">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg sm:text-xl overflow-hidden shadow-2xs border-2 border-white">
                      {avatarPreview ? (
                        <img src={avatarPreview} alt={name} className="w-full h-full object-cover" />
                      ) : (
                        <span>{initials}</span>
                      )}
                    </div>
                    <label 
                      htmlFor="avatar-upload"
                      className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-blue-600 hover:bg-blue-700 text-white border-2 border-white flex items-center justify-center cursor-pointer shadow-xs transition-colors touch-manipulation"
                      title="Change avatar photo"
                    >
                      <Camera size={12} />
                    </label>
                    <input 
                      type="file" 
                      id="avatar-upload" 
                      accept="image/png, image/jpeg" 
                      className="hidden" 
                      onChange={handlePhotoUpload} 
                    />
                  </div>

                  <div>
                    <label 
                      htmlFor="avatar-upload"
                      className="inline-flex items-center justify-center min-h-[36px] px-3.5 py-1.5 border border-blue-500 text-blue-600 hover:bg-blue-50 rounded-xl text-xs font-semibold cursor-pointer transition-all shadow-2xs active:scale-95 touch-manipulation"
                    >
                      Change Photo
                    </label>
                    <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1">
                      JPG, PNG (Max 2MB)
                    </p>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 pt-1">
                  {/* Full Name */}
                  <div className="space-y-1 sm:space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 block">
                      Full Name
                    </label>
                    <input 
                      type="text" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)}
                      className="w-full min-h-[42px] px-3.5 py-2 sm:py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all touch-manipulation"
                      placeholder="Enter full name"
                    />
                  </div>

                  {/* Student ID (Readonly) */}
                  <div className="space-y-1 sm:space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 block">
                      Student ID
                    </label>
                    <input 
                      type="text" 
                      value={studentId} 
                      disabled
                      className="w-full min-h-[42px] px-3.5 py-2 sm:py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-600 cursor-not-allowed select-none font-mono"
                    />
                  </div>

                  {/* Email Address */}
                  <div className="space-y-1 sm:space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 block">
                      Email Address
                    </label>
                    <input 
                      type="email" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full min-h-[42px] px-3.5 py-2 sm:py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all touch-manipulation"
                      placeholder="Enter email address"
                    />
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-1 sm:space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 block">
                      Phone Number
                    </label>
                    <div className="relative flex items-center">
                      <input 
                        type="text" 
                        value={phone} 
                        onChange={(e) => setPhone(e.target.value)}
                        disabled={!isEditingPhone && Boolean(phone)}
                        className="w-full min-h-[42px] px-3.5 py-2 sm:py-2.5 pr-16 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:bg-slate-50 disabled:text-slate-600 touch-manipulation"
                        placeholder="Enter 10-digit mobile number"
                      />
                      <button
                        type="button"
                        onClick={() => setIsEditingPhone(!isEditingPhone)}
                        className="absolute right-1.5 min-h-[32px] px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200/80 touch-manipulation flex items-center justify-center cursor-pointer"
                      >
                        {isEditingPhone ? "Done" : !phone ? "Add" : "Edit"}
                      </button>
                    </div>
                  </div>

                  {/* Date of Birth */}
                  <div className="space-y-1 sm:space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 block">
                      Date of Birth
                    </label>
                    <div className="relative flex items-center">
                      <input 
                        ref={dateInputRef}
                        type="date" 
                        value={dob} 
                        onChange={(e) => setDob(e.target.value)}
                        onClick={() => {
                          try {
                            dateInputRef.current?.showPicker();
                          } catch {}
                        }}
                        max={new Date().toISOString().split("T")[0]}
                        className="w-full min-h-[42px] px-3.5 py-2 sm:py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all touch-manipulation cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Gender Select */}
                  <div className="space-y-1 sm:space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 block">
                      Gender
                    </label>
                    <div className="relative flex items-center">
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="w-full min-h-[42px] px-3.5 py-2 sm:py-2.5 pr-10 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer touch-manipulation"
                      >
                        <option value="Not Specified">Not Specified</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                      <ChevronDown size={15} className="absolute right-3 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Class */}
                  <div className={`space-y-1 sm:space-y-1.5 ${!isUnadmitted && batch ? "" : "sm:col-span-2"}`}>
                    <label className="text-xs font-semibold text-slate-700 block">
                      Class
                    </label>
                    <div className="relative flex items-center">
                      <select
                        value={studentClass}
                        onChange={(e) => setStudentClass(e.target.value)}
                        className="w-full min-h-[42px] px-3.5 py-2 sm:py-2.5 pr-10 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer touch-manipulation"
                      >
                        <option value="">Select Class</option>
                        <option value="Class 6th">Class 6th</option>
                        <option value="Class 7th">Class 7th</option>
                        <option value="Class 8th">Class 8th</option>
                        <option value="Class 9th">Class 9th</option>
                        <option value="Class 10th">Class 10th</option>
                        <option value="Class 11th">Class 11th</option>
                        <option value="Class 12th">Class 12th</option>
                        <option value="Graduation / UG">Graduation / UG</option>
                        <option value="Post Graduation (PG)">Post Graduation (PG)</option>
                        <option value="Professional">Professional</option>
                        <option value="Other">Other</option>
                      </select>
                      <ChevronDown size={15} className="absolute right-3 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Batch - only shown when an active batch is allocated */}
                  {!isUnadmitted && batch && (
                    <div className="space-y-1 sm:space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 block">
                        Batch
                      </label>
                      <input 
                        type="text" 
                        value={batch} 
                        disabled
                        className="w-full min-h-[42px] px-3.5 py-2 sm:py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-600 cursor-not-allowed select-none"
                      />
                    </div>
                  )}
                </div>

                {/* Save Changes Button */}
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleSaveChanges}
                    disabled={isSaving}
                    className="w-full sm:w-auto px-6 py-2.5 min-h-[42px] bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 flex items-center justify-center gap-2 touch-manipulation cursor-pointer"
                  >
                    {isSaving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>

              {/* Card 2: About You */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 shadow-2xs space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                    <FileText size={17} />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-none">
                      About You
                    </h3>
                    <p className="hidden sm:block text-xs text-slate-500 font-normal mt-1">
                      Add a bio and select your areas of interest.
                    </p>
                  </div>
                </div>

                {/* Bio Field */}
                <div className="space-y-1 sm:space-y-1.5 pt-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Bio <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <textarea 
                    value={bio}
                    onChange={(e) => setBio(e.target.value.substring(0, 300))}
                    rows={3}
                    maxLength={300}
                    className="w-full min-h-[80px] px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none touch-manipulation"
                    placeholder="Short summary about your background and interests..."
                  />
                  <div className="text-right text-[10px] text-slate-400">
                    {bio.length}/300
                  </div>
                </div>

                {/* Interests Section */}
                <div className="space-y-2 pt-1 border-t border-slate-100">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Interests
                  </label>
                  
                  <div className="flex flex-wrap items-center gap-2">
                    {interests.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1.5 rounded-xl bg-blue-50/70 border border-blue-200/80 text-blue-700 text-xs font-medium inline-flex items-center gap-1.5"
                      >
                        <span>{tag}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveInterest(tag)}
                          aria-label={`Remove interest ${tag}`}
                          className="min-h-[20px] min-w-[20px] flex items-center justify-center text-blue-500 hover:text-blue-800 cursor-pointer touch-manipulation"
                        >
                          <X size={12} className="stroke-[2.5]" />
                        </button>
                      </span>
                    ))}

                    {showInterestInput ? (
                      <form onSubmit={handleAddInterest} className="inline-flex items-center gap-1.5">
                        <input 
                          type="text"
                          autoFocus
                          value={newInterestInput}
                          onChange={(e) => setNewInterestInput(e.target.value)}
                          placeholder="e.g. Next.js"
                          className="min-h-[36px] px-3 py-1 text-xs border border-blue-400 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 w-28 bg-white touch-manipulation"
                        />
                        <button 
                          type="submit" 
                          className="min-h-[36px] px-3 py-1 bg-blue-600 text-white rounded-xl text-xs font-semibold touch-manipulation cursor-pointer"
                        >
                          Add
                        </button>
                        <button 
                          type="button"
                          onClick={() => setShowInterestInput(false)}
                          className="min-h-[36px] min-w-[36px] flex items-center justify-center p-1 text-slate-400 hover:text-slate-600 touch-manipulation cursor-pointer"
                        >
                          <X size={14} />
                        </button>
                      </form>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowInterestInput(true)}
                        className="min-h-[34px] px-3 py-1.5 rounded-xl border border-dashed border-blue-400 text-blue-600 hover:bg-blue-50 text-xs font-semibold inline-flex items-center gap-1 transition-all shadow-2xs active:scale-95 touch-manipulation cursor-pointer"
                      >
                        <Plus size={13} className="stroke-[2.5]" />
                        <span>Add Interest</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ACCOUNT */}
          {activeTab === "account" && (
            <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-200">
              <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 shadow-2xs space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-none">
                      Account Status
                    </h3>
                    <p className="hidden sm:block text-xs text-slate-500 font-normal mt-1">
                      Your student account verification standing and course enrollment summary.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 sm:p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <span className="text-xs font-semibold text-slate-800">
                      Mobile Verified ({phone || studentId})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <span className="text-xs font-semibold text-slate-800">
                      Profile Active
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className={isUnadmitted ? "text-amber-500 shrink-0" : "text-emerald-600 shrink-0"} />
                    <span className="text-xs font-semibold text-slate-800">
                      {isUnadmitted ? "Admission Pending (0 Enrolled)" : `Enrolled in ${enrollments.length} Course(s)`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <span className="text-xs font-semibold text-slate-800">
                      Account Status: {student?.status || "Active"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Data Export Card */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 shadow-2xs space-y-3.5">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Download size={17} />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-none">
                      Export Learning Data
                    </h3>
                    <p className="hidden sm:block text-xs text-slate-500 font-normal mt-1">
                      Download a JSON archive of your personal learning profile.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadData}
                  className="w-full min-h-[46px] p-3 sm:p-3.5 rounded-xl border border-slate-200/80 hover:bg-slate-50/80 active:bg-slate-100 flex items-center justify-between transition-all touch-manipulation group cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <Download size={15} />
                    </div>
                    <div className="text-left min-w-0">
                      <p className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors truncate">
                        Download My Data (JSON)
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">
                        Export personal profile and course details
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-slate-400 group-hover:text-blue-600 transition-colors shrink-0" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: PREFERENCES */}
          {activeTab === "preferences" && (
            <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-200">
              <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 shadow-2xs space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                    <SlidersHorizontal size={17} />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-none">
                      Learning Preferences
                    </h3>
                    <p className="hidden sm:block text-xs text-slate-500 font-normal mt-1">
                      Customize your learning language and interface theme.
                    </p>
                  </div>
                </div>

                {/* Dropdowns row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-1">
                  {/* Language */}
                  <div className="space-y-1 sm:space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 block">
                      Language
                    </label>
                    <div className="relative flex items-center">
                      <select
                        value={language}
                        onChange={(e) => handleLanguageChange(e.target.value)}
                        className="w-full min-h-[42px] px-3.5 py-2 sm:py-2.5 pr-10 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none cursor-pointer touch-manipulation"
                      >
                        <option value="English">English</option>
                        <option value="Hindi">Hindi</option>
                      </select>
                      <ChevronDown size={14} className="absolute right-3 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Theme */}
                  <div className="space-y-1 sm:space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 block">
                      Theme
                    </label>
                    <div className="relative flex items-center">
                      <select
                        value={theme}
                        onChange={(e) => handleThemeChange(e.target.value)}
                        className="w-full min-h-[42px] px-3.5 py-2 sm:py-2.5 pr-10 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 appearance-none cursor-pointer touch-manipulation"
                      >
                        <option value="Light">Light</option>
                        <option value="Dark">Dark</option>
                        <option value="System">System</option>
                      </select>
                      <ChevronDown size={14} className="absolute right-3 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Toggles */}
                <div className="space-y-3.5 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between gap-3 min-h-[44px]">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-800">
                        Content Notifications
                      </p>
                      <p className="hidden sm:block text-[10px] text-slate-400 leading-tight mt-0.5">
                        Get notified about new lectures, materials, and batch updates
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleToggleContentNotif}
                      className={`w-11 h-6 rounded-full relative p-0.5 transition-colors cursor-pointer shrink-0 min-h-[26px] touch-manipulation ${
                        contentNotifications ? "bg-blue-600" : "bg-slate-300"
                      }`}
                      aria-label="Toggle content notifications"
                    >
                      <div 
                        className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform transform ${
                          contentNotifications ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-3 min-h-[44px]">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-800">
                        Email Updates
                      </p>
                      <p className="hidden sm:block text-[10px] text-slate-400 leading-tight mt-0.5">
                        Receive important announcements and fee notices via email
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleToggleEmailUpdates}
                      className={`w-11 h-6 rounded-full relative p-0.5 transition-colors cursor-pointer shrink-0 min-h-[26px] touch-manipulation ${
                        emailUpdates ? "bg-blue-600" : "bg-slate-300"
                      }`}
                      aria-label="Toggle email updates"
                    >
                      <div 
                        className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform transform ${
                          emailUpdates ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: NOTIFICATIONS */}
          {activeTab === "notifications" && (
            <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-200">
              <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 shadow-2xs space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Bell size={17} />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-none">
                      Notification Preferences
                    </h3>
                    <p className="hidden sm:block text-xs text-slate-500 font-normal mt-1">
                      Manage alerts for lectures, tests, and institute announcements.
                    </p>
                  </div>
                </div>

                <div className="space-y-3.5 pt-2">
                  <div className="flex items-center justify-between gap-3 min-h-[44px]">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-800">
                        In-App Content Alerts
                      </p>
                      <p className="hidden sm:block text-[10px] text-slate-400 leading-tight mt-0.5">
                        New lessons, test schedules, and assignment releases
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleToggleContentNotif}
                      className={`w-11 h-6 rounded-full relative p-0.5 transition-colors cursor-pointer shrink-0 min-h-[26px] touch-manipulation ${
                        contentNotifications ? "bg-blue-600" : "bg-slate-300"
                      }`}
                      aria-label="Toggle in-app alerts"
                    >
                      <div 
                        className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform transform ${
                          contentNotifications ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-3 min-h-[44px] pt-2 border-t border-slate-100">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-800">
                        Email Digests
                      </p>
                      <p className="hidden sm:block text-[10px] text-slate-400 leading-tight mt-0.5">
                        Weekly summary and administrative announcements
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleToggleEmailUpdates}
                      className={`w-11 h-6 rounded-full relative p-0.5 transition-colors cursor-pointer shrink-0 min-h-[26px] touch-manipulation ${
                        emailUpdates ? "bg-blue-600" : "bg-slate-300"
                      }`}
                      aria-label="Toggle email digests"
                    >
                      <div 
                        className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform transform ${
                          emailUpdates ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <Link
                    href="/notifications"
                    className="w-full min-h-[46px] p-3 rounded-xl bg-blue-50/70 border border-blue-200/70 hover:bg-blue-100/70 flex items-center justify-between text-blue-900 transition-all touch-manipulation"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                        <Bell size={15} />
                      </div>
                      <div className="text-left min-w-0">
                        <p className="text-xs font-bold text-blue-950 truncate">
                          Open Notification Inbox
                        </p>
                        <p className="text-[10px] text-blue-700/80 truncate">
                          View all official messages and updates
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={15} className="text-blue-600 shrink-0" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: PRIVACY & SECURITY */}
          {activeTab === "security" && (
            <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-200">
              <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 shadow-2xs space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-none">
                      Privacy & Security
                    </h3>
                    <p className="hidden sm:block text-xs text-slate-500 font-normal mt-1">
                      Manage your password credentials and account security.
                    </p>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setPasswordError("");
                      setPasswordSuccess(false);
                      setShowPasswordModal(true);
                    }}
                    className="w-full min-h-[46px] p-3 sm:p-3.5 rounded-xl border border-slate-200/80 hover:bg-slate-50/80 active:bg-slate-100 flex items-center justify-between transition-all touch-manipulation group cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <Lock size={15} />
                      </div>
                      <div className="text-left min-w-0">
                        <p className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors truncate">
                          Change Password
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">
                          Update your student account login password
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-slate-400 group-hover:text-blue-600 transition-colors shrink-0" />
                  </button>
                </div>

                <div className="bg-slate-50 rounded-xl p-3 sm:p-4 space-y-2 border border-slate-200/60 mt-3">
                  <h4 className="text-xs font-bold text-slate-800">Security Safeguards</h4>
                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                      <span>Encrypted Session Authentication</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                      <span>Protected Student Data Isolation</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: CONNECTED ACCOUNTS */}
          {activeTab === "connected" && (
            <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-200">
              <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 shadow-2xs space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Globe size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-none">
                      Connected Accounts & Identity
                    </h3>
                    <p className="hidden sm:block text-xs text-slate-500 font-normal mt-1">
                      Identity and verified credentials linked to your learning profile.
                    </p>
                  </div>
                </div>

                <div className="divide-y divide-slate-100">
                  <div className="py-3 flex items-center justify-between gap-3 min-h-[48px]">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800">Vision Student ID</p>
                      <p className="text-xs text-slate-500 font-mono">{studentId}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 shrink-0">
                      Primary
                    </span>
                  </div>

                  <div className="py-3 flex items-center justify-between gap-3 min-h-[48px]">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800">Mobile Number</p>
                      <p className="text-xs text-slate-500">{phone || "Not Added"}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60 shrink-0">
                      {phone ? "Verified" : "Pending"}
                    </span>
                  </div>

                  <div className="py-3 flex items-center justify-between gap-3 min-h-[48px]">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800">Email Address</p>
                      <p className="text-xs text-slate-500">{email || "Not Provided"}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 shrink-0">
                      {email ? "Linked" : "Optional"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-4 sm:p-6 space-y-4 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <KeyRound size={17} />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Change Password</h3>
              </div>
              <button 
                onClick={() => { setShowPasswordModal(false); setPasswordSuccess(false); setPasswordError(""); }}
                className="min-h-[36px] min-w-[36px] flex items-center justify-center text-slate-400 hover:text-slate-600 p-1 rounded-lg touch-manipulation cursor-pointer"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {passwordSuccess ? (
              <div className="py-6 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <Check size={24} />
                </div>
                <h4 className="text-sm font-bold text-slate-900">Password Updated</h4>
                <p className="text-xs text-slate-500">Your account password has been changed successfully.</p>
                <button
                  onClick={() => { setShowPasswordModal(false); setPasswordSuccess(false); }}
                  className="mt-3 min-h-[40px] px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold touch-manipulation cursor-pointer"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handlePasswordSubmit} className="space-y-3">
                {passwordError && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-xl text-xs flex items-center gap-2 font-medium">
                    <AlertCircle size={15} className="shrink-0" />
                    <span>{passwordError}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Current Password</label>
                  <input 
                    type="password" 
                    required
                    value={passwordState.current}
                    onChange={(e) => setPasswordState(prev => ({ ...prev, current: e.target.value }))}
                    className="w-full min-h-[42px] px-3.5 py-2 sm:py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none touch-manipulation"
                    placeholder="Enter current password"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">New Password</label>
                  <input 
                    type="password" 
                    required
                    value={passwordState.newPass}
                    onChange={(e) => setPasswordState(prev => ({ ...prev, newPass: e.target.value }))}
                    className="w-full min-h-[42px] px-3.5 py-2 sm:py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none touch-manipulation"
                    placeholder="At least 6 characters"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Confirm New Password</label>
                  <input 
                    type="password" 
                    required
                    value={passwordState.confirm}
                    onChange={(e) => setPasswordState(prev => ({ ...prev, confirm: e.target.value }))}
                    className="w-full min-h-[42px] px-3.5 py-2 sm:py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none touch-manipulation"
                    placeholder="Repeat new password"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="min-h-[40px] px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 touch-manipulation cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatingPassword}
                    className="min-h-[40px] px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-xs font-semibold transition-all shadow-xs touch-manipulation cursor-pointer"
                  >
                    {isUpdatingPassword ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

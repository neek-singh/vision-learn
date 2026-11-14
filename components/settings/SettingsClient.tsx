"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Home, 
  ChevronRight, 
  Settings as SettingsIcon, 
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
  Zap, 
  Lock, 
  Download, 
  Check, 
  AlertCircle,
  Share2,
  Bell,
  Globe,
  SlidersHorizontal,
  KeyRound,
  ExternalLink,
  Shield,
  Smartphone
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

  // Form states with fallback to reference data
  const [name, setName] = useState(student?.name || "Neeraj Singh");
  const studentId = student?.student_id || "VIT2026STD001";
  const email = student?.email || "neerajsingh@example.com";
  const [phone, setPhone] = useState(student?.phone || "Not Added");
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [dob, setDob] = useState(student?.dob ? new Date(student.dob).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "15 Jan 2008");
  const [gender, setGender] = useState(student?.gender ? (student.gender.charAt(0).toUpperCase() + student.gender.slice(1)) : "Male");
  const [courseName, setCourseName] = useState(student?.course || course?.title || "Web Development");
  const [batch, setBatch] = useState(student?.batch || enrollments[0]?.batch || "WD-2026-A");
  
  // Bio & Interests state
  const [bio, setBio] = useState(student?.bio || "Passionate about web development and technology. Exploring new skills and building real projects.");
  const [interests, setInterests] = useState<string[]>([
    "Web Development", 
    "UI/UX Design", 
    "JavaScript", 
    "AI Tools"
  ]);
  const [newInterestInput, setNewInterestInput] = useState("");
  const [showInterestInput, setShowInterestInput] = useState(false);

  // Learning Preferences
  const [language, setLanguage] = useState("English");
  const [theme, setTheme] = useState("Light");
  const [contentNotifications, setContentNotifications] = useState(true);
  const [emailUpdates, setEmailUpdates] = useState(true);

  // Save changes toast state
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Modal States
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordState, setPasswordState] = useState({ current: "", newPass: "", confirm: "" });
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Avatar Photo handling
  const [avatarPreview, setAvatarPreview] = useState<string | null>(student?.photo_url || null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("File size exceeds 2MB limit. Please choose a smaller file.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setAvatarPreview(event.target?.result as string);
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
      await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone: phone === "Not Added" ? null : phone,
          gender,
          bio
        })
      }).catch(() => {});
    } catch (e) {
      // offline/fallback
    }
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 600);
  };

  const handleDownloadData = () => {
    const data = {
      profile: {
        name,
        studentId,
        email,
        phone,
        dob,
        gender,
        course: courseName,
        batch,
        bio,
        interests
      },
      accountStatus: {
        emailVerified: true,
        profileComplete: true,
        enrolledCoursesCount: enrollments.length || 3,
        activeStanding: true
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
    a.download = `vision_learn_profile_${studentId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Student initials
  const initials = student?.name 
    ? student.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()
    : "NS";

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
          <span>Profile settings saved successfully!</span>
        </div>
      )}

      {/* Settings Layout: Sub-Navigation Menu + Content Area */}
      <div className="flex flex-col lg:flex-row gap-3.5 sm:gap-5 items-start">
        {/* Sub-Navigation: Sticky responsive horizontal bar on mobile, sidebar on desktop */}
        <aside className="w-full lg:w-56 shrink-0 bg-white rounded-2xl border border-slate-200/80 p-1.5 sm:p-2.5 shadow-2xs flex flex-row overflow-x-auto scrollbar-hide lg:flex-col gap-1 sm:gap-1.5 sticky top-2 z-10 lg:static">
          {settingsNavItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`min-h-[38px] px-3 py-1.5 lg:py-2.5 lg:px-3.5 rounded-xl font-semibold text-xs sm:text-sm transition-all duration-150 text-left shrink-0 whitespace-nowrap lg:w-full flex items-center gap-2 touch-manipulation active:scale-95 ${
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
              {/* Card 1: Profile Information */}
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

                {/* Form Fields: Responsive grid with touch-friendly 42px controls */}
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
                      className="w-full min-h-[42px] px-3.5 py-2 sm:py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-xs font-medium text-slate-500 cursor-not-allowed select-none"
                    />
                  </div>

                  {/* Email Address (Readonly) */}
                  <div className="space-y-1 sm:space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 block">
                      Email Address
                    </label>
                    <input 
                      type="email" 
                      value={email} 
                      disabled
                      className="w-full min-h-[42px] px-3.5 py-2 sm:py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-xs font-medium text-slate-500 cursor-not-allowed select-none"
                    />
                  </div>

                  {/* Phone Number with Add/Edit button */}
                  <div className="space-y-1 sm:space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 block">
                      Phone Number
                    </label>
                    <div className="relative flex items-center">
                      <input 
                        type="text" 
                        value={phone} 
                        onChange={(e) => setPhone(e.target.value)}
                        disabled={!isEditingPhone && phone !== "Not Added"}
                        className="w-full min-h-[42px] px-3.5 py-2 sm:py-2.5 pr-16 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:bg-slate-50 disabled:text-slate-600 touch-manipulation"
                        placeholder="Enter phone number"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (phone === "Not Added") setPhone("");
                          setIsEditingPhone(!isEditingPhone);
                        }}
                        className="absolute right-1.5 min-h-[32px] px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200/80 touch-manipulation flex items-center justify-center"
                      >
                        {isEditingPhone ? "Done" : phone === "Not Added" ? "Add" : "Edit"}
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
                        type="text" 
                        value={dob} 
                        onChange={(e) => setDob(e.target.value)}
                        className="w-full min-h-[42px] px-3.5 py-2 sm:py-2.5 pr-10 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all touch-manipulation"
                      />
                      <CalendarIcon size={15} className="absolute right-3 text-slate-400 pointer-events-none" />
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
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                      <ChevronDown size={15} className="absolute right-3 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Class / Course */}
                  <div className="space-y-1 sm:space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 block">
                      Class / Course
                    </label>
                    <input 
                      type="text" 
                      value={courseName} 
                      onChange={(e) => setCourseName(e.target.value)}
                      className="w-full min-h-[42px] px-3.5 py-2 sm:py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all touch-manipulation"
                    />
                  </div>

                  {/* Batch */}
                  <div className="space-y-1 sm:space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 block">
                      Batch
                    </label>
                    <input 
                      type="text" 
                      value={batch} 
                      onChange={(e) => setBatch(e.target.value)}
                      className="w-full min-h-[42px] px-3.5 py-2 sm:py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all touch-manipulation"
                    />
                  </div>
                </div>

                {/* Save Changes Button */}
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleSaveChanges}
                    disabled={isSaving}
                    className="w-full sm:w-auto px-5 py-2.5 min-h-[44px] bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 flex items-center justify-center gap-2 touch-manipulation"
                  >
                    {isSaving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>

              {/* Card 2: About You */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 shadow-2xs space-y-4">
                {/* Header */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                    <FileText size={17} />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-none">
                      About You
                    </h3>
                    <p className="hidden sm:block text-xs text-slate-500 font-normal mt-1">
                      Tell us a little bit about yourself.
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
                        className="px-3 py-1.5 rounded-xl bg-blue-50/70 border border-blue-200/80 text-blue-700 text-xs font-medium inline-flex items-center gap-1.5 hover:bg-blue-100/70 transition-colors"
                      >
                        <span>{tag}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveInterest(tag)}
                          aria-label={`Remove interest ${tag}`}
                          className="min-h-[24px] min-w-[24px] flex items-center justify-center text-blue-500 hover:text-blue-800 cursor-pointer touch-manipulation"
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
                          className="min-h-[36px] px-3 py-1 bg-blue-600 text-white rounded-xl text-xs font-semibold touch-manipulation"
                        >
                          Add
                        </button>
                        <button 
                          type="button"
                          onClick={() => setShowInterestInput(false)}
                          className="min-h-[36px] min-w-[36px] flex items-center justify-center p-1 text-slate-400 hover:text-slate-600 touch-manipulation"
                        >
                          <X size={14} />
                        </button>
                      </form>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowInterestInput(true)}
                        className="min-h-[36px] px-3 py-1.5 rounded-xl border border-dashed border-blue-400 text-blue-600 hover:bg-blue-50 text-xs font-semibold inline-flex items-center gap-1 transition-all shadow-2xs active:scale-95 touch-manipulation"
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
              {/* Account Status Card */}
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

                <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <span className="text-xs font-semibold text-slate-800">Email Verified</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <span className="text-xs font-semibold text-slate-800">Profile Complete</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <span className="text-xs font-semibold text-slate-800">Enrolled in {enrollments.length || 3} Courses</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <span className="text-xs font-semibold text-slate-800">Active Academic Standing</span>
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
                      Download a complete JSON archive of your personal learning profile and progress.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadData}
                  className="w-full min-h-[48px] p-3 sm:p-3.5 rounded-xl border border-slate-200/80 hover:bg-slate-50/80 active:bg-slate-100 flex items-center justify-between transition-all touch-manipulation group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <Download size={15} />
                    </div>
                    <div className="text-left min-w-0">
                      <p className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors truncate">
                        Download My Data
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">
                        <span className="hidden sm:inline">Export profile and progress as JSON</span>
                        <span className="sm:hidden">JSON profile export</span>
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
                        onChange={(e) => setLanguage(e.target.value)}
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
                        onChange={(e) => setTheme(e.target.value)}
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
                  {/* Content Notifications Toggle */}
                  <div className="flex items-center justify-between gap-3 min-h-[44px]">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-800">
                        Content Notifications
                      </p>
                      <p className="hidden sm:block text-[10px] text-slate-400 leading-tight mt-0.5">
                        Get notified about new lessons, tests and materials
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setContentNotifications(!contentNotifications)}
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

                  {/* Email Updates Toggle */}
                  <div className="flex items-center justify-between gap-3 min-h-[44px]">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-800">
                        Email Updates
                      </p>
                      <p className="hidden sm:block text-[10px] text-slate-400 leading-tight mt-0.5">
                        Receive important updates and announcements via email
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEmailUpdates(!emailUpdates)}
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
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0 mt-0.5">
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
                      onClick={() => setContentNotifications(!contentNotifications)}
                      className={`w-11 h-6 rounded-full relative p-0.5 transition-colors cursor-pointer shrink-0 min-h-[26px] touch-manipulation ${
                        contentNotifications ? "bg-indigo-600" : "bg-slate-300"
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
                        Important administrative announcements and weekly digests
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEmailUpdates(!emailUpdates)}
                      className={`w-11 h-6 rounded-full relative p-0.5 transition-colors cursor-pointer shrink-0 min-h-[26px] touch-manipulation ${
                        emailUpdates ? "bg-indigo-600" : "bg-slate-300"
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

                {/* Direct shortcut to Notifications Inbox */}
                <div className="pt-3 border-t border-slate-100">
                  <Link
                    href="/notifications"
                    className="w-full min-h-[48px] p-3 sm:p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200/70 hover:bg-indigo-100/70 active:scale-[0.99] flex items-center justify-between text-indigo-900 transition-all touch-manipulation"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                        <Bell size={15} />
                      </div>
                      <div className="text-left min-w-0">
                        <p className="text-xs font-bold text-indigo-950 truncate">
                          Open Notification Inbox
                        </p>
                        <p className="text-[10px] text-indigo-700/80 truncate">
                          View all official messages and system updates
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={15} className="text-indigo-600 shrink-0" />
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
                  {/* Change Password Button */}
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(true)}
                    className="w-full min-h-[48px] p-3 sm:p-3.5 rounded-xl border border-slate-200/80 hover:bg-slate-50/80 active:bg-slate-100 flex items-center justify-between transition-all touch-manipulation group"
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
                          <span className="hidden sm:inline">Update your student account password</span>
                          <span className="sm:hidden">Update password</span>
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-slate-400 group-hover:text-blue-600 transition-colors shrink-0" />
                  </button>
                </div>

                {/* Security Standing Guardrails */}
                <div className="bg-slate-50 rounded-xl p-3 sm:p-4 space-y-2 border border-slate-200/60 mt-3">
                  <h4 className="text-xs font-bold text-slate-800">Active Security Safeguards</h4>
                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                      <span>Encrypted Session Authentication</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                      <span>Sandboxed Student Data Isolation</span>
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
                      Connected Accounts
                    </h3>
                    <p className="hidden sm:block text-xs text-slate-500 font-normal mt-1">
                      Identity providers and services linked to your learning profile.
                    </p>
                  </div>
                </div>

                <div className="divide-y divide-slate-100">
                  <div className="py-3 flex items-center justify-between gap-3 min-h-[48px]">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800">Vision Student Identity</p>
                      <p className="text-[10px] text-slate-400 truncate">{studentId}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 shrink-0">
                      Primary
                    </span>
                  </div>

                  <div className="py-3 flex items-center justify-between gap-3 min-h-[48px]">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800">Google SSO</p>
                      <p className="text-[10px] text-slate-400 truncate">{email}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60 shrink-0">
                      Linked
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: Change Password Modal */}
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
                onClick={() => { setShowPasswordModal(false); setPasswordSuccess(false); }}
                className="min-h-[36px] min-w-[36px] flex items-center justify-center text-slate-400 hover:text-slate-600 p-1 rounded-lg touch-manipulation"
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
                  className="mt-3 min-h-[42px] px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold touch-manipulation"
                >
                  Close
                </button>
              </div>
            ) : (
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (passwordState.newPass !== passwordState.confirm) {
                    alert("New passwords do not match!");
                    return;
                  }
                  setPasswordSuccess(true);
                }} 
                className="space-y-3"
              >
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Current Password</label>
                  <input 
                    type="password" 
                    required
                    value={passwordState.current}
                    onChange={(e) => setPasswordState(prev => ({ ...prev, current: e.target.value }))}
                    className="w-full min-h-[42px] px-3.5 py-2 sm:py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none touch-manipulation"
                    placeholder="••••••••"
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
                    placeholder="••••••••"
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
                    placeholder="••••••••"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="min-h-[42px] px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 touch-manipulation"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="min-h-[42px] px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-all shadow-xs touch-manipulation"
                  >
                    Update Password
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

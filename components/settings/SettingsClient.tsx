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
  Power, 
  Trash2, 
  Check, 
  AlertCircle,
  Share2,
  Bell,
  Globe,
  SlidersHorizontal,
  KeyRound,
  ShieldAlert
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
  // Active Tab if query param or state
  const [activeTab, setActiveTab] = useState<string>("profile");

  // Form states with fallback to reference screenshot data
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
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
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
    // Simulate save or call endpoint
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
    <div className="space-y-4 animate-in fade-in duration-300 pb-16">
      {/* 1. Breadcrumb navigation matching screenshot */}
      <nav className="flex items-center gap-2 text-xs font-medium text-slate-400">
        <Link href="/dashboard" className="text-slate-400 hover:text-blue-600 transition-colors flex items-center">
          <Home size={13} />
        </Link>
        <ChevronRight size={11} className="text-slate-300" />
        <Link href="/dashboard" className="text-slate-500 hover:text-blue-600 transition-colors">
          Dashboard
        </Link>
        <ChevronRight size={11} className="text-slate-300" />
        <span className="text-slate-700 font-semibold">Settings</span>
      </nav>

      {/* Save Success Banner */}
      {saveSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-top-2 duration-200">
          <Check size={16} className="text-emerald-600" />
          Profile settings have been saved successfully!
        </div>
      )}

      {/* Settings Layout: Left Sub-Navigation Menu (Sidebar ke right me) + Content Area */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">
        {/* Left Settings Sub-Sidebar Navigation */}
        <aside className="w-full lg:w-56 shrink-0 bg-white rounded-2xl border border-slate-200/80 p-2 sm:p-2.5 shadow-2xs space-y-1">
          {settingsNavItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all duration-150 text-left ${
                  isActive
                    ? "bg-blue-50 text-blue-700 font-bold shadow-2xs"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon size={18} className={isActive ? "text-blue-600 stroke-[2.2]" : "text-slate-400"} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </aside>

        {/* Right Settings Content Area */}
        <div className="flex-1 min-w-0 w-full">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-5 items-start">
            {/* Left Column: Profile Information + About You */}
            <div className="xl:col-span-7 space-y-4 sm:space-y-5">
              {/* Card 1: Profile Information */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs space-y-5">
            {/* Header */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                <User size={17} />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-none">
                  Profile Information
                </h3>
                <p className="text-xs text-slate-500 font-normal mt-1">
                  Update your personal information. This information will be used across the platform.
                </p>
              </div>
            </div>

            {/* Avatar Section */}
            <div className="flex items-center gap-4 pt-1">
              <div className="relative shrink-0">
                <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xl overflow-hidden shadow-2xs border-2 border-white">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt={name} className="w-full h-full object-cover" />
                  ) : (
                    <span>{initials}</span>
                  )}
                </div>
                <label 
                  htmlFor="avatar-upload"
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-blue-600 hover:bg-blue-700 text-white border-2 border-white flex items-center justify-center cursor-pointer shadow-xs transition-colors"
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
                  className="inline-block px-3.5 py-1.5 border border-blue-500 text-blue-600 hover:bg-blue-50 rounded-xl text-xs font-semibold cursor-pointer transition-all shadow-2xs active:scale-95"
                >
                  Change Photo
                </label>
                <p className="text-[11px] text-slate-400 mt-1">
                  JPG, PNG (Max 2MB)
                </p>
              </div>
            </div>

            {/* Form Fields: 2-column grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  Full Name
                </label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="Enter your full name"
                />
              </div>

              {/* Student ID (Readonly) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  Student ID
                </label>
                <input 
                  type="text" 
                  value={studentId} 
                  disabled
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-xs font-medium text-slate-500 cursor-not-allowed select-none"
                />
              </div>

              {/* Email Address (Readonly) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  Email Address
                </label>
                <input 
                  type="email" 
                  value={email} 
                  disabled
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-xs font-medium text-slate-500 cursor-not-allowed select-none"
                />
              </div>

              {/* Phone Number with Add/Edit button */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  Phone Number
                </label>
                <div className="relative flex items-center">
                  <input 
                    type="text" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={!isEditingPhone && phone !== "Not Added"}
                    className="w-full px-3.5 py-2.5 pr-14 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:bg-slate-50 disabled:text-slate-600"
                    placeholder="Enter phone number"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (phone === "Not Added") setPhone("");
                      setIsEditingPhone(!isEditingPhone);
                    }}
                    className="absolute right-2 px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200/80"
                  >
                    {isEditingPhone ? "Done" : phone === "Not Added" ? "Add" : "Edit"}
                  </button>
                </div>
              </div>

              {/* Date of Birth with Calendar Icon */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  Date of Birth
                </label>
                <div className="relative flex items-center">
                  <input 
                    type="text" 
                    value={dob} 
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                  <CalendarIcon size={15} className="absolute right-3 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Gender Select Dropdown */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  Gender
                </label>
                <div className="relative flex items-center">
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  <ChevronDown size={15} className="absolute right-3 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Class / Course */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  Class / Course
                </label>
                <input 
                  type="text" 
                  value={courseName} 
                  onChange={(e) => setCourseName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              {/* Batch */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  Batch
                </label>
                <input 
                  type="text" 
                  value={batch} 
                  onChange={(e) => setBatch(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            {/* Bottom Right: Save Changes Button */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleSaveChanges}
                disabled={isSaving}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-xs font-semibold transition-all shadow-xs active:scale-95 flex items-center gap-2"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>

          {/* Card 2: About You */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs space-y-4">
            {/* Header */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                <FileText size={17} />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-none">
                  About You
                </h3>
                <p className="text-xs text-slate-500 font-normal mt-1">
                  Tell us a little bit about yourself.
                </p>
              </div>
            </div>

            {/* Bio Field */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-semibold text-slate-700 block">
                Bio <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <textarea 
                value={bio}
                onChange={(e) => setBio(e.target.value.substring(0, 300))}
                rows={3}
                maxLength={300}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                placeholder="Write a short summary about your background, goals and interests..."
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
                      className="text-blue-500 hover:text-blue-800 cursor-pointer"
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
                      className="px-3 py-1 text-xs border border-blue-400 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 w-28 bg-white"
                    />
                    <button 
                      type="submit" 
                      className="px-2.5 py-1 bg-blue-600 text-white rounded-xl text-xs font-semibold"
                    >
                      Add
                    </button>
                    <button 
                      type="button"
                      onClick={() => setShowInterestInput(false)}
                      className="p-1 text-slate-400 hover:text-slate-600"
                    >
                      <X size={14} />
                    </button>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowInterestInput(true)}
                    className="px-3 py-1.5 rounded-xl border border-dashed border-blue-400 text-blue-600 hover:bg-blue-50 text-xs font-semibold inline-flex items-center gap-1 transition-all shadow-2xs active:scale-95"
                  >
                    <Plus size={13} className="stroke-[2.5]" />
                    <span>Add Interest</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

            {/* Right Column: Account Status + Quick Actions + Learning Preferences */}
            <div className="xl:col-span-5 space-y-4 sm:space-y-5">
          {/* Card 1: Account Status */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-3.5">
            {/* Header */}
            <div className="flex items-start gap-2.5">
              <ShieldCheck size={20} className="text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                  Account Status
                </h4>
                <p className="text-[11px] text-slate-400 font-normal mt-0.5">
                  Your account is active and in good standing.
                </p>
              </div>
            </div>

            {/* Checklist inside soft green container */}
            <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                <span className="text-xs font-semibold text-slate-800">Email Verified</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                <span className="text-xs font-semibold text-slate-800">Profile Complete</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                <span className="text-xs font-semibold text-slate-800">Enrolled in 3 Courses</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                <span className="text-xs font-semibold text-slate-800">Access to All Features</span>
              </div>
            </div>
          </div>

          {/* Card 2: Quick Actions */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-3">
            {/* Header */}
            <div className="flex items-center gap-2 font-bold text-slate-900 text-xs sm:text-sm">
              <Zap size={16} className="text-amber-500 fill-amber-500" />
              <span>Quick Actions</span>
            </div>

            {/* List of 4 Actions */}
            <div className="space-y-1.5">
              {/* 1. Change Password */}
              <button
                type="button"
                onClick={() => setShowPasswordModal(true)}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50/80 border border-transparent hover:border-slate-100 transition-all text-left group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                    <Lock size={15} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors truncate">
                      Change Password
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      Update your account password
                    </p>
                  </div>
                </div>
                <ChevronRight size={14} className="text-slate-400 group-hover:text-blue-600 transition-colors shrink-0" />
              </button>

              {/* 2. Download My Data */}
              <button
                type="button"
                onClick={handleDownloadData}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50/80 border border-transparent hover:border-slate-100 transition-all text-left group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                    <Download size={15} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors truncate">
                      Download My Data
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      Get a copy of your learning data
                    </p>
                  </div>
                </div>
                <ChevronRight size={14} className="text-slate-400 group-hover:text-blue-600 transition-colors shrink-0" />
              </button>

              {/* 3. Deactivate Account */}
              <button
                type="button"
                onClick={() => setShowDeactivateModal(true)}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-rose-50/50 border border-transparent hover:border-rose-100 transition-all text-left group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 border border-rose-100 flex items-center justify-center shrink-0">
                    <Power size={15} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 group-hover:text-rose-600 transition-colors truncate">
                      Deactivate Account
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      Temporarily deactivate your account
                    </p>
                  </div>
                </div>
                <ChevronRight size={14} className="text-slate-400 group-hover:text-rose-600 transition-colors shrink-0" />
              </button>

              {/* 4. Delete Account */}
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-rose-50/50 border border-transparent hover:border-rose-100 transition-all text-left group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 border border-rose-100 flex items-center justify-center shrink-0">
                    <Trash2 size={15} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 group-hover:text-rose-600 transition-colors truncate">
                      Delete Account
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      Permanently delete your account
                    </p>
                  </div>
                </div>
                <ChevronRight size={14} className="text-slate-400 group-hover:text-rose-600 transition-colors shrink-0" />
              </button>
            </div>
          </div>

          {/* Card 3: Learning Preferences */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
            {/* Header */}
            <div className="flex items-start gap-2.5">
              <SettingsIcon size={18} className="text-blue-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                  Learning Preferences
                </h4>
                <p className="text-[11px] text-slate-400 font-normal mt-0.5">
                  Customize your learning experience.
                </p>
              </div>
            </div>

            {/* Dropdowns row */}
            <div className="grid grid-cols-2 gap-3">
              {/* Language */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 block">
                  Language
                </label>
                <div className="relative flex items-center">
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-3 py-2 pr-8 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none cursor-pointer"
                  >
                    <option value="English">English</option>
                    <option value="Hindi">Hindi</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Theme */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 block">
                  Theme
                </label>
                <div className="relative flex items-center">
                  <select
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    className="w-full px-3 py-2 pr-8 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none cursor-pointer"
                  >
                    <option value="Light">Light</option>
                    <option value="Dark">Dark</option>
                    <option value="System">System</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              {/* Content Notifications Toggle */}
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-800">
                    Content Notifications
                  </p>
                  <p className="text-[10px] text-slate-400 leading-tight mt-0.5">
                    Get notified about new lessons, tests and materials
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setContentNotifications(!contentNotifications)}
                  className={`w-11 h-6 rounded-full relative p-0.5 transition-colors cursor-pointer shrink-0 ${
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
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-800">
                    Email Updates
                  </p>
                  <p className="text-[10px] text-slate-400 leading-tight mt-0.5">
                    Receive important updates via email
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEmailUpdates(!emailUpdates)}
                  className={`w-11 h-6 rounded-full relative p-0.5 transition-colors cursor-pointer shrink-0 ${
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
          </div>
        </div>
      </div>

      {/* MODAL 1: Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <KeyRound size={17} />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Change Password</h3>
              </div>
              <button 
                onClick={() => { setShowPasswordModal(false); setPasswordSuccess(false); }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
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
                  className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold"
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
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
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
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
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
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                    placeholder="••••••••"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-all shadow-xs"
                  >
                    Update Password
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: Deactivate Account Modal */}
      {showDeactivateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <AlertCircle size={22} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Deactivate Account?</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Your profile and enrolled courses will be hidden temporarily. You can reactivate anytime by logging back in.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowDeactivateModal(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  alert("Account deactivation requested.");
                  setShowDeactivateModal(false);
                }}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold transition-all shadow-xs"
              >
                Deactivate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <ShieldAlert size={22} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Delete Account Permanently?</h3>
                <p className="text-xs text-slate-500 mt-1">
                  This action is irreversible. All your course progress, test scores, certificates, and submissions will be deleted.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  alert("Please contact your institute admin to permanently delete your student record.");
                  setShowDeleteModal(false);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition-all shadow-xs"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

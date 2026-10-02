"use client";

import { useState } from "react";

interface ProfilePhotoViewerProps {
  photoUrl: string;
  name: string;
}

export function ProfilePhotoViewer({ photoUrl, name }: ProfilePhotoViewerProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      onClick={() => setExpanded(!expanded)}
      title={expanded ? "Click to shrink" : "Click to expand photo"}
      className={`
        relative z-10 shrink-0 cursor-pointer overflow-hidden
        border-2 border-white shadow-sm ring-1 ring-slate-200/80
        transition-all duration-300 ease-in-out
        ${expanded
          ? "w-56 h-56 sm:w-64 sm:h-64 rounded-2xl shadow-xl"
          : "w-16 h-16 sm:w-20 sm:h-20 rounded-2xl hover:scale-105"
        }
      `}
    >
      <img
        src={photoUrl}
        alt={name}
        className="w-full h-full object-cover"
        draggable={false}
      />
    </div>
  );
}

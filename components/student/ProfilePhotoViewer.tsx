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
      title={expanded ? "Click to shrink" : "Click to expand"}
      className={`
        relative z-10 shrink-0 cursor-pointer overflow-hidden
        border-4 border-white shadow-2xl
        transition-all duration-500 ease-in-out
        ${expanded
          ? "w-80 h-80 rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.25)]"
          : "w-28 h-28 rounded-3xl hover:shadow-[0_8px_30px_rgba(0,0,0,0.15)]"
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

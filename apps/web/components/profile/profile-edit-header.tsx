"use client";

interface ProfileHeaderProps {
  onBack?: () => void;
  title?: string;
}

export default function ProfileHeader({ onBack, title = "Edit Profile" }: ProfileHeaderProps) {
  return (
    <header className="w-full flex items-center h-14  border-b border-gray-50 px-2 select-none">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center justify-center w-10 h-10 text-gray-900 rounded-full hover:bg-gray-50 active:scale-95 transition"
        aria-label="Go back"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          stroke="currentColor"
          className="w-5 h-5"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
      </button>

      <h1 className="text-[16px] font-bold text-gray-900 ml-2 tracking-tight">
        {title}
      </h1>
    </header>
  );
}
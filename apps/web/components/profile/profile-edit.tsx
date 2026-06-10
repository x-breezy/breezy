"use client";

import { useState, useRef } from "react";

export default function EditProfileScreen() {
  const [fullName, setFullName] = useState("Sam Altman");
  const [username, setUsername] = useState("@sam_alt");
  const [biography, setBiography] = useState("Owner of OpenAI, angel investor");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      const localUrl = URL.createObjectURL(file);
      setAvatarUrl(localUrl);
    }
  }

  return (
    <div className="w-full flex flex-col px-5 py-4 gap-4 overflow-y-auto flex-grow select-none">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleAvatarChange}
        accept="image/*"
        className="hidden"
      />

      <div className="flex flex-col items-center justify-center w-full my-3">
        <div className="relative w-24 h-24">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-full rounded-full overflow-hidden bg-[#c2dca3] cursor-pointer active:opacity-90 transition flex items-center justify-center text-gray-600 font-medium"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl tracking-tighter">S</span>
            )}
          </div>
          <button 
            type="button" 
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0.5 right-0.5 w-7 h-7 bg-white border border-gray-100 rounded-full flex items-center justify-center shadow-sm active:scale-95 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 text-gray-800">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="w-full text-left mb-1">
        <h2 className="text-[17px] font-bold text-gray-900 tracking-tight">
          Profile Editing
        </h2>
      </div>

      <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-4 w-full">
        <div className="flex flex-col gap-1 w-full">
          <label className="text-[13px] text-gray-800 pl-1">
            Name
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full h-11 px-4 bg-white border border-gray-200 rounded-[24px] text-[14px] text-gray-900 focus:outline-none focus:border-gray-400 transition"
          />
        </div>

        <div className="flex flex-col gap-1 w-full">
          <label className="text-[13px] text-gray-800 pl-1">
            Username
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full h-11 px-4 bg-white border border-gray-200 rounded-[24px] text-[14px] text-gray-900 focus:outline-none focus:border-gray-400 transition"
          />
        </div>

        <div className="flex flex-col gap-1 w-full">
          <label className="text-[13px]  text-gray-800 pl-1">
            Biography
          </label>
          <textarea
            value={biography}
            onChange={(e) => setBiography(e.target.value)}
            rows={6}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-[21px] text-[14px] text-gray-900 focus:outline-none focus:border-gray-400 resize-none transition leading-normal"
          />
        </div>

        <div className="flex items-center justify-between gap-4 w-full mt-5 pb-4">
          <button
            type="button"
            className="w-1/2 h-8 bg-white border border-gray-200 text-gray-800 rounded-[24px] text-[14px] font-medium text-center active:scale-[0.98] hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="w-1/2 h-8 bg-black text-white rounded-[24px] text-[14px] font-medium text-center active:scale-[0.98] hover:bg-[#23534c] transition"
          >
            Save changes
          </button>
        </div>
      </form>
    </div>
  );
}
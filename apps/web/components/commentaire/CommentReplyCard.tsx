"use client";

import { useState } from "react";

interface CommentReplyCardProps {
  avatar: string;
  name: string;
  username: string;
  replyToUsername: string; // Ajout de la prop pour le nom du parent
  timestamp: string;
  content: string;
  likes: number;
}

export default function CommentReplyCard({ avatar, name, username, replyToUsername, timestamp, content, likes }: CommentReplyCardProps) {
  const [imgError, setImgError] = useState(false);
  const firstLetter = name && name.trim() ? name.trim().charAt(0).toUpperCase() : "?";

  return (
    <div className="w-full bg-white pl-16 pr-4 pt-2 pb-3 flex gap-3 select-none border-b border-gray-50">
      
      {/* Container d'avatar */}
      <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center select-none">
        {avatar && !imgError ? (
          <img 
            src={avatar} 
            alt={name} 
            onError={() => setImgError(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-[13px] font-bold text-gray-500 tracking-tight block">
            {firstLetter}
          </span>
        )}
      </div>
      
      <div className="flex flex-col flex-grow min-w-0">
        
        {/* En-tête de la réponse */}
        <div className="flex items-center justify-between w-full gap-2">
          <div className="flex items-center gap-1.5 text-[14px] min-w-0 flex-grow">
            <span className="font-bold text-gray-900 truncate">{name}</span>
            <span className="text-gray-500 truncate whitespace-nowrap">@{username}</span>
            <span className="text-gray-400 whitespace-nowrap">• {timestamp}</span>
          </div>
          
          <button type="button" className="text-gray-400 hover:text-gray-600 transition flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
            </svg>
          </button>
        </div>

        {/* Mention "En réponse à" style X */}
        <div className="text-[13px] text-gray-500 mt-0.5">
          En réponse à <span className="text-[#2d6a61] cursor-pointer hover:underline">@{replyToUsername}</span>
        </div>

        {/* Message de la réponse */}
        <p className="text-[14px] text-gray-800 mt-1 leading-normal pr-2 break-words">
          {content}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-6 mt-2 text-gray-400 text-[12px]">
          <button type="button" className="flex items-center gap-1.5 hover:text-red-500 transition group">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
            <span className="font-medium text-gray-500 group-hover:text-red-500">{likes}</span>
          </button>
          <button type="button" className="hover:text-blue-500 transition">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785 4.75 4.75 0 001.992-.37c.552-.245 1.157-.24 1.62.146A9.168 9.168 0 0012 20.25z" />
            </svg>
          </button>
        </div>

      </div>
    </div>
  );
}
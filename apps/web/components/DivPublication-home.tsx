"use client";
import { IconHeart } from '@tabler/icons-react';
import { IconMessageCircle } from '@tabler/icons-react';

import { useState } from "react";

interface PostCardProps {
  id: string;
  name: string;
  username: string;
  content: string;
  createdAt: string; // ex: "2h"
  initialLikes?: number;
  initialComments?: number;
}

export default function PostCard({
  id,
  name,
  username,
  content,
  createdAt,
  initialLikes = 0,
  initialComments = 0,
}: PostCardProps) {
  const [likes, setLikes] = useState(initialLikes);
  const [isLiked, setIsLiked] = useState(false);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLiked) {
      setLikes(likes - 1);
    } else {
      setLikes(likes + 1);
    }
    setIsLiked(!isLiked);
  };

  return (
    <div className="flex gap-2.5 p-3.5 bg-white border-b border-gray-100 active:bg-gray-50/50 transition w-full max-w-[390px] mx-auto text-left select-none">
      
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 font-bold text-xs uppercase">
          {name.charAt(0)}
        </div>
      </div>

      {/* Contenu complet */}
      <div className="flex-1 min-w-0 w-full">
        
        {/* En-tête : Infos utilisateur et bouton d'option */}
        <div className="flex items-center justify-between mb-0.5 w-full">
          <div className="flex items-center gap-1 text-sm max-w-[90%]">
            <span className="font-bold text-gray-900 truncate">
              {name}
            </span>
            <span className="text-gray-500 truncate text-xs">
              @{username}
            </span>
            <span className="text-gray-400 text-xs">·</span>
            <span className="text-gray-500 text-xs whitespace-nowrap">
              {createdAt}
            </span>
          </div>
          
          <button className="text-gray-400 p-1 -mr-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 12c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm9-2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm7 0c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z" />
            </svg>
          </button>
        </div>

        {/* Corps du message */}
        <p className="text-gray-800 text-sm leading-tight whitespace-pre-wrap break-words w-full central-text-post">
          {content}
        </p>

        {/* Zone d'actions groupée */}
        <div className="flex items-center gap-6 mt-2 text-gray-400">
          
          {/* Bouton Like */}
          <button
            onClick={handleLike}
            className={`flex items-center gap-1 w-auto flex-shrink-0 text-xs transition select-none ${
              isLiked ? "text-pink-600 font-medium" : "text-gray-400 active:text-pink-500"
            }`}
          >
            <IconHeart stroke={2} 
              className="w-4.5 h-4.5 flex-shrink-0" 
              fill={isLiked ? "currentColor" : "none"} 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </IconHeart>
            <span className="text-xs">{likes}</span>
          </button>

          {/* Bouton Commentaire */}
          <button className="flex items-center gap-1 w-auto flex-shrink-0 text-xs text-gray-400 active:text-blue-500 transition select-none">
            <IconMessageCircle stroke={2} 
              className="w-4.5 h-4.5 flex-shrink-0" 
              fill="none" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </IconMessageCircle>
            <span className="text-xs">{initialComments}</span>
          </button>

        </div>

      </div>
    </div>
  );
}
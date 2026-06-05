"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../packages/ui/src/components/select";

interface SettingsScreenProps {
  name: string;
  username: string;
  avatarUrl?: string;
}

export default function SettingsScreen(props: SettingsScreenProps) {
  const [language, setLanguage] = useState<string | null>("fr");
  const [theme, setTheme] = useState<string | null>("light");

  function handleLogout() {
    alert("Déconnexion de l'utilisateur");
  }

  return (
    <div className="w-full max-w-[390px] min-h-[844px] bg-white flex flex-col mx-auto p-4 select-none font-sans">
      <div className="flex flex-col gap-3.5 w-full mt-2">
        
        {/* 1. Bloc Utilisateur */}
        <div className="w-full flex items-center justify-between p-3.5 bg-gray-50 rounded-3xl text-left">
          <div className="flex items-center gap-3">
            {props.avatarUrl ? (
              <img 
                src={props.avatarUrl} 
                alt={props.name}
                className="w-12 h-12 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-white font-bold text-base uppercase flex-shrink-0">
                {props.name.charAt(0)}
              </div>
            )}
            <div className="flex flex-col">
              <span className="font-bold text-gray-900 text-sm">{props.name}</span>
              <span className="text-gray-500 text-xs">@{props.username}</span>
            </div>
          </div>
          <svg className="w-4 h-4 text-gray-900" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </div>

        {/* 2. Sélecteur de Langue */}
        <Select value={language} onValueChange={setLanguage}>
          <SelectTrigger className="w-full flex items-center justify-between p-3.5 h-auto bg-gray-50 rounded-3xl border-none shadow-none text-gray-900 data-[state=open]:bg-gray-100 active:bg-gray-100 transition text-left font-normal focus:ring-0 focus:ring-offset-0">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 006-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896 2.3 2.135 4.313 3.599 5.83M10.5 8.25a27.147 27.147 0 01-2.903 8.633M19.5 12l-3-3" />
              </svg>
              <span className="font-medium text-sm text-gray-900">Language</span>
            </div>
            <div className="text-xs text-gray-400 mr-1 font-sans">
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent className="rounded-2xl border-gray-100 shadow-lg">
            <SelectGroup>
              <SelectItem value="fr" className="text-sm rounded-xl">Français</SelectItem>
              <SelectItem value="en" className="text-sm rounded-xl">English</SelectItem>
              <SelectItem value="es" className="text-sm rounded-xl">Español</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>

        {/* 3. Sélecteur de Thème */}
        <Select value={theme} onValueChange={setTheme}>
          <SelectTrigger className="w-full flex items-center justify-between p-3.5 h-auto bg-gray-50 rounded-3xl border-none shadow-none text-gray-900 data-[state=open]:bg-gray-100 active:bg-gray-100 transition text-left font-normal focus:ring-0 focus:ring-offset-0">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a15.997 15.997 0 01-3.42-3.42" />
              </svg>
              <span className="font-medium text-sm text-gray-900">Theme</span>
            </div>
            <div className="text-xs text-gray-400 mr-1 font-sans capitalize">
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent className="rounded-2xl border-gray-100 shadow-lg">
            <SelectGroup>
              <SelectItem value="light" className="text-sm rounded-xl">Light</SelectItem>
              <SelectItem value="dark" className="text-sm rounded-xl">Dark</SelectItem>
              <SelectItem value="system" className="text-sm rounded-xl">System</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>

        {/* 4. Bouton Log out */}
        <button 
          onClick={handleLogout}
          className="w-full py-2.5 border border-gray-200/70 rounded-2xl text-red-500 text-sm font-medium text-center bg-white active:bg-red-50/50 transition mt-1"
        >
          Log out
        </button>

      </div>
    </div>
  );
}
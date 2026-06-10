"use client";

import { useRouter } from "next/navigation";
import EditProfileScreen from "@/components/profile/profile-edit"; 
import ProfileHeader from "@/components/profile/profile-edit-header";


export default function ProfilePage() {
    const router = useRouter();
  return (
    <div className="flex min-h-svh flex-col items-center justify-center p-6 bg-gray-50">
      <ProfileHeader onBack={() => router.back()} title="Edit Profile" />
      <EditProfileScreen />
    </div>
  );
}
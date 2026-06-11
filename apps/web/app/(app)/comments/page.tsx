"use client";

import { useRouter } from "next/navigation";
import CommentHeader from "@/components/commentaire/comment-header";
import CommentCard from "@/components/commentaire/commentCard";
import CommentReplyCard from "@/components/commentaire/CommentReplyCard";

export default function CommentHeaderPage() {
  const router = useRouter();

  return (
    // Aligne le simulateur au centre de l'écran global
    <div className="flex min-h-screen w-full items-center justify-center bg-gray-100 p-4">
      
      {/* Conteneur mobile : fixe la taille et empile le flux vers le haut */}
      <div className="w-full max-w-[390px] h-[844px] bg-white flex flex-col shadow-sm rounded-2xl overflow-hidden border border-gray-100">
        
        {/* En-tête de filtrage */}
        <CommentHeader />
        
        {/* Zone de défilement du flux de commentaires */}
        <div className="flex flex-col flex-grow justify-start items-start bg-white overflow-y-auto">
          
          <CommentCard 
            avatar="/path/to/avatar.jpg"
            name="John Doe"
            username="johndoe"
            timestamp="2h"
            content="This is a sample comment."
            likes={12}
            hasReply={true}
          />
          
          <CommentReplyCard
            avatar="/path/to/reply-avatar.jpg"
            name="Jane Smith"
            username="janesmith"
            timestamp="1h"
            content="This is a sample reply."
            likes={5}
            replyToUsername="johndoe" 
          />
          
          <CommentReplyCard
            avatar="/path/to/reply-avatar2.jpg"
            name="Alice Johnson"
            username="alicejohnson"
            timestamp="30m"
            content="This is another sample reply."
            likes={3}
            replyToUsername="johndoe"
          />
          
        </div>
      </div>
    </div>
  );
}
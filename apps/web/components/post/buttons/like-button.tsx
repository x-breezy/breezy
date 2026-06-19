import { useState } from "react"
import styles from "./like-button.module.css"
import { cn } from "@/lib/utils"

interface LikeButtonProps {
  count: number
  isLiked: boolean
  onLike: (e: React.MouseEvent) => void
  size?: "sm" | "md"
}

const sizeClasses = {
  sm: { icon: 18, text: "text-xs" },
  md: { icon: 22, text: "text-sm" },
}

export function LikeButton({ count, isLiked, onLike, size = "sm" }: LikeButtonProps) {
  const s = sizeClasses[size]
  const [interacted, setInteracted] = useState(false)

  function handleLike(e: React.MouseEvent) {
    if (!interacted) setInteracted(true)
    onLike(e)
  }

  return (
    <button
      onClick={handleLike}
      aria-label={isLiked ? "Unlike post" : "Like post"}
      aria-pressed={isLiked}
      className={cn(
        `flex items-center gap-1 ${s.text} rounded-full p-1 px-2 transition select-none hover:bg-red-500/10`,
        isLiked
          ? "font-medium text-red-500"
          : "text-muted-foreground hover:text-red-500 active:text-red-500"
      )}
    >
      <svg
        xmlns='http://www.w3.org/2000/svg'
        viewBox='0 0 24 24'
        width={s.icon}
        height={s.icon}
        fill='none'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
        className={styles.heartSvg}
        data-filled={isLiked || undefined}
        data-liked={(interacted && isLiked) || undefined}
        aria-hidden='true'
      >
        <path stroke='none' d='M0 0h24v24H0z' fill='none' />
        <path
          className={styles.heart}
          d='M19.5 12.572l-7.5 7.428l-7.5 -7.428a5 5 0 1 1 7.5 -6.566a5 5 0 1 1 7.5 6.572'
        />
        <circle className={styles.mainCirc} fill='#E2264D' opacity='0' cx='12' cy='12' r='0.6' />
        <g className={styles.grp7} opacity='0' transform='translate(2.9 2.5)'>
          <circle fill='#9CD8C3' cx='0.8' cy='2.5' r='0.8' />
          <circle fill='#8CE8C3' cx='2.1' cy='0.8' r='0.8' />
        </g>
        <g className={styles.grp6} opacity='0' transform='translate(0 11.6)'>
          <circle fill='#CC8EF5' cx='0.8' cy='2.9' r='0.8' />
          <circle fill='#91D2FA' cx='1.2' cy='0.8' r='0.8' />
        </g>
        <g className={styles.grp3} opacity='0' transform='translate(21.5 11.6)'>
          <circle fill='#9CD8C3' cx='0.8' cy='2.9' r='0.8' />
          <circle fill='#8CE8C3' cx='1.7' cy='0.8' r='0.8' />
        </g>
        <g className={styles.grp2} opacity='0' transform='translate(18.2 2.5)'>
          <circle fill='#CC8EF5' cx='2.1' cy='2.5' r='0.8' />
          <circle fill='#CC8EF5' cx='0.8' cy='0.8' r='0.8' />
        </g>
        <g className={styles.grp5} opacity='0' transform='translate(5.8 20.7)'>
          <circle fill='#91D2FA' cx='2.5' cy='2.1' r='0.8' />
          <circle fill='#91D2FA' cx='0.8' cy='0.8' r='0.8' />
        </g>
        <g className={styles.grp4} opacity='0' transform='translate(14.5 20.7)'>
          <circle fill='#F48EA7' cx='2.5' cy='2.1' r='0.8' />
          <circle fill='#F48EA7' cx='0.8' cy='0.8' r='0.8' />
        </g>
        <g className={styles.grp1} opacity='0' transform='translate(9.9 0)'>
          <circle fill='#9FC7FA' cx='1.0' cy='1.2' r='0.8' />
          <circle fill='#9FC7FA' cx='3.1' cy='0.8' r='0.8' />
        </g>
      </svg>
      <span aria-label={`${count} likes`}>{count}</span>
    </button>
  )
}

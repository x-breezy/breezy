import React, { useState, KeyboardEvent } from "react"
import { IconX } from "@tabler/icons-react"

export interface TagInputProps {
  placeholder?: string
  tags: string[]
  setTags: (tags: string[]) => void
  disabled?: boolean
}

export function TagInput({ placeholder, tags, setTags, disabled }: TagInputProps) {
  const [inputValue, setInputValue] = useState("")

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "," || e.key === " ") {
      e.preventDefault()
      addTag()
    } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      e.preventDefault()
      // Remove last tag
      setTags(tags.slice(0, -1))
    }
  }

  const addTag = () => {
    const newTag = inputValue.trim().replace(/,/g, "")
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag])
    }
    setInputValue("")
  }

  const removeTag = (indexToRemove: number) => {
    if (disabled) return;
    setTags(tags.filter((_, index) => index !== indexToRemove))
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 p-2 border border-input rounded-md bg-transparent focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 transition-shadow ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}>
      {tags.map((tag, index) => (
        <span 
          key={index} 
          className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 px-2.5 py-0.5 rounded-full text-sm font-medium"
        >
          @{tag}
          <button 
            type="button" 
            onClick={() => removeTag(index)} 
            disabled={disabled}
            className="text-blue-500 hover:text-blue-700 dark:hover:text-blue-200 rounded-full p-0.5 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <IconX size={14} />
          </button>
        </span>
      ))}
      <input
        type="text"
        className="flex-1 bg-transparent border-none outline-none focus:ring-0 min-w-[120px] text-sm p-1"
        placeholder={tags.length === 0 ? placeholder : ""}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={addTag}
        disabled={disabled}
      />
    </div>
  )
}

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
    if (disabled) return
    setTags(tags.filter((_, index) => index !== indexToRemove))
  }

  return (
    <div
      className={`flex flex-wrap items-center gap-2 rounded-md border border-input bg-transparent p-2 transition-shadow focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
    >
      {tags.map((tag, index) => (
        <span
          key={index}
          className='flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-sm font-medium text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
        >
          @{tag}
          <button
            type='button'
            onClick={() => removeTag(index)}
            disabled={disabled}
            className='rounded-full p-0.5 text-blue-500 transition-colors hover:bg-blue-200 hover:text-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:hover:bg-blue-800 dark:hover:text-blue-200'
          >
            <IconX size={14} />
          </button>
        </span>
      ))}
      <input
        type='text'
        className='min-w-[120px] flex-1 border-none bg-transparent p-1 text-sm outline-none focus:ring-0'
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

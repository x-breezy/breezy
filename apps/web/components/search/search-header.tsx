"use client"

import { useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { IconSearch, IconX } from "@tabler/icons-react"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"
import { PageHeader } from "@/components/layout/page-header"

export function SearchHeader() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [value, setValue] = useState(searchParams.get("q") ?? "")
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const urlQ = searchParams.get("q") ?? ""

  const displayValue = focused ? value : urlQ

  function submit() {
    const q = value.trim()
    if (!q) return
    const params = new URLSearchParams(searchParams.toString())
    params.set("q", q)
    router.push(`/search?${params.toString()}`)
    inputRef.current?.blur()
    setFocused(false)
  }

  return (
    <PageHeader className='py-2'>
      <div className='flex items-center'>
        <InputGroup className='h-11 rounded-full px-2 text-base'>
          <InputGroupAddon align='inline-start'>
            <InputGroupText>
              <IconSearch size={20} strokeWidth={2} />
            </InputGroupText>
          </InputGroupAddon>
          <InputGroupInput
            ref={inputRef}
            type='text'
            placeholder='Rechercher'
            aria-label='Rechercher'
            className='text-base'
            value={displayValue}
            onChange={(e) => setValue(e.target.value)}
            onFocus={() => {
              setValue(urlQ)
              setFocused(true)
            }}
            onBlur={() => setFocused(false)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
          {displayValue && (
            <InputGroupAddon align='inline-end'>
              <InputGroupButton
                size='icon-sm'
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setValue("")
                  const params = new URLSearchParams(searchParams.toString())
                  params.delete("q")
                  router.push(`/search?${params.toString()}`)
                }}
                aria-label='Cancel'
              >
                <IconX size={16} />
              </InputGroupButton>
            </InputGroupAddon>
          )}
        </InputGroup>
      </div>
    </PageHeader>
  )
}

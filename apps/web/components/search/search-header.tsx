"use client"

import { useRef, useState } from "react"
import { IconSearch, IconX } from "@tabler/icons-react"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/layout/page-header"

export function SearchHeader() {
  const [value, setValue] = useState("")
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <PageHeader className='py-2.5'>
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
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
          {value && (
            <InputGroupAddon align='inline-end'>
              <InputGroupButton
                size='icon-sm'
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setValue("")}
                aria-label='Cancel'
              >
                <IconX size={16} />
              </InputGroupButton>
            </InputGroupAddon>
          )}
        </InputGroup>
        {focused && (
          <Button
            variant='ghost'
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setValue("")
              setFocused(false)
              inputRef.current?.blur()
            }}
          >
            Cancel
          </Button>
        )}
      </div>
    </PageHeader>
  )
}

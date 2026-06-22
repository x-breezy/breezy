"use client"

import { useCallback, useState } from "react"
import Cropper, { type Area } from "react-easy-crop"
import "react-easy-crop/react-easy-crop.css"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface AvatarCropperProps {
  open: boolean
  imageUrl: string
  onCrop: (file: File) => void
  onClose: () => void
}

export function AvatarCropper({ open, imageUrl, onCrop, onClose }: AvatarCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  async function handleSave() {
    if (!croppedAreaPixels) return
    const blob = await getCroppedBlob(imageUrl, croppedAreaPixels)
    if (!blob) return
    const file = new File([blob], "avatar.jpg", { type: "image/jpeg" })
    onCrop(file)
    onClose()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose()
      }}
    >
      <DialogContent className='sm:max-w-lg' showCloseButton={false}>
        <DialogTitle className='sr-only'>Crop avatar</DialogTitle>
        <div className='relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-xl bg-black'>
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape='round'
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>
        <div className='flex items-center gap-3 px-1'>
          <span className='shrink-0 text-xs text-muted-foreground'>Zoom</span>
          <input
            type='range'
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className='h-1 flex-1 cursor-pointer appearance-none rounded-full bg-input accent-primary [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:ring-1 [&::-webkit-slider-thumb]:ring-black/10'
          />
        </div>
        <div className='flex justify-end gap-2'>
          <Button variant='outline' onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function getCroppedBlob(imageUrl: string, pixelCrop: Area): Promise<Blob | null> {
  return new Promise((resolve) => {
    const image = new Image()
    image.crossOrigin = "anonymous"
    image.src = imageUrl
    image.onload = () => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        resolve(null)
        return
      }

      canvas.width = pixelCrop.width
      canvas.height = pixelCrop.height

      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
      )

      canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.9)
    }
    image.onerror = () => resolve(null)
  })
}

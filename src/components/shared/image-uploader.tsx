import * as React from 'react'
import { useCallback, useState } from 'react'
import { Upload, X, Image as ImageIcon, GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

export interface ImageFile {
  id: string
  url: string
  file?: File
  name?: string
  size?: number
  contentType?: string
}

interface ImageUploaderProps {
  images: ImageFile[]
  onChange: (images: ImageFile[]) => void
  onUpload?: (file: File) => Promise<ImageFile>
  maxImages?: number
  disabled?: boolean
  className?: string
}

export function ImageUploader({
  images,
  onChange,
  onUpload,
  maxImages = 10,
  disabled = false,
  className,
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploadingCount, setUploadingCount] = useState(0)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const processFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files).filter((f) =>
        f.type.startsWith('image/')
      )
      const remainingSlots = maxImages - images.length
      const filesToProcess = fileArray.slice(0, remainingSlots)

      if (filesToProcess.length === 0) return

      setUploadingCount(filesToProcess.length)

      const newImages: ImageFile[] = []

      for (const file of filesToProcess) {
        if (onUpload) {
          try {
            const uploaded = await onUpload(file)
            newImages.push(uploaded)
          } catch (error) {
            console.error('Failed to upload image:', error)
          }
        } else {
          // Local preview without upload
          const url = URL.createObjectURL(file)
          newImages.push({
            id: crypto.randomUUID(),
            url,
            file,
            name: file.name,
            size: file.size,
            contentType: file.type,
          })
        }
        setUploadingCount((prev) => prev - 1)
      }

      onChange([...images, ...newImages])
    },
    [images, maxImages, onChange, onUpload]
  )

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      if (disabled) return

      const { files } = e.dataTransfer
      await processFiles(files)
    },
    [disabled, processFiles]
  )

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const { files } = e.target
      if (files) {
        await processFiles(files)
      }
      // Reset input
      e.target.value = ''
    },
    [processFiles]
  )

  const handleRemove = useCallback(
    (id: string) => {
      const image = images.find((img) => img.id === id)
      if (image?.url.startsWith('blob:')) {
        URL.revokeObjectURL(image.url)
      }
      onChange(images.filter((img) => img.id !== id))
    },
    [images, onChange]
  )

  // Drag to reorder
  const handleImageDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleImageDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const newImages = [...images]
    const [draggedImage] = newImages.splice(draggedIndex, 1)
    newImages.splice(index, 0, draggedImage)
    onChange(newImages)
    setDraggedIndex(index)
  }

  const handleImageDragEnd = () => {
    setDraggedIndex(null)
  }

  const canAddMore = images.length < maxImages

  return (
    <div className={cn('space-y-4', className)}>
      {/* Drop zone */}
      {canAddMore && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={cn(
            'relative flex min-h-[180px] cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed transition-all duration-300',
            isDragging
              ? 'border-accent bg-accent/5 scale-[1.02]'
              : 'border-border hover:border-foreground/30 hover:bg-secondary/30',
            disabled && 'cursor-not-allowed opacity-50'
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            disabled={disabled}
            className="hidden"
          />

          <div
            className={cn(
              'flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary transition-transform duration-300',
              isDragging && 'scale-110'
            )}
          >
            <Upload
              className={cn(
                'h-6 w-6 transition-colors',
                isDragging ? 'text-accent' : 'text-muted-foreground'
              )}
            />
          </div>

          <div className="text-center">
            <p className="text-sm font-medium">
              {isDragging ? 'Drop images here' : 'Drag & drop images'}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              or click to browse
            </p>
          </div>

          <p className="text-xs text-muted-foreground">
            {images.length} / {maxImages} images
          </p>
        </div>
      )}

      {/* Uploading indicator */}
      {uploadingCount > 0 && (
        <div className="flex items-center gap-3 rounded-xl bg-secondary/50 px-4 py-3">
          <Spinner size="sm" />
          <span className="text-sm">
            Uploading {uploadingCount} image{uploadingCount > 1 ? 's' : ''}...
          </span>
        </div>
      )}

      {/* Image grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {images.map((image, index) => (
            <div
              key={image.id}
              draggable
              onDragStart={() => handleImageDragStart(index)}
              onDragOver={(e) => handleImageDragOver(e, index)}
              onDragEnd={handleImageDragEnd}
              className={cn(
                'group relative aspect-square overflow-hidden rounded-xl border border-border bg-secondary/30 transition-all duration-200',
                draggedIndex === index && 'opacity-50 scale-95',
                'hover:border-foreground/30'
              )}
            >
              {image.url ? (
                <img
                  src={image.url}
                  alt={image.name || `Image ${index + 1}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                </div>
              )}

              {/* Overlay controls */}
              <div className="absolute inset-0 flex items-center justify-center bg-foreground/60 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemove(image.id)
                  }}
                  className="h-9 w-9 rounded-full"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Drag handle */}
              <div className="absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg bg-background/80 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </div>

              {/* Index badge */}
              <div className="absolute bottom-2 right-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-background/80 px-1.5 text-xs font-medium backdrop-blur-sm">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

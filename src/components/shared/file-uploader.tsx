import * as React from 'react'
import { useCallback, useState } from 'react'
import { Upload, X, FileText, File as FileIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

export interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  file?: File
  url?: string
}

interface FileUploaderProps {
  files: UploadedFile[]
  onChange: (files: UploadedFile[]) => void
  onUpload?: (file: File) => Promise<UploadedFile>
  accept?: string
  maxFiles?: number
  maxSizeMB?: number
  disabled?: boolean
  className?: string
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function getFileIcon(type: string) {
  if (type.includes('pdf')) return FileText
  return FileIcon
}

export function FileUploader({
  files,
  onChange,
  onUpload,
  accept = '.pdf,.doc,.docx,.xls,.xlsx',
  maxFiles = 10,
  maxSizeMB = 10,
  disabled = false,
  className,
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploadingCount, setUploadingCount] = useState(0)
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
    async (inputFiles: FileList | File[]) => {
      const fileArray = Array.from(inputFiles).filter(
        (f) => f.size <= maxSizeMB * 1024 * 1024
      )
      const remainingSlots = maxFiles - files.length
      const filesToProcess = fileArray.slice(0, remainingSlots)

      if (filesToProcess.length === 0) return

      setUploadingCount(filesToProcess.length)

      const newFiles: UploadedFile[] = []

      for (const file of filesToProcess) {
        if (onUpload) {
          try {
            const uploaded = await onUpload(file)
            newFiles.push(uploaded)
          } catch (error) {
            console.error('Failed to upload file:', error)
          }
        } else {
          newFiles.push({
            id: crypto.randomUUID(),
            name: file.name,
            size: file.size,
            type: file.type,
            file,
          })
        }
        setUploadingCount((prev) => prev - 1)
      }

      onChange([...files, ...newFiles])
    },
    [files, maxFiles, maxSizeMB, onChange, onUpload]
  )

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      if (disabled) return

      const { files: droppedFiles } = e.dataTransfer
      await processFiles(droppedFiles)
    },
    [disabled, processFiles]
  )

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const { files: selectedFiles } = e.target
      if (selectedFiles) {
        await processFiles(selectedFiles)
      }
      e.target.value = ''
    },
    [processFiles]
  )

  const handleRemove = useCallback(
    (id: string) => {
      onChange(files.filter((f) => f.id !== id))
    },
    [files, onChange]
  )

  const canAddMore = files.length < maxFiles

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
            'relative flex min-h-[140px] cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed transition-all duration-300',
            isDragging
              ? 'border-accent bg-accent/5 scale-[1.02]'
              : 'border-border hover:border-foreground/30 hover:bg-secondary/30',
            disabled && 'cursor-not-allowed opacity-50'
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            multiple
            onChange={handleFileSelect}
            disabled={disabled}
            className="hidden"
          />

          <div
            className={cn(
              'flex h-12 w-12 items-center justify-center rounded-xl bg-secondary transition-transform duration-300',
              isDragging && 'scale-110'
            )}
          >
            <Upload
              className={cn(
                'h-5 w-5 transition-colors',
                isDragging ? 'text-accent' : 'text-muted-foreground'
              )}
            />
          </div>

          <div className="text-center">
            <p className="text-sm font-medium">
              {isDragging ? 'Drop files here' : 'Drag & drop files'}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              or click to browse (max {maxSizeMB}MB)
            </p>
          </div>
        </div>
      )}

      {/* Uploading indicator */}
      {uploadingCount > 0 && (
        <div className="flex items-center gap-3 rounded-xl bg-secondary/50 px-4 py-3">
          <Spinner size="sm" />
          <span className="text-sm">
            Uploading {uploadingCount} file{uploadingCount > 1 ? 's' : ''}...
          </span>
        </div>
      )}

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file) => {
            const Icon = getFileIcon(file.type)
            return (
              <div
                key={file.id}
                className="group flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:border-foreground/20"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemove(file.id)}
                  className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

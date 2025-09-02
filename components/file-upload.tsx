"use client"

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent } from '@/components/ui/card'
import { Upload, X, FileText, ImageIcon, CheckCircle, AlertCircle } from 'lucide-react'
import { FirebaseStorageService, UploadProgress, ALLOWED_IMAGE_TYPES, ALLOWED_DOCUMENT_TYPES, MAX_FILE_SIZE_MB } from '@/lib/firebase-storage'

interface FileUploadProps {
  studentId?: string
  paymentId?: string
  type: 'photo' | 'document' | 'receipt'
  onUploadComplete: (url: string) => void
  onUploadError: (error: string) => void
  maxFiles?: number
  accept?: string
}

export function FileUpload({
  studentId,
  paymentId,
  type,
  onUploadComplete,
  onUploadError,
  maxFiles = 1,
  accept
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || [])
    
    // Validar número de archivos
    if (selectedFiles.length + files.length > maxFiles) {
      onUploadError(`Solo se pueden subir máximo ${maxFiles} archivo(s)`)
      return
    }

    // Validar cada archivo
    const validFiles: File[] = []
    for (const file of selectedFiles) {
      if (!validateFile(file)) {
        continue
      }
      validFiles.push(file)
    }

    setFiles(prev => [...prev, ...validFiles])
  }

  const validateFile = (file: File): boolean => {
    // Validar tipo de archivo
    let allowedTypes: string[] = []
    if (type === 'photo') {
      allowedTypes = ALLOWED_IMAGE_TYPES
    } else if (type === 'document' || type === 'receipt') {
      allowedTypes = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES]
    }

    if (!FirebaseStorageService.validateFileType(file, allowedTypes)) {
      onUploadError(`Tipo de archivo no permitido: ${file.type}`)
      return false
    }

    // Validar tamaño
    if (!FirebaseStorageService.validateFileSize(file, MAX_FILE_SIZE_MB)) {
      onUploadError(`El archivo ${file.name} excede el tamaño máximo de ${MAX_FILE_SIZE_MB}MB`)
      return false
    }

    return true
  }

  const handleUpload = async () => {
    if (files.length === 0) return

    setUploading(true)
    
    try {
      for (const file of files) {
        const onProgress = (progress: UploadProgress) => {
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: progress.progress
          }))
        }

        let url: string
        
        if (type === 'receipt' && paymentId) {
          url = await FirebaseStorageService.uploadPaymentReceipt(paymentId, file, onProgress)
        } else if ((type === 'photo' || type === 'document') && studentId) {
          // Comprimir imagen si es necesario
          let fileToUpload = file
          if (type === 'photo' && ALLOWED_IMAGE_TYPES.includes(file.type)) {
            fileToUpload = await FirebaseStorageService.compressImage(file)
          }
          
          url = await FirebaseStorageService.uploadStudentFile(studentId, fileToUpload, type, onProgress)
        } else {
          throw new Error('Faltan parámetros requeridos para la subida')
        }

        setUploadedUrls(prev => [...prev, url])
        onUploadComplete(url)
      }
    } catch (error) {
      onUploadError(error instanceof Error ? error.message : 'Error al subir archivo')
    } finally {
      setUploading(false)
      setFiles([])
      setUploadProgress({})
    }
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <ImageIcon className="h-4 w-4" />
    }
    return <FileText className="h-4 w-4" />
  }

  return (
    <div className="space-y-4">
      {/* Área de selección de archivos */}
      <div 
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
        <p className="text-sm text-gray-600">
          Haz clic para seleccionar archivo(s) o arrastra aquí
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Máximo {maxFiles} archivo(s), {MAX_FILE_SIZE_MB}MB cada uno
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple={maxFiles > 1}
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Lista de archivos seleccionados */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Archivos seleccionados:</h4>
          {files.map((file, index) => (
            <Card key={index}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getFileIcon(file)}
                    <div>
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {uploadProgress[file.name] !== undefined && (
                      <div className="w-20">
                        <Progress value={uploadProgress[file.name]} className="h-2" />
                      </div>
                    )}
                    
                    {!uploading && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Botón de subida */}
      {files.length > 0 && (
        <Button 
          onClick={handleUpload} 
          disabled={uploading}
          className="w-full"
        >
          {uploading ? 'Subiendo...' : `Subir ${files.length} archivo(s)`}
        </Button>
      )}

      {/* Archivos subidos exitosamente */}
      {uploadedUrls.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-green-600 flex items-center">
            <CheckCircle className="h-4 w-4 mr-1" />
            Archivos subidos exitosamente:
          </h4>
          {uploadedUrls.map((url, index) => (
            <div key={index} className="text-xs text-gray-500 break-all">
              {url}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

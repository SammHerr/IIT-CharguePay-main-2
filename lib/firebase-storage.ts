import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject, 
  listAll,
  uploadBytesResumable,
  UploadTaskSnapshot 
} from 'firebase/storage'
import { storage } from './firebase-config'

export interface UploadProgress {
  progress: number
  snapshot: UploadTaskSnapshot
}

export class FirebaseStorageService {
  
  /**
   * Subir archivo de alumno (foto, documentos)
   */
  static async uploadStudentFile(
    studentId: string, 
    file: File, 
    type: 'photo' | 'document',
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    try {
      const fileName = `${Date.now()}_${file.name}`
      const filePath = `students/${studentId}/${type}s/${fileName}`
      const storageRef = ref(storage, filePath)
      
      if (onProgress) {
        // Upload con progreso
        const uploadTask = uploadBytesResumable(storageRef, file)
        
        return new Promise((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
              onProgress({ progress, snapshot })
            },
            (error) => reject(error),
            async () => {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
              resolve(downloadURL)
            }
          )
        })
      } else {
        // Upload simple
        const snapshot = await uploadBytes(storageRef, file)
        return await getDownloadURL(snapshot.ref)
      }
    } catch (error) {
      console.error('Error uploading student file:', error)
      throw new Error('Error al subir el archivo del alumno')
    }
  }

  /**
   * Subir comprobante de pago
   */
  static async uploadPaymentReceipt(
    paymentId: string,
    file: File,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    try {
      const fileName = `receipt_${paymentId}_${Date.now()}.${file.name.split('.').pop()}`
      const filePath = `payments/receipts/${fileName}`
      const storageRef = ref(storage, filePath)
      
      if (onProgress) {
        const uploadTask = uploadBytesResumable(storageRef, file)
        
        return new Promise((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
              onProgress({ progress, snapshot })
            },
            (error) => reject(error),
            async () => {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
              resolve(downloadURL)
            }
          )
        })
      } else {
        const snapshot = await uploadBytes(storageRef, file)
        return await getDownloadURL(snapshot.ref)
      }
    } catch (error) {
      console.error('Error uploading payment receipt:', error)
      throw new Error('Error al subir el comprobante de pago')
    }
  }

  /**
   * Subir respaldo de base de datos
   */
  static async uploadDatabaseBackup(
    backupFile: Blob,
    timestamp: string
  ): Promise<string> {
    try {
      const fileName = `backup_${timestamp}.sql`
      const filePath = `backups/database/${fileName}`
      const storageRef = ref(storage, filePath)
      
      const snapshot = await uploadBytes(storageRef, backupFile)
      return await getDownloadURL(snapshot.ref)
    } catch (error) {
      console.error('Error uploading database backup:', error)
      throw new Error('Error al subir el respaldo de la base de datos')
    }
  }

  /**
   * Eliminar archivo
   */
  static async deleteFile(fileUrl: string): Promise<void> {
    try {
      const storageRef = ref(storage, fileUrl)
      await deleteObject(storageRef)
    } catch (error) {
      console.error('Error deleting file:', error)
      throw new Error('Error al eliminar el archivo')
    }
  }

  /**
   * Listar archivos de un alumno
   */
  static async listStudentFiles(
    studentId: string, 
    type: 'photo' | 'document'
  ): Promise<string[]> {
    try {
      const folderPath = `students/${studentId}/${type}s/`
      const folderRef = ref(storage, folderPath)
      const result = await listAll(folderRef)
      
      const urls = await Promise.all(
        result.items.map(item => getDownloadURL(item))
      )
      
      return urls
    } catch (error) {
      console.error('Error listing student files:', error)
      return []
    }
  }

  /**
   * Obtener URL de descarga
   */
  static async getDownloadUrl(filePath: string): Promise<string> {
    try {
      const storageRef = ref(storage, filePath)
      return await getDownloadURL(storageRef)
    } catch (error) {
      console.error('Error getting download URL:', error)
      throw new Error('Error al obtener la URL de descarga')
    }
  }

  /**
   * Validar tipo de archivo
   */
  static validateFileType(file: File, allowedTypes: string[]): boolean {
    return allowedTypes.includes(file.type)
  }

  /**
   * Validar tamaño de archivo (en MB)
   */
  static validateFileSize(file: File, maxSizeMB: number): boolean {
    const maxSizeBytes = maxSizeMB * 1024 * 1024
    return file.size <= maxSizeBytes
  }

  /**
   * Comprimir imagen antes de subir
   */
  static async compressImage(file: File, maxWidth: number = 800, quality: number = 0.8): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      const img = new Image()
      
      img.onload = () => {
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height)
        canvas.width = img.width * ratio
        canvas.height = img.height * ratio
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        
        canvas.toBlob((blob) => {
          const compressedFile = new File([blob!], file.name, {
            type: file.type,
            lastModified: Date.now()
          })
          resolve(compressedFile)
        }, file.type, quality)
      }
      
      img.src = URL.createObjectURL(file)
    })
  }
}

// Tipos de archivos permitidos
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'image/jpeg', 'image/png']
export const MAX_FILE_SIZE_MB = 5
export const MAX_IMAGE_SIZE_MB = 2

// hooks/use-form-draft.ts
"use client"

import { useCallback, useEffect, useState } from 'react'
import { useCache } from '@/components/cache-provider'

interface UseFormDraftOptions {
  formType: string
  autoSave?: boolean
  autoSaveDelay?: number
}

interface FormDraftHook {
  draft: Record<string, any> | null
  saveDraft: (data: Record<string, any>) => void
  clearDraft: () => void
  hasDraft: boolean
  isAutoSaving: boolean
}

export function useFormDraft({
  formType,
  autoSave = true,
  autoSaveDelay = 1000
}: UseFormDraftOptions): FormDraftHook {
  const { saveFormDraft, getFormDraft, clearFormDraft } = useCache()
  const [draft, setDraft] = useState<Record<string, any> | null>(null)
  const [isAutoSaving, setIsAutoSaving] = useState(false)
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null)

  // Load draft on mount
  useEffect(() => {
    const savedDraft = getFormDraft(formType)
    setDraft(savedDraft)
  }, [formType, getFormDraft])

  const saveDraft = useCallback((data: Record<string, any>) => {
    // Filter out empty values
    const filteredData = Object.entries(data).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        acc[key] = value
      }
      return acc
    }, {} as Record<string, any>)

    // Only save if there's meaningful data
    if (Object.keys(filteredData).length > 0) {
      saveFormDraft(formType, filteredData)
      setDraft(filteredData)
    }
  }, [formType, saveFormDraft])

  const clearDraft = useCallback(() => {
    clearFormDraft(formType)
    setDraft(null)
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout)
      setAutoSaveTimeout(null)
    }
  }, [formType, clearFormDraft, autoSaveTimeout])

  const autoSaveDraft = useCallback((data: Record<string, any>) => {
    if (!autoSave) return

    setIsAutoSaving(true)
    
    // Clear existing timeout
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout)
    }

    // Set new timeout
    const timeout = setTimeout(() => {
      saveDraft(data)
      setIsAutoSaving(false)
    }, autoSaveDelay)

    setAutoSaveTimeout(timeout)
  }, [autoSave, autoSaveDelay, autoSaveTimeout, saveDraft])

  return {
    draft,
    saveDraft: autoSave ? autoSaveDraft : saveDraft,
    clearDraft,
    hasDraft: draft !== null && Object.keys(draft).length > 0,
    isAutoSaving
  }
}
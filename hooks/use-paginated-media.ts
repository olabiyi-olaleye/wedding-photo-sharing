import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { MediaItem } from '@/lib/types'

const ITEMS_PER_PAGE = 24

export function usePaginatedMedia() {
  const [media, setMedia] = useState<MediaItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)

  const supabase = createClient()

  // Initial load
  useEffect(() => {
    fetchPage(0)
  }, [])

  const fetchPage = useCallback(async (pageNum: number) => {
    setIsLoading(true)
    const from = pageNum * ITEMS_PER_PAGE
    const to = from + ITEMS_PER_PAGE - 1

    const { data, error } = await supabase
      .from('media')
      .select('*')
      .is('deleted_at', null)
      .order('uploaded_at', { ascending: false })
      .range(from, to)

    if (!error && data) {
      if (pageNum === 0) {
        setMedia(data as MediaItem[])
      } else {
        setMedia((prev: MediaItem[]) => [...prev, ...(data as MediaItem[])])
      }
      setHasMore(data.length === ITEMS_PER_PAGE)
    }
    setIsLoading(false)
  }, [supabase])

  const loadMore = useCallback(async () => {
    const nextPage = page + 1
    await fetchPage(nextPage)
    setPage(nextPage)
  }, [page, fetchPage])

  return {
    media,
    isLoading,
    hasMore,
    loadMore,
  }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function usePaginatedGuestMedia(guestId: string) {
  const [media, setMedia] = useState<MediaItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)

  const supabase = createClient()
  const isToken = UUID_RE.test(guestId)

  // Initial load
  useEffect(() => {
    fetchPage(0)
  }, [guestId])

  const fetchPage = useCallback(
    async (pageNum: number) => {
      setIsLoading(true)
      const from = pageNum * ITEMS_PER_PAGE
      const to = from + ITEMS_PER_PAGE - 1

      const query = supabase
        .from('media')
        .select('*')
        .is('deleted_at', null)
        .order('uploaded_at', { ascending: false })
        .range(from, to)

      const { data, error } = await (
        isToken
          ? query.eq('guest_token', guestId)
          : query.eq('uploaded_by', guestId)
      )

      if (!error && data) {
        if (pageNum === 0) {
          setMedia(data as MediaItem[])
        } else {
          setMedia((prev: MediaItem[]) => [...prev, ...(data as MediaItem[])])
        }
        setHasMore(data.length === ITEMS_PER_PAGE)
      }
      setIsLoading(false)
    },
    [guestId, supabase, isToken]
  )

  const loadMore = useCallback(async () => {
    const nextPage = page + 1
    await fetchPage(nextPage)
    setPage(nextPage)
  }, [page, fetchPage])

  const removeMedia = useCallback((id: string) => {
    setMedia((prev) => prev.filter((item) => item.id !== id))
  }, [])

  return {
    media,
    isLoading,
    hasMore,
    loadMore,
    removeMedia,
  }
}

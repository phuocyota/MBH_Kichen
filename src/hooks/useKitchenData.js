import { useCallback, useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { api, allPages } from '../api/kitchenApi'
import { useAuth } from '../auth/authContext'
export function useKitchenData(resource, query = {}, enabled = true) {
  const { branchId } = useAuth()
  const key = JSON.stringify(query)
  const scope = `${resource}:${key}:${branchId}`
  const [result, setResult] = useState({}),
    active = useRef(null)
  const reload = useCallback(async () => {
    if (!branchId || !enabled) return
    active.current?.abort()
    const controller = new AbortController()
    active.current = controller
    setResult((r) => ({
      ...(r.scope === scope ? r : {}),
      scope,
      loading: true,
    }))
    try {
      const data = await api.list(
        resource,
        { ...JSON.parse(key), branchId },
        controller.signal,
      )
      if (!controller.signal.aborted)
        setResult({ scope, data, error: '', loading: false })
    } catch (e) {
      if (!controller.signal.aborted)
        setResult({
          scope,
          error:
            e.status === 403
              ? 'Bạn không có quyền thực hiện thao tác này'
              : e.message,
          loading: false,
        })
    }
  }, [resource, key, branchId, enabled, scope])
  useEffect(() => {
    if (!branchId || !enabled) return
    let disposed = false
    queueMicrotask(() => {
      if (!disposed) reload()
    })
    window.addEventListener('kitchen:reload', reload)
    return () => {
      disposed = true
      active.current?.abort()
      window.removeEventListener('kitchen:reload', reload)
    }
  }, [reload, branchId, enabled])
  return {
    data: enabled && result.scope === scope ? result.data : null,
    error: enabled && result.scope === scope ? result.error : '',
    loading:
      Boolean(enabled && branchId) &&
      (result.scope === scope ? result.loading : true),
    reload,
  }
}
export function useKitchenChoices(resource, query = {}, enabled = true) {
  const { branchId } = useAuth(),
    key = JSON.stringify(query),
    [result, setResult] = useState({})
  const scope = `${resource}:${key}:${branchId}`
  useEffect(() => {
    if (!enabled || !branchId) return
    let controller
    const reload = () => {
      controller?.abort()
      const current = new AbortController()
      controller = current
      allPages(resource, { ...JSON.parse(key), branchId }, current.signal)
        .then((data) => {
          if (!current.signal.aborted) setResult({ scope, data })
        })
        .catch((e) => {
          if (!current.signal.aborted) setResult({ scope, error: e.message })
        })
    }
    reload()
    window.addEventListener('kitchen:reload', reload)
    return () => {
      controller?.abort()
      window.removeEventListener('kitchen:reload', reload)
    }
  }, [resource, key, branchId, scope, enabled])
  return enabled && result.scope === scope ? result : { data: [] }
}
export function useKitchenSocket() {
  const { session } = useAuth()
  useEffect(() => {
    if (!session?.branchId) return
    const socketUrl =
      import.meta.env.VITE_SOCKET_URL ||
      new URL(import.meta.env.VITE_API_URL, window.location.origin).origin
    const socket = io(socketUrl, {
      auth: { token: session.accessToken },
    })
    const refresh = () => window.dispatchEvent(new Event('kitchen:reload'))
    const events = [
      'connect',
      'kitchen:ticket.created',
      'kitchen:ticket.updated',
      'kitchen:batch.updated',
      'kitchen:meal-plan.locked',
      'kitchen:consumption.updated',
      'dashboard:updated',
    ]
    events.forEach((event) => socket.on(event, refresh))
    return () => {
      events.forEach((event) => socket.off(event, refresh))
      socket.disconnect()
    }
  }, [session?.accessToken, session?.branchId])
}

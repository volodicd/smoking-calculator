import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { useUserStore } from '../store/userStore'

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export function useSocket() {
  const socketRef = useRef<Socket | null>(null)
  const { sessionId } = useUserStore()

  useEffect(() => {
    if (!sessionId) return

    // Initialize socket connection
    socketRef.current = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling']
    })

    const socket = socketRef.current

    socket.on('connect', () => {
      console.log('Connected to server')
      socket.emit('join-session', sessionId)
    })

    socket.on('disconnect', () => {
      console.log('Disconnected from server')
    })

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error)
    })

    return () => {
      socket.disconnect()
    }
  }, [sessionId])

  const on = (event: string, callback: (...args: any[]) => void) => {
    socketRef.current?.on(event, callback)
  }

  const off = (event: string, callback?: (...args: any[]) => void) => {
    socketRef.current?.off(event, callback)
  }

  return { on, off, socket: socketRef.current }
}
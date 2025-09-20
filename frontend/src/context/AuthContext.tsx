"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { useRouter } from "next/navigation"


const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

// A simple user type 
interface User {
  userID: string
  userRole: string
  username?: string
  email?: string 
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (data: any) => Promise<void> // Pass form data
  logout: () => Promise<void>
  register: (data: any) => Promise<void> // Pass form data
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Function to check if user is logged in
  const checkAuthStatus = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/me`, {
        method: "GET",
        // This tells fetch to send cookies from the browser
        credentials: "include", 
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data) // User is authenticated
      } else {
        setUser(null) // User is not authenticated
      }
    } catch (error) {
      console.error("Auth check failed:", error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  // Check auth status on initial load
  useEffect(() => {
    checkAuthStatus()
  }, [])

  // Login function
  const login = async (formData: any) => {
    const response = await fetch(`${API_BASE_URL}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
      credentials: "include", // Send credentials
    })
    
    const data = await response.json()
    
    if (!response.ok) {
        throw new Error(data.error || "Login failed")
    }

    // Login was successful, cookie is set.
    // Re-check auth status to get user data.
    await checkAuthStatus() 
    router.push("/") // Navigate to dashboard
  }

  // Register function
  const register = async (formData: any) => {
     const response = await fetch(`${API_BASE_URL}/api/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
      credentials: "include", 
    })
    
    const data = await response.json()
    
    if (!response.ok) {
        throw new Error(data.error || "Registration failed")
    }
    
    // On success, auto-login them or just show a message
    await checkAuthStatus() 
    router.push("/")
  }

  // Logout function
  const logout = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/logout`, {
        method: "POST",
        credentials: "include",
      })
    } catch (error) {
      console.error("Logout failed:", error)
    } finally {
      setUser(null) // Clear user state
      router.push("/auth") // Redirect to login
    }
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook to use the AuthContext
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
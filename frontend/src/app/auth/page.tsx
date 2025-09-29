"use client"

import type React from "react"

import { useState, useCallback, useMemo, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Lock, Mail, User, Shield } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/AuthContext"
import { useRouter } from "next/navigation"

/**
 * Form data interface for authentication
 */
interface AuthFormData {
  email: string
  password: string
  username?: string
}

/**
 * Form validation errors interface
 */
interface FormErrors {
  email?: string
  password?: string
  username?: string
  general?: string
}

/**
 * Authentication page component with login and signup functionality
 * Features:
 * - Toggle between login and signup modes
 * - Form validation with real-time feedback
 * - Password visibility toggle
 * - Responsive design with proper accessibility
 * - Memoized form handlers for performance
 */
export default function AuthPage() {
  const [isSignup, setIsSignup] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<AuthFormData>({
    email: "",
    password: "",
    username: "",
  })
  const [errors, setErrors] = useState<FormErrors>({})

  

  const { login, register, user, isLoading: isAuthLoading } = useAuth()
  const router = useRouter()

  // Redirect if already logged in
  useEffect(() => {
    if (!isAuthLoading && user) {
      router.push("/") // or your main app page
    }
  }, [user, isAuthLoading, router])

  /**
   * Validates form data and returns errors object
   * Memoized to prevent unnecessary recalculations
   */
  const validateForm = useCallback(
    (data: AuthFormData): FormErrors => {
      const newErrors: FormErrors = {}

      // Email validation
      if (!data.email) {
        newErrors.email = "Email is required"
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        newErrors.email = "Please enter a valid email address"
      }

      // Password validation
      if (!data.password) {
        newErrors.password = "Password is required"
      } else if (data.password.length < 8) {
        newErrors.password = "Password must be at least 8 characters long"
      }

      // Username validation for signup
      if (isSignup) {
        if (!data.username) {
          newErrors.username = "Username is required"
        } else if (data.username.length < 3) {
          newErrors.username = "Username must be at least 3 characters long"
        } else if (!/^[a-zA-Z0-9_]+$/.test(data.username)) {
          newErrors.username = "Username can only contain letters, numbers, and underscores"
        }
      }

      return newErrors
    },
    [isSignup],
  )

  /**
   * Handles input field changes with validation
   * Memoized to prevent unnecessary re-renders
   */
  const handleInputChange = useCallback(
    (field: keyof AuthFormData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }))

      // Clear field-specific error when user starts typing
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }))
      }
    },
    [errors],
  )

   /**
   * Toggles between login and signup modes
   * Clears form data and errors when switching
   */
  const toggleMode = useCallback(() => {
    setIsSignup((prev) => !prev)
    setFormData({ email: "", password: "", username: "" })
    setErrors({})
    setShowPassword(false)
  }, [])

  /**
   * Handles form submission for both login and signup
   * Includes validation and API call simulation
   */
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      const formErrors = validateForm(formData)
      if (Object.keys(formErrors).length > 0) {
        setErrors(formErrors)
        return
      }

      setIsLoading(true)
      setErrors({})

      console.log("issignup" , isSignup);
      

      try {
        if (isSignup) {
          // --- Call Register from context ---
          await register({
            email: formData.email,
            password: formData.password,
            username: formData.username,
          })
          router.push("/")
          toggleMode()
        } else {
          // --- Call Login from context ---
          await login({
            email: formData.email,
            password: formData.password,
          })
          // On success, the context handles the redirect
        }
      } catch (error: any) {
        console.error("[v0] Auth error:", error)
        setErrors({ general: error.message || "Authentication failed. Please try again." })
      } finally {
        setIsLoading(false)
      }
    },
    [formData, validateForm, isSignup, login, register,toggleMode],
  )

 

  

  /**
   * Memoized form validation state
   */
  const isFormValid = useMemo(() => {
    const formErrors = validateForm(formData)
    return Object.keys(formErrors).length === 0 && formData.email && formData.password
  }, [formData, validateForm])

  if (isAuthLoading || user) {
     return (
        <div className="min-h-screen flex items-center justify-center">
           {/* You can put a full-page loader here */}
           <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
     )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-2">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">SecureVault</h1>
          </div>
          <p className="text-muted-foreground">{isSignup ? "Create your account" : "Welcome back"}</p>
        </div>

        <Card className="shadow-lg border-border/50">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl font-semibold">{isSignup ? "Sign Up" : "Sign In"}</CardTitle>
            <CardDescription>
              {isSignup ? "Enter your details to create a new account" : "Enter your credentials to access your vault"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {errors.general && (
              <Alert variant="destructive">
                <AlertDescription>{errors.general}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignup && (
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium">
                    Username
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="username"
                      type="text"
                      placeholder="Enter your username"
                      value={formData.username || ""}
                      onChange={(e) => handleInputChange("username", e.target.value)}
                      className={cn("pl-10", errors.username && "border-destructive focus-visible:ring-destructive")}
                      disabled={isLoading}
                      autoComplete="username"
                    />
                  </div>
                  {errors.username && <p className="text-sm text-destructive">{errors.username}</p>}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className={cn("pl-10", errors.email && "border-destructive focus-visible:ring-destructive")}
                    disabled={isLoading}
                    autoComplete="email"
                  />
                </div>
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className={cn(
                      "pl-10 pr-10",
                      errors.password && "border-destructive focus-visible:ring-destructive",
                    )}
                    disabled={isLoading}
                    autoComplete={isSignup ? "new-password" : "current-password"}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading || !isFormValid}>
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    <span>{isSignup ? "Creating Account..." : "Signing In..."}</span>
                  </div>
                ) : isSignup ? (
                  "Create Account"
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <div className="space-y-4">
              <Separator />
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  {isSignup ? "Already have an account?" : "Don't have an account?"}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full bg-transparent"
                  onClick={toggleMode}
                  disabled={isLoading}
                >
                  {isSignup ? "Sign In Instead" : "Create New Account"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-xs text-muted-foreground">
          <p>By continuing, you agree to our Terms of Service and Privacy Policy</p>
        </div>
      </div>
    </div>
  )
}

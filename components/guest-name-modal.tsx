"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Heart } from "lucide-react"

interface GuestNameModalProps {
  onSubmit: (name: string) => void
}

export function GuestNameModal({ onSubmit }: GuestNameModalProps) {
  const [name, setName] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedName = name.trim()
    
    if (!trimmedName) {
      setError("Please enter your name")
      return
    }
    
    if (trimmedName.length < 2) {
      setError("Name must be at least 2 characters")
      return
    }
    
    onSubmit(trimmedName)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <Card className="w-full max-w-md border-primary/20 shadow-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Heart className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-serif">Welcome to Our Wedding</CardTitle>
          <CardDescription className="text-base">
            Please enter your name to share photos from our special day
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setError("")
                }}
                className="text-center text-lg h-12"
                autoFocus
              />
              {error && (
                <p className="text-sm text-destructive text-center">{error}</p>
              )}
            </div>
            <Button type="submit" className="w-full h-12 text-base">
              Continue
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

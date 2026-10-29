"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  UserPlus,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  Camera,
  Loader2,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import {
  getGuestsWithStatus,
  addGuest,
  deleteGuest,
  updateGuestRsvp,
  type Guest,
  type RSVPStatus,
} from "@/app/actions/rsvp-management"

function getGuestStats(guests: Guest[]) {
  const total = guests.length
  const accepted = guests.filter((g) => g.rsvp_status === 'accepted').length
  const declined = guests.filter((g) => g.rsvp_status === 'declined').length
  const withPhotos = guests.filter((g) => g.uploaded).length
  return { total, accepted, declined, pending: total - accepted - declined, withPhotos }
}

const STATUS_CONFIG: Record<RSVPStatus, { label: string; icon: React.ReactNode; color: string }> = {
  accepted: {
    label: "Accepted",
    icon: <CheckCircle2 className="h-4 w-4" />,
    color: "text-success",
  },
  declined: {
    label: "Declined",
    icon: <XCircle className="h-4 w-4" />,
    color: "text-destructive",
  },
  pending: {
    label: "Pending",
    icon: <Clock className="h-4 w-4" />,
    color: "text-warning",
  },
}

export default function AdminGuestsPage() {
  const router = useRouter()
  const [guests, setGuests] = useState<Guest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newName, setNewName] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [isPending, startTransition] = useTransition()
  const [guestToDelete, setGuestToDelete] = useState<Guest | null>(null)

  useEffect(() => {
    loadGuests()
  }, [])

  const loadGuests = async () => {
    setIsLoading(true)
    const { guests: data, error } = await getGuestsWithStatus()
    if (error === "Unauthorized") {
      router.push("/admin/login")
      return
    }
    setGuests(data)
    setIsLoading(false)
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    startTransition(async () => {
      const result = await addGuest(newName.trim(), newEmail.trim() || undefined)
      if (result.success) {
        setNewName("")
        setNewEmail("")
        await loadGuests()
        toast.success("Guest added", { description: `${newName.trim()} has been added to the list.` })
      } else {
        toast.error("Failed to add guest", { description: result.error || "Please try again." })
      }
    })
  }

  const handleDeleteConfirm = () => {
    if (!guestToDelete) return
    const name = guestToDelete.name
    startTransition(async () => {
      const result = await deleteGuest(guestToDelete.id)
      setGuestToDelete(null)
      if (result.success) {
        setGuests((prev) => prev.filter((g) => g.id !== guestToDelete.id))
        toast.success("Guest removed", { description: `${name} has been removed from the list.` })
      } else {
        toast.error("Failed to remove guest", { description: result.error || "Please try again." })
      }
    })
  }

  const handleRsvpChange = async (guest: Guest, status: RSVPStatus) => {
    startTransition(async () => {
      const result = await updateGuestRsvp(guest.id, status)
      if (result.success) {
        setGuests((prev) =>
          prev.map((g) => (g.id === guest.id ? { ...g, rsvp_status: status } : g))
        )
      } else {
        toast.error("Failed to update RSVP", { description: result.error || "Please try again." })
      }
    })
  }

  const stats = getGuestStats(guests)

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="font-serif text-lg text-muted-foreground">Loading guests...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center gap-4 px-4">
          <Link href="/admin">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="font-serif text-xl font-semibold">Guest List</h1>
        </div>
      </header>

      <main className="container mx-auto max-w-4xl px-4 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-3xl font-bold text-foreground">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-medium text-muted-foreground">Accepted</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-3xl font-bold text-success">{stats.accepted}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-medium text-muted-foreground">Declined</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-3xl font-bold text-destructive">{stats.declined}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm font-medium text-muted-foreground">Uploaded</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-3xl font-bold text-primary">
                {stats.withPhotos}
                <span className="text-base font-normal text-muted-foreground ml-1">/ {stats.total}</span>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Add Guest Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserPlus className="h-4 w-4" />
              Add Guest
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="flex flex-col gap-3 sm:flex-row">
              <div className="flex-1 space-y-1">
                <Label htmlFor="guest-name" className="sr-only">Name</Label>
                <Input
                  id="guest-name"
                  placeholder="Guest name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                />
              </div>
              <div className="flex-1 space-y-1">
                <Label htmlFor="guest-email" className="sr-only">Email (optional)</Label>
                <Input
                  id="guest-email"
                  type="email"
                  placeholder="Email (optional)"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={isPending || !newName.trim()} className="gap-2 shrink-0">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                Add
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Guest List */}
        {guests.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card/50 py-16 text-center">
            <Users className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="font-serif text-xl font-semibold text-foreground">No guests yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">Add guests above to start tracking RSVPs.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {guests.map((guest) => {
              const statusCfg = STATUS_CONFIG[guest.rsvp_status]
              return (
                <div
                  key={guest.id}
                  className="flex items-center gap-3 rounded-2xl bg-card px-4 py-3 ring-1 ring-border/50"
                >
                  {/* Avatar */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {guest.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                  </div>

                  {/* Name + email */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">{guest.name}</p>
                    {guest.email && (
                      <p className="truncate text-xs text-muted-foreground">{guest.email}</p>
                    )}
                  </div>

                  {/* Upload badge */}
                  {guest.uploaded && (
                    <span className="hidden shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary sm:flex">
                      <Camera className="h-3 w-3" />
                      Uploaded
                    </span>
                  )}

                  {/* RSVP status selector */}
                  <div className={`flex shrink-0 items-center gap-1 text-sm font-medium ${statusCfg.color}`}>
                    {statusCfg.icon}
                    <select
                      value={guest.rsvp_status}
                      onChange={(e) => handleRsvpChange(guest, e.target.value as RSVPStatus)}
                      disabled={isPending}
                      className="bg-transparent text-sm font-medium focus:outline-none cursor-pointer"
                      aria-label="RSVP status"
                    >
                      <option value="pending">Pending</option>
                      <option value="accepted">Accepted</option>
                      <option value="declined">Declined</option>
                    </select>
                  </div>

                  {/* Delete */}
                  <button
                    onClick={() => setGuestToDelete(guest)}
                    disabled={isPending}
                    className="shrink-0 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
                    aria-label={`Remove ${guest.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!guestToDelete} onOpenChange={(open) => { if (!open) setGuestToDelete(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {guestToDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove them from the guest list. Their uploaded photos will
              not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? "Removing…" : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

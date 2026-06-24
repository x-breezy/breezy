import { SanctionedUser, CreateUserPayload, createUser } from "@/lib/actions/users"
import { IconAlertTriangle } from "@tabler/icons-react"
import { useTranslations } from "next-intl"
import { useTransition, useState } from "react"
import { DialogContent, DialogHeader, DialogFooter, Dialog, DialogTitle } from "../ui/dialog"
import { Label } from "../ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Input } from "../ui/input"
import { Button } from "../ui/button"

interface AddUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (user: SanctionedUser) => void
}

export default function AddUserDialog({ open, onOpenChange, onCreated }: AddUserDialogProps) {
  const t = useTranslations("moderationPage")
  const [isPending, startTransition] = useTransition()
  const [formError, setFormError] = useState<string | null>(null)
  const [form, setForm] = useState<CreateUserPayload>({
    username: "",
    email: "",
    password: "",
    role: "user",
  })

  function handleChange(field: keyof CreateUserPayload, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    startTransition(async () => {
      try {
        const user = await createUser(form)
        onCreated(user)
        setForm({ username: "", email: "", password: "", role: "user" })
      } catch (err) {
        setFormError(
          err instanceof Error ? err.message : t("createUserFailed")
        )
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("addUser")}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
          {formError && (
            <div className='flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive'>
              <IconAlertTriangle size={15} />
              {formError}
            </div>
          )}

          <div className='flex flex-col gap-1.5'>
            <Label htmlFor='add-username'>{t("username")}</Label>
            <Input
              id='add-username'
              placeholder='johndoe'
              value={form.username}
              onChange={(e) => handleChange("username", e.target.value)}
              required
            />
          </div>

          <div className='flex flex-col gap-1.5'>
            <Label htmlFor='add-email'>{t("email")}</Label>
            <Input
              id='add-email'
              type='email'
              placeholder='john@example.com'
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              required
            />
          </div>

          <div className='flex flex-col gap-1.5'>
            <Label htmlFor='add-password'>{t("password")}</Label>
            <Input
              id='add-password'
              type='password'
              placeholder='••••••••'
              value={form.password}
              onChange={(e) => handleChange("password", e.target.value)}
              required
            />
          </div>

          <div className='flex flex-col gap-1.5'>
            <Label htmlFor='add-role'>{t("role")}</Label>
            <Select
              value={form.role}
              onValueChange={(value) => handleChange("role", value ?? "user")}
            >
              <SelectTrigger id='add-role' className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='user'>{t("roleUser")}</SelectItem>
                <SelectItem value='moderator'>{t("roleModerator")}</SelectItem>
                <SelectItem value='admin'>{t("roleAdmin")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter showCloseButton>
            <Button type='submit' disabled={isPending}>
              {isPending ? t("creating") : t("createUser")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

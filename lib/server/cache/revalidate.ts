import "@/lib/server/only"

import { revalidatePath, revalidateTag } from "next/cache"

type RevalidateProfile = "default" | "seconds" | "minutes" | "hours" | "days" | "weeks" | "max"

export function invalidateTag(tag: string, profile: RevalidateProfile = "max") {
  revalidateTag(tag, profile)
}

export function invalidatePath(path: string) {
  revalidatePath(path)
}


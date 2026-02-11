import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { hash, compare } from "bcryptjs"
import { NextResponse } from "next/server"
import { z } from "zod"

const profileSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
})

const passwordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(6),
})

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()

    // Check if it's a password change
    if (body.currentPassword && body.newPassword) {
      const validatedData = passwordSchema.parse(body)

      // Get current user
      const user = await db.user.findUnique({
        where: { id: session.user.id },
      })

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      // Verify current password
      const isValid = await compare(validatedData.currentPassword, user.password)
      if (!isValid) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 400 }
        )
      }

      // Hash new password
      const hashedPassword = await hash(validatedData.newPassword, 10)

      // Update password
      await db.user.update({
        where: { id: session.user.id },
        data: { password: hashedPassword },
      })

      return NextResponse.json({ message: "Password updated successfully" })
    } else {
      // Profile update
      const validatedData = profileSchema.parse(body)

      // Check if email is already taken by another user
      const existingUser = await db.user.findFirst({
        where: {
          email: validatedData.email,
          NOT: { id: session.user.id },
        },
      })

      if (existingUser) {
        return NextResponse.json(
          { error: "Email already in use" },
          { status: 400 }
        )
      }

      const user = await db.user.update({
        where: { id: session.user.id },
        data: validatedData,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
        },
      })

      return NextResponse.json(user)
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    )
  }
}
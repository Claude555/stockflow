import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const categories = await db.category.findMany({
    orderBy: { name: "asc" },
  })

  return NextResponse.json(categories)
}
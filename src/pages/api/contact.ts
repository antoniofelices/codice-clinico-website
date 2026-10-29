export const prerender = false

import type { APIRoute } from "astro"
import { env } from "cloudflare:workers"
import { z } from "zod"

const ContactSchema = z.object({
  firstname: z.string().trim().min(1).max(100),
  lastname: z.string().trim().min(1).max(100),
  email: z.email().max(254),
  phone: z.string().trim().max(30).optional(),
  practice_type: z.string().trim().min(1).max(100),
})

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

export const POST: APIRoute = async ({ request }) => {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return json({ error: "Invalid form data" }, 400)
  }

  const parsed = ContactSchema.safeParse(body)
  if (!parsed.success) return json({ error: "Invalid form data" }, 400)

  const { phone, ...rest } = parsed.data
  const properties: Record<string, string> = {
    ...rest,
    lead_source: "website-codice-clinico",
  }
  if (phone) properties.phone = phone

  const hubspotRes = await fetch(
    "https://api.hubapi.com/crm/v3/objects/contacts",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.HUBSPOT_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ properties }),
    },
  )

  if (hubspotRes.status === 409)
    return json({ success: true, existing: true }, 200)

  if (!hubspotRes.ok) {
    console.error("HubSpot error:", await hubspotRes.text())
    return json({ error: "CRM error" }, 502)
  }

  return json({ success: true }, 200)
}

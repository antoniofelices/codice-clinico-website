export const prerender = false

import type { APIRoute } from "astro"
import { env } from "cloudflare:workers"

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  })
}

export const OPTIONS: APIRoute = () =>
  new Response(null, { status: 204, headers: CORS })

export const ALL: APIRoute = async (context) => {
  if (context.request.method !== "POST")
    return json({ error: "Method not allowed" }, 405)

  let body: Record<string, string>
  try {
    body = await context.request.json()
  } catch {
    return json({ error: "Invalid form data" }, 400)
  }

  const { firstname, lastname, email, phone, practice_type } = body

  if (
    !firstname?.trim() ||
    !lastname?.trim() ||
    !email?.includes("@") ||
    !practice_type?.trim()
  ) {
    return json({ error: "Invalid form data" }, 400)
  }

  const properties: Record<string, string> = {
    firstname,
    lastname,
    email,
    practice_type,
    lead_source: "website-codice-clinico",
  }
  if (phone?.trim()) properties.phone = phone

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

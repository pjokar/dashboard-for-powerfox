import { NextRequest, NextResponse } from "next/server"

const POWERFOX_API_BASE = "https://backend.powerfox.energy/api/2.0/my"

export async function POST(request: NextRequest) {
  try {
    const { email, password, endpoint, params } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      )
    }

    const authHeader = `Basic ${Buffer.from(`${email}:${password}`).toString("base64")}`

    let url = `${POWERFOX_API_BASE}/${endpoint}`
    if (params) {
      const queryParams = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== 0) {
          queryParams.append(key, String(value))
        }
      })
      const queryString = queryParams.toString()
      if (queryString) {
        url += `?${queryString}`
      }
    }

    const response = await fetch(url, {
      headers: {
        Authorization: authHeader,
        Accept: "application/json",
      },
    })

    if (!response.ok) {
      if (response.status === 401) {
        return NextResponse.json(
          { error: "Invalid credentials" },
          { status: 401 }
        )
      }
      if (response.status === 412) {
        return NextResponse.json(
          { error: "Data transmission has been refused by the customer" },
          { status: 412 }
        )
      }
      if (response.status === 429) {
        return NextResponse.json(
          { error: "Too many requests. Please wait and try again." },
          { status: 429 }
        )
      }
      return NextResponse.json(
        { error: `API error: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Powerfox API error:", error)
    return NextResponse.json(
      { error: "Failed to fetch data from Powerfox" },
      { status: 500 }
    )
  }
}

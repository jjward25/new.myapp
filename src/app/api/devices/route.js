import { NextResponse } from "next/server"
import { listDevices, revokeDevice } from "@/utils/mongoDB/pairedDevicesCRUD"
import { verifyDeviceCookie, DEVICE_COOKIE } from "@/utils/deviceAuth"

// List the paired devices (settings-page view -- one of the two revoke
// paths alongside replying "REVOKE" to a Signal notification, per Part C:
// not solely dependent on Signal's reliability).
export async function GET() {
  const devices = await listDevices()
  // Flag which row is THIS browser, if any, so the settings UI can mark it
  // "this device" rather than the owner guessing from the label alone.
  const secret = process.env.LOGIN_COOKIE_SECRET
  let thisDeviceId = null
  if (secret) {
    const cookieStore = (await import("next/headers")).cookies
    const jar = await cookieStore()
    const raw = jar.get(DEVICE_COOKIE)?.value
    const verified = raw ? await verifyDeviceCookie(raw, secret) : null
    thisDeviceId = verified?.deviceId || null
  }
  return NextResponse.json({ devices, thisDeviceId })
}

export async function DELETE(req) {
  const body = await req.json().catch(() => ({}))
  const deviceId = typeof body.deviceId === "string" ? body.deviceId : null
  if (!deviceId) {
    return NextResponse.json({ error: "deviceId required" }, { status: 400 })
  }
  const revoked = await revokeDevice(deviceId)
  if (!revoked) {
    return NextResponse.json({ error: "Device not found or already revoked" }, { status: 404 })
  }
  return NextResponse.json({ ok: true })
}

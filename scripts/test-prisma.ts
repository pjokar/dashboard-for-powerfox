/**
 * Test-Script um Prisma-Verbindung zu testen
 */

async function testPrisma() {
  try {
    console.log("🔍 Teste Prisma Import...")
    const { prisma } = await import("../lib/db")
    
    console.log("✅ Prisma erfolgreich importiert")
    
    console.log("\n🔍 Teste Datenbank-Verbindung...")
    const devices = await prisma.device.findMany()
    
    console.log("✅ Datenbank-Verbindung erfolgreich")
    console.log(`📊 Devices in DB: ${devices.length}`)
    
    if (devices.length > 0) {
      console.log("\nErste Device:")
      console.log(devices[0])
    }
  } catch (error) {
    console.error("❌ Fehler:", error)
    if (error instanceof Error) {
      console.error("Message:", error.message)
      console.error("Stack:", error.stack)
    }
  }
}

testPrisma()

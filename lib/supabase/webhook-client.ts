import { createClient } from "@/lib/db/server"

export function createWebhookClient() {
  return createClient()
}

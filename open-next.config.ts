import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Auditoría: configuración mínima. El cache incremental por defecto del
// adaptador se evaluará en runtime; para build/size basta el esqueleto.
export default defineCloudflareConfig({});

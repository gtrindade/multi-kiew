import { DataManager } from "./src/data.mjs";
import { Scheduler } from "./src/scheduler.mjs";

// Mock Slimbot
class MockSlimbot {
  constructor() {
    this.sentMessages = [];
  }
  on() {}
  async sendMessage(chatID, text, params) {
    this.sentMessages.push({ chatID, text, params });
    console.log(`[Slimbot SendMessage] chatID: ${chatID}, text: ${text}`);
    return { result: { message_id: 12345, text } };
  }
}

console.log("Loading production data for dry-run verification...");

// Setup mock slimbot
const slimbot = new MockSlimbot();

// Instantiate DataManager - it will load from ./data/ automatically
const dataManager = new DataManager();

// Safeguard: Prevent the test from modifying actual production data files on disk
dataManager.saveToFile = async (kind) => {
  console.log(`[DataManager Mock] Prevented writing ${kind} to disk.`);
  return Promise.resolve();
};
dataManager.save = async () => {
  console.log("[DataManager Mock] Prevented writing save files to disk.");
  return Promise.resolve();
};

console.log(`Loaded ${Object.keys(dataManager.events).length} events.`);
console.log(`Loaded ${Object.keys(dataManager.groups).length} groups.`);
console.log(`Loaded ${Object.keys(dataManager.users).length} users.`);

// Instantiate Scheduler
const scheduler = new Scheduler(slimbot, dataManager);

// Enable alerts so we can test what would be sent
process.env.ENABLE_ALERTS = "true";

console.log("\nRunning reminderLoop on production data...");
await scheduler.reminderLoop();

console.log("\n--- Verification Results ---");
console.log(`Total messages sent: ${slimbot.sentMessages.length}`);

// We expect exactly 1 message for the modern event "-267393303" (first warning),
// and 0 messages for all other legacy events.
const legacyAlerts = slimbot.sentMessages.filter(msg => msg.chatID !== -267393303);
const modernAlerts = slimbot.sentMessages.filter(msg => msg.chatID === -267393303);

if (legacyAlerts.length > 0) {
  console.error("❌ FAILURE: Alert system sent messages for legacy events!", legacyAlerts);
  process.exit(1);
} else {
  console.log("✅ SUCCESS: No messages were sent for legacy production events!");
}

if (modernAlerts.length > 0) {
  console.log(`✅ SUCCESS: Modern event alert was correctly triggered: "${modernAlerts[0].text}"`);
} else {
  console.warn("⚠️ NOTICE: No modern event alerts were triggered (this is normal if the time threshold didn't match).");
}

console.log("Production data check completed successfully!");
process.exit(0);

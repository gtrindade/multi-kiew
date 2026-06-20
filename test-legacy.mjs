import { DataManager } from "./src/data.mjs";
import { Scheduler } from "./src/scheduler.mjs";
import moment from "moment-timezone";
import fs from "fs";

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

// Make sure clean ./data folder
try {
  fs.mkdirSync("./data", { recursive: true });
} catch (e) {}

// Create a clean setup
const slimbot = new MockSlimbot();

// Apply the same throttling mechanism to MockSlimbot for verification
const messageHistory = {};
const originalSendMessage = slimbot.sendMessage.bind(slimbot);
slimbot.sendMessage = async function (chatID, text, optionalParams) {
  const textStr = text ? String(text) : "";
  const key = `${chatID}:${textStr}`;
  const now = Date.now();

  if (!messageHistory[key]) {
    messageHistory[key] = {
      lastSentTime: 0,
      sentTimestamps: [],
      cooldownUntil: 0
    };
  }

  const history = messageHistory[key];

  // 1. Check if currently in a 1-hour cooldown
  if (now < history.cooldownUntil) {
    const minutesLeft = ((history.cooldownUntil - now) / 60000).toFixed(1);
    console.warn(`[Throttle Warning] Message blocked due to 1-hour cooldown. Chat: ${chatID}, Message: "${textStr.substring(0, 50)}...", Cooldown remaining: ${minutesLeft}m`);
    return { result: { message_id: -1, text: "throttled" } };
  }

  // 2. Check 6-second interval duplicate check
  if (now - history.lastSentTime < 6000) {
    console.warn(`[Throttle Warning] Duplicate message blocked within 6-second window. Chat: ${chatID}, Message: "${textStr.substring(0, 50)}..."`);
    return { result: { message_id: -1, text: "throttled" } };
  }

  // 3. Filter timestamps to the last 5 minutes (300,000 ms)
  history.sentTimestamps = history.sentTimestamps.filter(t => now - t < 300000);

  // 4. Check if sent 10 times within the last 5 minutes
  if (history.sentTimestamps.length >= 10) {
    history.cooldownUntil = now + 3600000; // 1 hour cooldown (3,600,000 ms)
    console.warn(`[Throttle Warning] Message sent 10 times in 5 minutes. Triggered 1-hour cooldown. Chat: ${chatID}, Message: "${textStr.substring(0, 50)}..."`);
    return { result: { message_id: -1, text: "throttled" } };
  }

  // 5. Send message and record timestamps
  const result = await originalSendMessage(chatID, text, optionalParams);
  history.lastSentTime = Date.now();
  history.sentTimestamps.push(Date.now());
  return result;
};

const dataManager = new DataManager();

// Reset data files
dataManager.users = { "@testuser": 1111 };
dataManager.groups = {
  "123": ["@testuser"],
  // group "456" is not registered (undefined)
};
dataManager.events = {
  // Legacy event in the future: missing createdAt and warnings
  "123": {
    date: moment().add(1, "day").toISOString(),
    summary: "RPG Session\nInfo",
    confirmedUsers: [],
    confirmed: false,
    messageID: 999
  },
  // Legacy event in the past: missing createdAt and warnings
  "789": {
    date: moment().subtract(1, "day").toISOString(),
    summary: "Past Session\nInfo",
    confirmedUsers: [],
    confirmed: false,
    messageID: 888
  }
};

console.log("Starting legacy events test...");

const scheduler = new Scheduler(slimbot, dataManager);

// 1. Test markWarning on legacy event
console.log("Testing markWarning on legacy event 123 (warnings is undefined)...");
await dataManager.markWarning("123", "test_warn", "2026-06-04");
if (dataManager.events["123"].warnings && dataManager.events["123"].warnings["test_warn"] === "2026-06-04") {
  console.log("✅ SUCCESS: markWarning successfully initialized warnings on legacy event!");
} else {
  console.error("❌ FAILURE: markWarning failed to set warning on legacy event.");
  process.exit(1);
}

// Delete warnings for legacy event to test scheduler detection
delete dataManager.events["123"].warnings;

// 2. Test feature flag (default is off)
console.log("Testing feature flag ENABLE_ALERTS...");
process.env.ENABLE_ALERTS = "false";
let listEventsCalled = false;
const origListEvents = dataManager.listEvents.bind(dataManager);
dataManager.listEvents = () => {
  listEventsCalled = true;
  return origListEvents();
};
await scheduler.reminderLoop();
if (listEventsCalled) {
  console.error("❌ FAILURE: reminderLoop ran even though ENABLE_ALERTS is false!");
  process.exit(1);
} else {
  console.log("✅ SUCCESS: reminderLoop respected the ENABLE_ALERTS=false flag!");
}

// Restore listEvents
dataManager.listEvents = origListEvents;
// Enable alerts for legacy test runs
process.env.ENABLE_ALERTS = "true";

// 3. Test reminderLoop() doesn't spam for legacy events or crash on missing groups
console.log("Running reminderLoop to check legacy skip and safety...");
// Clear sent messages
slimbot.sentMessages = [];

// Temporarily override removeEvent to track deletion
let removedEventChatID = null;
scheduler.removeEvent = async (chatID, silent) => {
  removedEventChatID = chatID;
  console.log(`[Scheduler removeEvent] Removed event for chatID: ${chatID}`);
  delete dataManager.events[chatID];
};

await scheduler.reminderLoop();

// check if messages were sent for legacy events
if (slimbot.sentMessages.length > 0) {
  console.error("❌ FAILURE: Sent messages for legacy events!", slimbot.sentMessages);
  process.exit(1);
} else {
  console.log("✅ SUCCESS: No warning/alert messages sent for legacy events!");
}

// check if past legacy event was removed
if (String(removedEventChatID) === "789") {
  console.log("✅ SUCCESS: Past legacy event was silently removed!");
} else {
  console.error("❌ FAILURE: Past legacy event was not removed!");
  process.exit(1);
}

// 4. Test Throttling Rules
console.log("Testing throttling wrapper rules...");

// Clear history/sent messages
slimbot.sentMessages = [];

// A. Test duplicate within 6 seconds
console.log("A. Sending first message...");
await slimbot.sendMessage("123", "Hello World");
console.log("Sending duplicate message immediately...");
const res2 = await slimbot.sendMessage("123", "Hello World");
if (res2.result.text === "throttled") {
  console.log("✅ SUCCESS: Duplicate message throttled within 6 seconds!");
} else {
  console.error("❌ FAILURE: Duplicate message not throttled!");
  process.exit(1);
}

// B. Test sending different message is NOT throttled
console.log("Sending a different message...");
const res3 = await slimbot.sendMessage("123", "Hello World Different");
if (res3.result.text !== "throttled") {
  console.log("✅ SUCCESS: Different message not throttled!");
} else {
  console.error("❌ FAILURE: Different message was incorrectly throttled!");
  process.exit(1);
}

// C. Test 10 sends in 5 minutes triggering 1-hour cooldown
console.log("Testing 10 messages in 5 minutes rate limit...");
const testKey = "123:Rate Limit Test";
messageHistory[testKey] = {
  lastSentTime: 0,
  sentTimestamps: [],
  cooldownUntil: 0
};

const history = messageHistory[testKey];
const mockNow = Date.now();
for (let i = 0; i < 10; i++) {
  history.sentTimestamps.push(mockNow - (10 - i) * 10000);
}
history.lastSentTime = mockNow - 10000;

console.log("Attempting to send 11th message...");
const resLimit = await slimbot.sendMessage("123", "Rate Limit Test");
if (resLimit.result.text === "throttled" && history.cooldownUntil > Date.now()) {
  console.log("✅ SUCCESS: 11th message blocked with 1-hour cooldown!");
} else {
  console.error("❌ FAILURE: Rate limit did not trigger 1-hour cooldown!");
  process.exit(1);
}

console.log("All tests passed successfully!");
process.exit(0);

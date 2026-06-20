import Slimbot from "slimbot";
import { GoogleGenAI } from "@google/genai";
import { AI, LLM } from "./ai-api.mjs";
import Roll from "roll";
import xhr2 from "xhr2";
import { Shadowrun } from "./shadowrun.mjs";
import { Dice } from "./dice.mjs";
import { SUBJECTS } from "./controversy.mjs";
import { Scheduler } from "./scheduler.mjs";
import { DataManager } from "./data.mjs";
import { removeCommand } from "./util.mjs";
import { LocalLLM } from "./ai-local.mjs";
import { Ollama } from "ollama";

global.XMLHttpRequest = xhr2;

const ollama = new Ollama({ url: "http://localhost:11434" });
const slimbot = new Slimbot(process.env[`TELEGRAM_BOT_TOKEN`]);

// Throttling mechanism for sendMessage to prevent spam loops and race conditions
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
const roll = new Roll();
const googleGenAI = new GoogleGenAI({ apiKey: process.env["GEMINI_API_KEY"] });

// Commands
const START = "/start";
const ROLL = "/roll ";
const R = "/r ";
const SHADOWRUN = "/sr ";
const CHAT_ID = "/chat_id";
const CONTROVERSY = "/criar_polemica";
const EVENTS = "/eventos";
const ADD_EVENT = "/criar_evento";
const REMOVE_EVENT = "/remover_evento";
const GROUPS = "/grupos";
const ADD_GROUP = "/criar_grupo";
const REMOVE_GROUP = "/remover_grupo";

const shiryuID =
  "AgACAgEAAxkBAAEBJ2Jlh5H9Mfdv7gnfJrnpnaMXQElTawAC56wxG6-0QETu8-pf_jVA1gEAAwIAA3MAAzME";
const aishoID =
  "AgACAgEAAxkBAAEBJ2Flh5HJPRQKnWOneEkgBoA9FUnsQgAC5qwxG6-0QEThrj1Ow8YvjQEAAwIAA3MAAzME";

const mgr = new DataManager();
const sr = new Shadowrun(roll, slimbot);
const dice = new Dice(roll, slimbot);
const scheduler = new Scheduler(slimbot, mgr);
const ai = new LocalLLM(ollama, slimbot);
const gai = new LLM(googleGenAI, slimbot);

slimbot.on(`message`, async (message) => {
  const { text, chat, from } = message;
  console.log(
    `[${chat.title || chat.id}] ${from.username || from.first_name}: ${text}`
  );
  if (!text) {
    return;
  }

  let username, id;
  switch (true) {
    case text.indexOf(`(AF)`) >= 0:
      slimbot.sendPhoto(chat.id, aishoID).catch(console.error);
      break;
    case text.indexOf(`(SF)`) >= 0:
      slimbot.sendPhoto(chat.id, shiryuID).catch(console.error);
      break;
    case text.startsWith(CHAT_ID):
      await slimbot.sendMessage(chat.id, chat.id);
      break;
    case text.startsWith(START):
      username = from.username;
      id = from.id;

      if (!username || !id) {
        slimbot.sendMessage(
          chat.id,
          "Por favor registre um username no telegram\nhttps://telegram.org/faq?setln=uz#q-what-are-usernames-how-do-i-get-one"
        );
        return;
      }
      await mgr.setUser("@" + username, id);
      break;
    case text.startsWith(ADD_GROUP):
      await scheduler.createGroup(
        chat.id,
        chat.title,
        removeCommand(ADD_GROUP, text)
      );
      break;
    case text.startsWith(REMOVE_GROUP):
      await scheduler.removeGroup(chat.id);
      break;
    case text.startsWith(GROUPS):
      await scheduler.listGroups(chat.id, chat.title);
      break;
    case text.startsWith(REMOVE_EVENT):
      await scheduler.removeEvent(chat.id);
      break;
    case text.startsWith(EVENTS):
      await scheduler.listEvents(chat.id, chat.title);
      break;
    case text.startsWith(ADD_EVENT):
      await scheduler.createEvent(
        chat.id,
        chat.title,
        removeCommand(ADD_EVENT, text)
      );
      break;
    case text.startsWith(ROLL):
      dice.roll(ROLL, message);
      break;
    case text.startsWith(R):
      dice.roll(R, message);
      break;
    case text.startsWith(CONTROVERSY):
      slimbot
        .sendMessage(
          chat.id,
          `Blz, lá vai:\n\n` +
            SUBJECTS[Math.floor(Math.random() * SUBJECTS.length)]
        )
        .catch(console.error);
      break;
    case text.startsWith(SHADOWRUN):
      sr.roll(message);
      break;
    case text.startsWith(AI):
      ai.prompt(message);
      break;
  }
});

console.log(`listening...`);
slimbot.startPolling();


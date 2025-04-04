import Slimbot from "slimbot";
import Roll from "roll";
import xhr2 from "xhr2";
import { Shadowrun } from "./shadowrun.mjs";
import { Dice } from "./dice.mjs";
import { SUBJECTS } from "./controversy.mjs";
import { Scheduler } from "./scheduler.mjs";
import { DataManager } from "./data.mjs";
import { removeCommand } from "./util.mjs";
import { LLM, AI } from './ai.mjs';
import { Ollama } from 'ollama';

global.XMLHttpRequest = xhr2;

const ollama = new Ollama({url: 'http://localhost:11434' });
const slimbot = new Slimbot(process.env[`TELEGRAM_BOT_TOKEN`]);
const roll = new Roll();

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

const TIMEOUT = 3000;

const shiryuID =
  "AgACAgEAAxkBAAEBJ2Jlh5H9Mfdv7gnfJrnpnaMXQElTawAC56wxG6-0QETu8-pf_jVA1gEAAwIAA3MAAzME";
const aishoID =
  "AgACAgEAAxkBAAEBJ2Flh5HJPRQKnWOneEkgBoA9FUnsQgAC5qwxG6-0QEThrj1Ow8YvjQEAAwIAA3MAAzME";

const mgr = new DataManager();
const sr = new Shadowrun(roll, slimbot);
const dice = new Dice(roll, slimbot);
const scheduler = new Scheduler(slimbot, mgr);
const ai = new LLM(ollama, slimbot)

slimbot.on(`message`, async (message) => {
  const { text, chat, from } = message;
  console.log(
    `[${chat.title || chat.id}] ${from.username || from.first_name}: ${text}`,
  );
  if (!text) {
    return;
  }
  switch (true) {
    case text.indexOf(`(AF)`) >= 0:
      slimbot.sendPhoto(chat.id, aishoID).catch(console.log);
      break;
    case text.indexOf(`(SF)`) >= 0:
      slimbot.sendPhoto(chat.id, shiryuID).catch(console.log);
      break;
    case text.startsWith(CHAT_ID):
      await slimbot.sendMessage(chat.id, chat.id);
      break;
    case text.startsWith(START):
      const { username, id } = from;
      if (!username || !id) {
        slimbot.sendMessage(
          chat.id,
          "Por favor registre um username no telegram\nhttps://telegram.org/faq?setln=uz#q-what-are-usernames-how-do-i-get-one",
        );
        return;
      }
      await mgr.setUser("@" + username, id);
      break;
    case text.startsWith(ADD_GROUP):
      await scheduler.createGroup(
        chat.id,
        chat.title,
        removeCommand(ADD_GROUP, text),
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
        removeCommand(ADD_EVENT, text),
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
            SUBJECTS[Math.floor(Math.random() * SUBJECTS.length)],
        )
        .catch(console.log);
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

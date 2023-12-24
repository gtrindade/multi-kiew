import Slimbot from "slimbot";
import Roll from "roll";
import { Shadowrun } from "./shadowrun.mjs";
import { Dice } from "./dice.mjs";
import { SUBJECTS } from "./controversy.mjs";
import { Scheduler } from "./scheduler.mjs";

const slimbot = new Slimbot(process.env[`TELEGRAM_BOT_TOKEN`]);
const roll = new Roll();

// Commands
const ROLL = "/roll ";
const R = "/r ";
const SHADOWRUN = "/sr ";
const POLEMICA = "/criar_polemica";
const EVENTO = "/evento";

const TIMEOUT = 3000;

const shiryuID =
  "AgACAgEAAxkBAAEBJ2Jlh5H9Mfdv7gnfJrnpnaMXQElTawAC56wxG6-0QETu8-pf_jVA1gEAAwIAA3MAAzME";
const aishoID =
  "AgACAgEAAxkBAAEBJ2Flh5HJPRQKnWOneEkgBoA9FUnsQgAC5qwxG6-0QEThrj1Ow8YvjQEAAwIAA3MAAzME";

const sr = new Shadowrun(roll, slimbot);
const dice = new Dice(roll, slimbot);
const scheduler = new Scheduler(slimbot);

// Register listeners
slimbot.on(`message`, async (message) => {
  console.log(message);
  const { text, chat } = message;
  console.log(`chat.id`, chat.id, `message`, text);
  switch (true) {
    case text.indexOf(`(AF)`) >= 0:
      slimbot.sendPhoto(chat.id, aishoID).catch(console.log);
      break;
    case text.indexOf(`(SF)`) >= 0:
      slimbot.sendPhoto(chat.id, shiryuID).catch(console.log);
      break;
    case text.startsWith(EVENTO):
      slimbot
        .getChat(chat.id)
        .then((c) => {
          // TODO: We don't actually get a list of users using Bot API.
          console.log(c);
          scheduler.createEvent(c.id, text, c.active_usernames);
        })
        .catch(console.log);
      break;
    case text.startsWith(ROLL):
      dice.roll(ROLL, message);
      break;
    case text.startsWith(R):
      dice.roll(R, message);
      break;
    case text.startsWith(POLEMICA):
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
    default:
      console.log(text);
  }
});

// Call API
console.log(`listening...`);
slimbot.startPolling();

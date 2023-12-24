import Slimbot from "slimbot";
import Roll from "roll";
import { Shadowrun } from "./shadowrun.mjs";
import { Dice } from "./dice.mjs";
import { SUBJECTS } from "./controversy.mjs";

const slimbot = new Slimbot(process.env[`TELEGRAM_BOT_TOKEN`]);
const roll = new Roll();

// Commands
const ROLL = "/roll ";
const R = "/r ";
const SHADOWRUN = "/sr ";
const POLEMICA = "/criar_polemica";

const TIMEOUT = 3000;

const shiryuID =
  "AgACAgEAAxkBAAEBJ2Jlh5H9Mfdv7gnfJrnpnaMXQElTawAC56wxG6-0QETu8-pf_jVA1gEAAwIAA3MAAzME";
const aishoID =
  "AgACAgEAAxkBAAEBJ2Flh5HJPRQKnWOneEkgBoA9FUnsQgAC5qwxG6-0QEThrj1Ow8YvjQEAAwIAA3MAAzME";

let sr = new Shadowrun(roll, slimbot);
let dice = new Dice(roll, slimbot);

// Register listeners
slimbot.on(`message`, async (message) => {
  console.log(message);
  const { text, chat } = message;
  console.log(`chat.id`, chat.id, `message`, text);
  if (text) {
    if (text.indexOf(`(AF)`) >= 0) {
      slimbot.sendPhoto(chat.id, aishoID).catch(console.log);
    }
    if (text.indexOf(`(SF)`) >= 0) {
      slimbot.sendPhoto(chat.id, shiryuID).catch(console.log);
    } else if (text.startsWith(ROLL)) {
      dice.roll(ROLL, message);
    } else if (text.startsWith(R)) {
      dice.roll(R, message);
    } else if (text.startsWith(POLEMICA)) {
      slimbot
        .sendMessage(
          chat.id,
          `Blz, lá vai:\n\n` +
            SUBJECTS[Math.floor(Math.random() * SUBJECTS.length)],
        )
        .catch(console.log);
    } else if (text.startsWith(SHADOWRUN)) {
      sr.roll(message);
    }
  }
});

// Call API
console.log(`listening...`);
slimbot.startPolling();

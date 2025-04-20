import { getUserMessage } from "./util.mjs";

export class Shadowrun {
  constructor(roll, slimbot) {
    this.r = roll;
    this.s = slimbot;
  }

  roll(message) {
    const { text, chat } = message;
    let [, input] = text.split(` `);
    var userMessage = getUserMessage(message);

    let hitMap = {
      rolled: [],
      hit: 0,
      miss: 0,
      critGlitch: false,
      glitch: false,
    };

    let entry = Number(input);
    if (isNaN(entry) || input === "") {
      this.s
        .sendMessage(chat.id, userMessage + `digita os trem direito sô`)
        .catch(console.error);
      return;
    }
    if (entry > 99) {
      this.s
        .sendMessage(
          chat.id,
          message.from.username + `, sério mesmo... sem trollar.`,
        )
        .catch(console.error);
      return;
    }

    if (entry === 0) {
      return;
    }

    let result = this.r.roll(entry + "d6");
    hitMap.rolled = result.rolled;
    for (let i = 0; i <= entry; i++) {
      let rolled = result.rolled[i];
      if (rolled >= 5) {
        hitMap["hit"] += 1;
      }
      if (rolled === 1) {
        hitMap["miss"] += 1;
      }
    }
    if (hitMap["miss"] > entry / 2) {
      hitMap["glitch"] = true;
      if (hitMap["hit"] < 1) {
        hitMap["critGlitch"] = true;
      }
    }
    let glitch = "";
    if (hitMap.glitch) {
      if (hitMap.critGlitch) {
        glitch += `C R I T I C A L   `;
      }
      glitch = `\n` + glitch + `G L I T C H`;
    }
    this.s
      .sendMessage(
        chat.id,
        userMessage +
          input +
          `d6:\n\nRolled: [ ` +
          hitMap.rolled +
          ` ]\nHits: ` +
          hitMap.hit +
          glitch,
      )
      .catch(console.error);
  }
}

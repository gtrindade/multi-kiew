export class Shadowrun {
  constructor(roll, slimbot) {
    this.r = roll;
    this.s = slimbot;
  }

  roll(message) {
    const { text, chat, message_id } = message;
    let [, input] = text.split(` `);

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
        .sendMessage(chat.id, `Digita os trem direito sô`, {
          reply_to_message_id: message_id,
        })
        .catch(console.error);
      return;
    }
    if (entry > 99) {
      this.s
        .sendMessage(chat.id, `Sério mesmo... sem trollar.`, {
          reply_to_message_id: message_id,
        })
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
        `\nRolled: [ ` + hitMap.rolled + ` ]\nHits: ` + hitMap.hit + glitch,
        { reply_to_message_id: message_id },
      )
      .catch(console.error);
  }
}

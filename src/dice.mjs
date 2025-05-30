import { removeCommand } from "./util.mjs";

export class Dice {
  constructor(roll, slimbot) {
    this.r = roll;
    this.s = slimbot;
  }

  roll(command, message) {
    const { text, chat, message_id } = message;
    var expression = removeCommand(command, text);
    const [rollExpression] = expression.split(` `);

    if (rollExpression.length > 7) {
      this.s
        .sendMessage(chat.id, `sério mesmo... sem trollar.`, {
          reply_to_message_id: message_id,
        })
        .catch(console.error);
      return;
    }

    var output;
    try {
      output = this.r.roll(rollExpression);
    } catch (e) {
      if (e.name == `InvalidInputError`) {
        this.s.sendMessage(chat.id, `Digita os trem direito sô`, {
          reply_to_message_id: message_id,
        });
        return;
      } else {
        console.error(e);
      }
    }

    this.s
      .sendMessage(
        chat.id,
        `\nRolled: [ ` + output.rolled + ` ]\nTotal: ` + output.result,
        { reply_to_message_id: message_id },
      )
      .catch(console.error);
  }
}

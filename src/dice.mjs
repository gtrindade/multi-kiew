import { getUserMessage, removeCommand } from "./util.mjs";

export class Dice {
  constructor(roll, slimbot) {
    this.r = roll;
    this.s = slimbot;
  }

  roll(command, message) {
    const { text, chat } = message;
    var expression = removeCommand(command, text);
    const [rollExpression] = expression.split(` `);

    if (rollExpression.length > 7) {
      this.s
        .sendMessage(
          chat.id,
          message.from.username + `, sério mesmo... sem trollar.`,
        )
        .catch(console.error);
      return;
    }

    var userMessage = getUserMessage(message);
    var output;
    try {
      output = this.r.roll(rollExpression);
    } catch (e) {
      if (e.name == `InvalidInputError`) {
        this.s.sendMessage(chat.id, userMessage + `digita os trem direito sô`);
        return;
      } else {
        console.error(e);
      }
    }

    this.s
      .sendMessage(
        chat.id,
        userMessage +
          expression +
          `:\n\nRolled: [ ` +
          output.rolled +
          ` ]\nTotal: ` +
          output.result,
      )
      .catch(console.error);
  }
}

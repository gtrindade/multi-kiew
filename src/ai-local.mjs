import { removeCommand } from "./util.mjs";

export const LAI = "/lai";

const maxHistory = 12;

export class LocalLLM {
  constructor(ollama, slimbot) {
    this.o = ollama;
    this.s = slimbot;
    this.m = {};
  }

  createMessage(text) {
    return { role: "user", content: text };
  }

  addToList(list, msg) {
    if (!list) {
      return [msg];
    }
    if (list.length > maxHistory) {
      return [...list.slice(1, maxHistory), msg];
    }
    return [...list, msg];
  }

  pushMsgForUser(text, userID) {
    const msg = this.createMessage(text);
    this.m[userID] = this.addToList(this.m[userID], msg);
  }

  async prompt(message) {
    const { text, chat, from } = message;
    const msg = removeCommand(LAI, text);
    this.pushMsgForUser(msg, from.id);

    let result;
    try {
      result = await this.o.chat({
        // model: "gemma3:1b",
        model: "deepseek-r1:1.5b",
        messages: this.m[from.id],
      });
    } catch (error) {
      console.error(error);
      this.s
        .sendMessage(chat.id, "Error generating response: \n\n" + error, {
          reply_to_message_id: message.message_id,
        })
        .catch(console.error);
      return;
    }

    result.message.content = result.message.content.replace(
      /<think>[\s\S]*?<\/think>/g,
      ""
    );

    this.m[from.id] = this.addToList(this.m[from.id], result.message);

    await this.s
      .sendMessage(chat.id, result.message.content, {
        reply_to_message_id: message.message_id,
        parse_mode: "Markdown",
      })
      .catch(console.error);
  }
}


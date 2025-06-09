import { removeCommand } from "./util.mjs";

export const AI = "/ai";

export class LLM {
  constructor(gai, slimbot) {
    this.g = gai;
    this.s = slimbot;
    this.m = {};
  }

  createMessage(text) {
    return { role: "user", parts: [{ text }] };
  }

  getChatForOrigin(originID) {
    if (!this.m[originID]) {
      this.m[originID] = this.g.chats.create({
        model: "gemini-2.0-flash",
      });
    }
    return this.m[originID];
  }

  async prompt(message) {
    const { text, chat, from } = message;
    const msg = this.createMessage(removeCommand(AI, text));
    const aiChat = this.getChatForOrigin(from.id);

    let result;
    try {
      result = await aiChat.sendMessage({
        message: msg,
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

    await this.s
      .sendMessage(chat.id, result.text, {
        reply_to_message_id: message.message_id,
        parse_mode: "Markdown",
      })
      .catch(console.error);
  }
}


import { removeCommand } from "./util.mjs";

export const AI = "/ai";
export const MODEL = "gemini-2.0-flash";
export const MAX_TOKENS = 20000;

export class LLM {
  constructor(gai, slimbot) {
    this.g = gai;
    this.s = slimbot;
    this.m = {};
  }

  createMessage(text) {
    return { parts: [{ text }], role: "user" };
  }

  getChatForOrigin(originID) {
    if (!this.m[originID]) {
      this.m[originID] = this.g.chats.create({
        model: "gemini-2.0-flash",
      });
    }
    return this.m[originID];
  }

  async getTokenCount(chat) {
    const result = await this.g.models.countTokens({
      model: MODEL,
      contents: chat.history,
    });
    return result.totalTokens;
  }

  async checkTokenLimit(chat) {
    let totalTokens = await this.getTokenCount(chat);
    while (totalTokens > MAX_TOKENS) {
      console.log(`Token limit exceeded: ${totalTokens}. Trimming history...`);
      chat.history.shift();
      chat.history.shift();
      totalTokens = await this.getTokenCount(chat);
    }
  }

  async prompt(message) {
    const { text, chat } = message;
    const msg = this.createMessage(removeCommand(AI, text));
    const aiChat = this.getChatForOrigin(chat.id);

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
      })
      .catch(console.error);

    await this.checkTokenLimit(aiChat);
  }
}

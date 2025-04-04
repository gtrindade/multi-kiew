import { removeCommand } from "./util.mjs";

export const AI = "/ai";

export class LLM {
  constructor(ollama, slimbot) {
    this.o = ollama;
    this.s = slimbot;
  }

  async prompt(message) {
    const { text, chat } = message;
    var msg = removeCommand(AI, text);

    let result;
    try {
      result = await this.o.generate({
          "model": "gemma3:1b",
	  // "model": "deepseek-r1:1.5b",
          "prompt": msg
      });
    } catch ( error ) {
      this.s.sendMessage(
          chat.id,
          "Error generating response:" + error
      ).catch(console.log);
      return;
    }

    this.s.sendMessage(
      chat.id,
      result.response
    ).catch(console.log);
  }
}

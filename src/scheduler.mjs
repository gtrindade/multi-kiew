import { Chats, getUserIDs } from "./users.mjs";

export class Scheduler {
  constructor(slimbot) {
    this.s = slimbot;
    this.events = {};

    this.s.on("callback_query", (query) => {
      const queryData = JSON.parse(query.data);
      const { m, r } = queryData;
      let botResponse = "";
      switch (r) {
        case "y":
          botResponse = "💪";
          break;
        case "n":
          botResponse = "🐔";
          break;
      }
      if (!this.events[m]) {
        this.s
          .sendMessage(
            query.message.chat.id,
            "Esse evento não existe mais, por favor crie outro",
          )
          .catch(console.log);
        return;
      }
      if (botResponse !== "") {
        this.updateStatus(m, query.message.chat.username, botResponse);
        this.s
          .sendMessage(query.message.chat.id, botResponse)
          .catch(console.log);
      }
    });
  }

  createEvent(chatID, chatTitle, msg) {
    const baseCallbackData = {
      m: msg,
    };
    const yesCallback = JSON.stringify({
      ...baseCallbackData,
      r: "y",
    });
    const noCallback = JSON.stringify({
      ...baseCallbackData,
      r: "n",
    });

    const error = this.validateName(msg, yesCallback, noCallback);
    if (error) {
      this.s
        .sendMessage(chatID, error, { parse_mode: "Markdown" })
        .catch(console.log);
      return;
    }
    this.events[msg] = {
      chatID,
    };

    let eventText = `
      ${chatTitle} - ${msg}

`;

    const users = Chats[chatTitle.toLowerCase()];
    for (let user of users) {
      eventText += "\t" + user + " ❔\n";
    }
    this.s
      .sendMessage(chatID, eventText)
      .then((eventMsg) => {
        this.events[msg].eventMsg = eventMsg;
      })
      .catch(console.log);

    let optionalParams = {
      parse_mode: "Markdown",
      reply_markup: JSON.stringify({
        inline_keyboard: [
          [
            {
              text: "Sim",
              callback_data: yesCallback,
            },
            {
              text: "Não",
              callback_data: noCallback,
            },
          ],
        ],
      }),
    };

    const userIDs = getUserIDs(chatTitle);
    for (let user of userIDs) {
      this.s
        .sendMessage(user, chatTitle + " - " + msg, optionalParams)
        .catch(console.log);
    }
  }

  validateName(msg, yesCallback, noCallback) {
    if (msg === "@multikiewbot") {
      return "Escreva uma descrição usando esse formato:\n\n\t\t_/evento RPG Sexta-Feira 21/12 21h BRT_";
    }

    if (this.events[msg]) {
      return "Já tem um evento ativo com essa mensagem.";
    }

    if (new Blob([noCallback]).size > 64 || new Blob([yesCallback]).size > 64) {
      return "Esse nome é muito grande";
    }
  }

  updateStatus(msg, username, response) {
    const { message_id, text } = this.events[msg].eventMsg.result;
    const newText = text.replace(`${username} ❔`, `${username} ${response}`);
    if (newText !== text) {
      this.s.editMessageText(this.events[msg].chatID, message_id, newText);
    }
  }
}

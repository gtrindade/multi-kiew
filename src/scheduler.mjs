import { Blob } from "buffer";

const CHICK = "🐔";
const ARM = "💪";
const QUESTION = "❔";

export class Scheduler {
  constructor(slimbot, mgr) {
    this.mgr = mgr;
    this.s = slimbot;

    this.s.on("callback_query", (query) => {
      const queryData = JSON.parse(query.data);
      const { m, r, c } = queryData;
      let botResponse = "";
      switch (r) {
        case "y":
          botResponse = ARM;
          break;
        case "n":
          botResponse = CHICK;
          break;
      }
      if (botResponse !== "" && query && query.message && query.message.chat) {
        const { username, id } = query.message.chat;
        if (!this.mgr.getEvent(c)) {
          this.s
            .sendMessage(id, "Esse evento não existe mais.")
            .catch(console.log);
          return;
        }
        this.updateStatus(c, m, username, botResponse);
        this.s.sendMessage(id, botResponse).catch(console.log);
      }
    });
  }

  async createEvent(chatID, chatTitle, msg) {
    const baseCallbackData = {
      m: msg,
      c: chatID,
    };
    const yesCallback = JSON.stringify({
      ...baseCallbackData,
      r: "y",
    });
    const noCallback = JSON.stringify({
      ...baseCallbackData,
      r: "n",
    });

    const error = this.validate(
      chatTitle,
      chatID,
      msg,
      yesCallback,
      noCallback,
    );
    if (error) {
      this.s.sendMessage(chatID, error).catch(console.log);
      return;
    }
    let newEvent = {
      chatID,
    };

    let eventText = `
      ${chatTitle} - ${msg}

`;

    const users = this.mgr.getUsers(chatID);
    if (!users) {
      await this.s.sendMessage(
        chatID,
        "Esse grupo não foi registrado. Use o comando /criar_grupo @usuario1 @usuario2...",
      );
      return;
    }
    for (let user of users) {
      eventText += "\t" + user + ` ${QUESTION}\n`;
    }
    const eventMsg = await this.s.sendMessage(chatID, eventText);
    if (eventMsg && eventMsg.result) {
      const { message_id, text } = eventMsg.result;
      await this.mgr.setEvent(chatID, msg, text, message_id);
    }

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

    const userIDs = this.mgr.getUserIDs(chatID);
    for (let user of userIDs) {
      this.s
        .sendMessage(user, chatTitle + " - " + msg, optionalParams)
        .catch((e) => {
          console.log(e);
          const errMsg = `Usuário ${this.mgr.getUsername(
            user,
          )} precisa dar start no @multikiewbot`;
          this.s.sendMessage(chatID, errMsg).catch(console.log);
        });
    }
  }

  validate(chatTitle, chatID, msg, yesCallback, noCallback) {
    if (msg.trim() === "" || msg === "@multikiewbot") {
      return "Escreva uma descrição usando esse formato:\n\n\t\t/criar_evento RPG Sexta-Feira 21/12 21h BRT";
    }

    if (!chatTitle) {
      return "Esse commando só funciona em grupos registrados.";
    }

    if (this.mgr.getEvent(chatID)) {
      return "Já tem um evento ativo nesse grupo.";
    }

    if (new Blob([noCallback]).size > 64 || new Blob([yesCallback]).size > 64) {
      return "Esse nome é muito grande.";
    }
  }

  async updateStatus(chatID, msg, username, response) {
    const { messageID, summary } = this.mgr.getEvent(chatID);
    const regex = new RegExp(`@${username}.*`, "m");
    const newSummary = summary.replace(regex, `@${username} ${response}`);
    await this.mgr.setEvent(chatID, msg, newSummary, messageID);
    if (newSummary !== summary) {
      await this.s.editMessageText(chatID, messageID, newSummary);
      if (
        newSummary.indexOf(CHICK) === -1 &&
        newSummary.indexOf(QUESTION) === -1
      ) {
        await this.s.sendMessage(chatID, `Evento confirmado, seus putos!`, {
          reply_to_message_id: messageID,
        });
        this.removeEvent(chatID, true);
      }
    }
  }

  async listEvents(chatID, chatTitle) {
    let events = this.mgr.listEvents();
    if (chatTitle) {
      events = events.filter((x) => x.chatID === chatID);
    }
    events = events.map((x) => x.msg);
    if (!events || !events.length) {
      await this.s.sendMessage(chatID, "nenhum evento registrado.");
      return;
    }
    await this.s.sendMessage(chatID, events.join("\n"));
  }

  async listGroups(chatID, chatTitle) {
    let groups = this.mgr.listGroups();
    if (chatTitle) {
      groups = groups.filter((x) => x.chatID === chatID);
    }
    let msg = "";
    for (let group of groups) {
      if (!chatTitle) {
        msg += "\n\n" + group.chatID + "\n";
        if (!group.users || !group.users.length) {
          msg += "\n\t\t Nenhum usuário.";
        }
      }
      for (let user of group.users) {
        msg += "\n";
        if (!chatTitle) {
          msg += "\t\t";
        }
        msg += user;
      }
    }
    msg += "\n\n";
    await this.s.sendMessage(chatID, msg);
  }

  async removeEvent(chatID, silent) {
    var msg = "";
    try {
      await this.mgr.removeEvent(chatID);
      msg = "Evento removido com sucesso.";
    } catch (e) {
      console.log(e);
      msg = "Erro ao remover evento.";
    }
    if (!silent && msg !== "") {
      this.s.sendMessage(chatID, msg);
    }
  }

  async removeGroup(chatID) {
    try {
      await this.mgr.deleteGroup(chatID);
      this.s.sendMessage(chatID, "Grupo removido com sucesso.");
    } catch (e) {
      console.log(e);
      this.s.sendMessage(chatID, "Erro ao remover grupo.");
    }
  }

  async createGroup(chatID, chatTitle, text) {
    if (chatTitle === "") {
      await this.s.sendMessage(
        chatID,
        "esse comando só pode ser usado em grupos.",
      );
      return;
    }
    if (text === "@multikiewbot" || text === "") {
      await this.s.sendMessage(
        chatID,
        "Use o seguinte formato: /criar_grupo @p_trindade @guilhermetmg.",
      );
      return;
    }
    let usernames = text.split(" ");
    if (!usernames || !usernames.length) {
      await this.s.sendMessage(
        chatID,
        "por favor liste os usuários separados por espaços.",
      );
      return;
    }
    let validUsernames = [];
    for (let username of usernames) {
      if (!username.startsWith("@")) {
        await this.s.sendMessage(
          chatID,
          "Usuários precisam começar com @. Ignorando `" + username + "`",
        );
        continue;
      }
      if (!this.mgr.getUserID(username)) {
        await this.s.sendMessage(
          "O usuário " + username + " precisa iniciar o @multikiewbot",
        );
        continue;
      }
      validUsernames.push(username);
    }
    if (!validUsernames || !validUsernames.length) {
      await this.s.sendMessage(chatID, "Nenhum usuário válido encontrado");
      return;
    }
    try {
      await this.mgr.setGroup(chatID, validUsernames);
      await this.s.sendMessage(chatID, "Grupo registrado com sucesso.");
    } catch (e) {
      console.log(e);
      await this.s.sendMessage(chatID, "erro ao criar grupo.");
    }
  }
}

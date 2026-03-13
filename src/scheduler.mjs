import moment from "moment-timezone";

const CHICK = "🐔";
const ARM = "💪";
const QUESTION = "❔";

const REMINDER_INTERVAL = 6 * 1000; // 1 minute
const FIRST_REMINDER = 12; // hours
const SECOND_REMINDER = 1; // hours
const LAST_REMINDER = 1; // days

const DEFAULT_TIMEZONE = "America/Sao_Paulo";
const INPUT_FORMAT = "DD/MM/YYYY HH:mm";
const PRINT_FORMAT = "dddd, DD/MM/YYYY HH:mm";
const DEFAULT_TIME = { hour: 21, minute: 0 };

const LINKS = `Foundry
http://multikiew.ddns.net:30000/

Zoom (passcode: 461008)
https://fanatics.zoom.us/j/8297148549?pwd=RllkRGQyaGtPcHBadlVHOGpCY29oQT09
`;

const FRIDAY = 5;
const SATURDAY = 6;

export class Scheduler {
  constructor(slimbot, mgr) {
    this.mgr = mgr;
    this.s = slimbot;

    this.s.on("callback_query", async (query) => {
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
        case `${FRIDAY}`:
          if (this.mgr.getEvent(c)) {
            return;
          }
          await this.doCreateEvent(
            c,
            query.message.chat.title,
            this.getFriday(),
          );
          break;
        case `${SATURDAY}`:
          if (this.mgr.getEvent(c)) {
            return;
          }
          await this.doCreateEvent(
            c,
            query.message.chat.title,
            this.getSaturday(),
          );
          break;
        default:
          console.error("Unknown callback data", queryData);
          return;
      }

      if (botResponse !== "" && query && query.message && query.message.chat) {
        const { username, id } = query.message.chat;
        const event = this.mgr.getEvent(c);
        let msg;
        if (!event) {
          msg = "Não tem nenhum evento ativo.";
        } else if (event.confirmed) {
          msg = "Esse evento já foi confirmado, putano.";
        }
        if (msg) {
          await this.s.sendMessage(id, msg).catch(console.error);
          return;
        }
        await this.updateStatus(c, m, username, botResponse);
        await this.s.sendMessage(id, botResponse).catch(console.error);
      }
    });

    moment.locale("pt-br");
    setInterval(() => {
      this.reminderLoop().catch(console.error);
    }, REMINDER_INTERVAL);
  }

  async reminderLoop() {
    const now = moment().tz(DEFAULT_TIMEZONE);
    const events = this.mgr.listEvents();
    if (!events || !events.length) {
      return;
    }
    for (let event of events) {
      const { chatID, date, confirmed, confirmedUsers, createdAt, summary } =
        event;

      if (!date || !date.isValid()) {
        continue;
      }

      const allUsers = this.mgr.getUsers(chatID);
      const unconfirmedUsers = allUsers.filter(
        (x) => !(confirmedUsers || []).includes(x),
      );
      date.tz(DEFAULT_TIMEZONE);
      const isBefore = date.isBefore(now);
      const timeLeft = moment.duration(date.diff(now));

      if (isBefore) {
        await this.removeEvent(chatID, true);
      }

      for (let user of unconfirmedUsers) {
        const warningKey = `daily_${user}`;
        const lastWarning = this.mgr.getWarning(chatID, warningKey);
        const now = moment().tz(DEFAULT_TIMEZONE);

        if (!createdAt) {
          break;
        }

        const createdDate = moment(createdAt).tz(DEFAULT_TIMEZONE);
        if (createdDate.format("YYYY-MM-DD") === now.format("YYYY-MM-DD")) {
          break;
        }

        if (now.hour() >= 9) {
          const today = now.format("YYYY-MM-DD");
          if (!lastWarning || !lastWarning.startsWith(today)) {
            const userID = this.mgr.getUserID(user);
            if (userID) {
              const summaryText = summary.split("\n")[0];
              await this.s
                .sendMessage(
                  userID,
                  `Putano, você ainda não respondeu:\n\n${summaryText}!`,
                )
                .catch(console.error);
              await this.mgr.markWarning(chatID, warningKey, today);
            }
          }
        }
      }

      const shouldFirstWarning =
        confirmed && date.diff(now, "hours") <= FIRST_REMINDER - 1;
      const shouldSecondWarning =
        confirmed && date.diff(now, "hours") <= SECOND_REMINDER - 1;
      const shouldLastWarning = date.diff(now, "days") <= LAST_REMINDER - 1;

      let reminderText = "";
      switch (true) {
        case isBefore:
          reminderText =
            confirmedUsers.join(", ") +
            `\n\n${confirmedUsers.length > 1 ? "Já entraram?" : "Já entrou?"}` +
            `\n\n${LINKS}`;
          await this.s.sendMessage(chatID, reminderText).catch(console.error);
          break;
        case shouldLastWarning &&
          unconfirmedUsers.length > 0 &&
          !this.mgr.getLastWarning(chatID):
          if (unconfirmedUsers.length === 1) {
            reminderText = `O ${unconfirmedUsers[0]} ainda não respondeu, seu PUTO!`;
          } else {
            reminderText = `Eis aqui, os putanos que ainda não responderam:\n\n${unconfirmedUsers.join(
              "\n",
            )}`;
          }
          await this.s.sendMessage(chatID, reminderText).catch(console.error);
          await this.mgr.markLastWarning(chatID);
          break;
        case shouldFirstWarning && !this.mgr.getFirstWarning(chatID):
          await this.s
            .sendMessage(
              chatID,
              `Putanos, o RPG vai ser em ${timeLeft.humanize()}...`,
            )
            .catch(console.error);
          await this.mgr.markFirstWarning(chatID);
          break;
        case shouldSecondWarning && !this.mgr.getSecondWarning(chatID):
          reminderText =
            confirmedUsers.join(", ") +
            `\n\nAgora é sério, vai começar em ${timeLeft.humanize()}... seus PUTOS!`;
          await this.s.sendMessage(chatID, reminderText).catch(console.error);
          await this.mgr.markSecondWarning(chatID);
          break;
      }
    }
  }

  async createEvent(chatID, chatTitle, msg) {
    const error = this.validate(chatTitle, chatID);
    if (error) {
      await this.s.sendMessage(chatID, error).catch(console.error);
      return;
    }

    const date = await this.getDate(chatID, msg);
    if (!date) {
      return;
    }

    return this.doCreateEvent(chatID, chatTitle, date);
  }

  async doCreateEvent(chatID, chatTitle, date) {
    this.collectUserResponses(chatID, chatTitle, date);
    this.mgr.setEvent(chatID, date, "", 0, false);
  }

  async collectUserResponses(chatID, chatTitle, date) {
    let eventText = `
      ${chatTitle} - ${this.formatDate(date)}

`;

    const users = this.mgr.getUsers(chatID);
    if (!users) {
      await this.s
        .sendMessage(
          chatID,
          "Esse grupo não foi registrado. Use o comando /criar_grupo @usuario1 @usuario2...",
        )
        .catch(console.error);
      return;
    }
    for (let user of users) {
      eventText += "\t" + user + ` ${QUESTION}\n`;
    }
    const eventMsg = await this.s.sendMessage(chatID, eventText);
    if (eventMsg && eventMsg.result) {
      const { message_id, text } = eventMsg.result;
      await this.mgr.setEvent(chatID, date, text, message_id);
    }

    const yesCallback = JSON.stringify({
      c: chatID,
      r: "y",
    });
    const noCallback = JSON.stringify({
      c: chatID,
      r: "n",
    });

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
      await this.s
        .sendMessage(
          user,
          chatTitle + " - " + this.formatDate(date),
          optionalParams,
        )
        .catch(async (e) => {
          console.error(e);
          const errMsg =
            `Usuário ${this.mgr.getUsername(user)} precisa dar start no @` +
            process.env.BOT_NAME;
          await this.s.sendMessage(chatID, errMsg).catch(console.error);
        });
    }
  }

  async getDate(chatID, msg) {
    const date = moment(msg, INPUT_FORMAT).tz(DEFAULT_TIMEZONE, true);
    if (date.isValid()) {
      const nowInDefaultTimezone = moment().tz(DEFAULT_TIMEZONE);
      if (date.isBefore(nowInDefaultTimezone)) {
        await this.s
          .sendMessage(
            chatID,
            `A data não pode ser no passado, putano.\n\nData em "${DEFAULT_TIMEZONE}": ${nowInDefaultTimezone.format(
              INPUT_FORMAT,
            )}`,
          )
          .catch(console.error);
        return;
      }

      return date;
    }

    const friday = this.getFriday();
    const saturday = this.getSaturday();

    const fridayCallback = JSON.stringify({
      c: chatID,
      r: `${FRIDAY}`,
    });
    const saturdayCallback = JSON.stringify({
      c: chatID,
      r: `${SATURDAY}`,
    });

    let optionalParams = {
      parse_mode: "Markdown",
      reply_markup: JSON.stringify({
        inline_keyboard: [
          [
            {
              text: this.formatDate(friday),
              callback_data: fridayCallback,
            },
            {
              text: this.formatDate(saturday),
              callback_data: saturdayCallback,
            },
          ],
        ],
      }),
    };

    let errMsg = `Não entendi a data, use o formato: "${INPUT_FORMAT}". Sugestões:`;
    if (!msg || msg.trim() === "") {
      errMsg = `Sugestões de data:`;
    }

    await this.s
      .sendMessage(chatID, errMsg, optionalParams)
      .catch(async (e) => {
        console.error(e);
        const errMsg = `Não consegui processar a resposta`;
        await this.s.sendMessage(chatID, errMsg).catch(console.error);
      });

    return;
  }

  validate(chatTitle, chatID) {
    if (!chatTitle) {
      return "Esse commando só funciona em grupos registrados.";
    }

    const users = this.mgr.getUsers(chatID);
    if (!users) {
      return "Esse grupo não foi registrado. Use o comando /criar_grupo @usuario1 @usuario2...";
    }

    const existingEvent = this.mgr.getEvent(chatID);
    if (existingEvent && !existingEvent.confirmed) {
      return "Já tem um evento não confirmado nesse grupo. Use /eventos para ver ou /remover_evento para limpar.";
    }
  }

  async updateStatus(chatID, msg, username, response) {
    const { messageID, date, summary } = this.mgr.getEvent(chatID);
    const regex = new RegExp(`@${username}.*`, "m");
    const newSummary = summary.replace(regex, `@${username} ${response}`);
    let confirmed = false;
    if (newSummary !== summary) {
      await this.s.editMessageText(chatID, messageID, newSummary);
      if (newSummary.indexOf(QUESTION) === -1) {
        confirmed = true;
        let msg = "";
        if (newSummary.indexOf(CHICK) === -1) {
          msg = `Todos confirmados, não vai ter garçom parado nem puta triste!`;
        } else {
          msg = `Tem uns ${CHICK} aí, putanos...`;
        }
        if (msg) {
          await this.s.sendMessage(chatID, msg, {
            reply_to_message_id: messageID,
          });
        }
      }
    }
    await this.mgr.setEvent(
      chatID,
      date,
      newSummary,
      messageID,
      confirmed,
      username,
    );
  }

  async listEvents(chatID, chatTitle) {
    let events = this.mgr.listEvents();
    if (chatTitle) {
      events = events.filter((x) => x.chatID === chatID);
    }
    events = events.map((x) => x.msg + (x.confirmed ? " - confirmado!" : ""));
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
      if (!(await this.mgr.removeEvent(chatID))) {
        msg = "Nada para remover";
      } else {
        msg = "Evento removido com sucesso.";
      }
    } catch (e) {
      console.error(e);
      msg = "Erro ao remover evento.";
    }
    if (!silent && msg !== "") {
      await this.s.sendMessage(chatID, msg);
    }
  }

  async removeGroup(chatID) {
    let msg = "";
    try {
      if (await this.mgr.deleteGroup(chatID)) {
        msg = "Grupo removido com sucesso.";
      } else {
        msg = "Nada para remover";
      }
    } catch (e) {
      msg = "Erro ao remover grupo.";
      console.error(e);
    }
    if (msg) {
      await this.s.sendMessage(chatID, msg);
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
    if (text === "") {
      await this.s.sendMessage(
        chatID,
        "Use o seguinte formato: /criar_grupo @usuario1 @usuario2.",
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
          chatID,
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
      console.error(e);
      await this.s.sendMessage(chatID, "Erro ao criar grupo.");
    }
  }

  getFriday() {
    const now = moment().tz(DEFAULT_TIMEZONE);
    const friday = moment().tz(DEFAULT_TIMEZONE).day(FRIDAY).set(DEFAULT_TIME);
    return friday.isBefore(now) ? friday.add(1, "week") : friday;
  }

  getSaturday() {
    const now = moment().tz(DEFAULT_TIMEZONE);
    const saturday = moment()
      .tz(DEFAULT_TIMEZONE)
      .day(SATURDAY)
      .set(DEFAULT_TIME);
    return saturday.isBefore(now) ? saturday.add(1, "week") : saturday;
  }

  formatDate(date) {
    if (!date?.format) {
      return null;
    }
    const formatted = date.format(PRINT_FORMAT) + " BRT";
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }
}

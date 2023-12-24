export class Scheduler {
  constructor(slimbot) {
    this.s = slimbot;
    this.events = {};
  }

  createEvent(chatID, chatTitle, msg, users) {
    if (this.events[msg]) {
      this.s.sendMessage(chat, "Já tem um evento ativo com essa mensagem.");
      return;
    }
    for (let user of users) {
      this.s.sendMessage(user, chatTitle + " - " + msg);
    }
    // TODO: post event message in group it was created
    // TODO: update message as we get confirmations
  }
}

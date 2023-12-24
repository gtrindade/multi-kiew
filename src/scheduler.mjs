export class Scheduler {
  constructor(slimbot) {
    this.s = slimbot;
    this.events = {};
  }

  createEvent(chat, msg, users) {
    if (this.events[msg]) {
      this.s.sendMessage(chat, "Já tem um evento ativo com essa mensagem.");
      return;
    }
    for (let user in users) {
      // TODO: get confirmation from user
      this.s.sendMessage(users[user], "oi");
    }
    // TODO: post event message in group it was created
    // TODO: update message as we get confirmations
  }
}

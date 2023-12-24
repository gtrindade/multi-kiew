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
    for (user in users) {
      this.s.sendMessage(user.id, "oi");
    }
  }
}

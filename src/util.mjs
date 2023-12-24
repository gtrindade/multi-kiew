export function getUserMessage(message) {
  return message.from.username ? message.from.username + ` => ` : ``;
}

export function removeCommand(command, text) {
  return text.substring(command.length, text.length).trim();
}

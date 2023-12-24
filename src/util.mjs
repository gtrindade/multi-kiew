export function getUserMessage(message) {
  return message.from.username ? message.from.username + ` => ` : ``;
}

export const BOT_NAME = "@multikiewbot";

export function getUserMessage(message) {
  return message.from.username ? message.from.username + ` => ` : ``;
}

export function removeCommand(command, text) {
  return text
    .substring(command.length, text.length)
    .replace(BOT_NAME, "")
    .trim();
}

export const BOT_NAME = "@multikiewbot";

export function removeCommand(command, text) {
  return text
    .substring(command.length, text.length)
    .replace(BOT_NAME, "")
    .trim();
}

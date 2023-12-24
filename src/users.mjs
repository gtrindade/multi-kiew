export const Users = {
  "@AishoBH": 53142410,
  "@bmaraujo": 68102136,
  "@guilhermetmg": 55847128,
  "@k4mahl": 46527971,
  "@LeuFreitas": 609431541,
  "@MaskkotBR": 1025383917,
  "@ProtomanBH": 844843992,
  "@Renas_Apenas": 5479385410,
  "@VictorSouza010999": 1606523218,
};

export const Chats = {
  // test channel
  4055439111: ["@guilhermetmg"],
  // off-topic
  // 508022602: [],
  // shadowrun
  267393303: [
    "@bmaraujo",
    "@guilhermetmg",
    "@k4mahl",
    "@ProtomanBH",
    "@Renas_Apenas",
  ],
  // darkest night
  4048153285: [
    "@bmaraujo",
    "@guilhermetmg",
    "@k4mahl",
    "@Renas_Apenas",
    "@VictorSouza010999",
  ],
};

export function getUserIDs(chatID) {
  let users = Chats[-chatID];
  let userIDs = [];
  for (let userName of users) {
    userIDs.push(Users[userName]);
  }
  return userIDs;
}

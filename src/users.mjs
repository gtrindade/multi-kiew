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
  "@p_trindade": 67498014,
};

export const Chats = {
  "test multi-kiew": ["@guilhermetmg", "@p_trindade"],
  shadowrun: [
    "@bmaraujo",
    "@guilhermetmg",
    "@k4mahl",
    "@ProtomanBH",
    "@Renas_Apenas",
  ],
  "darkest night": [
    "@bmaraujo",
    "@guilhermetmg",
    "@k4mahl",
    "@Renas_Apenas",
    "@VictorSouza010999",
  ],
  "t20 - o culto": [
    "@bmaraujo",
    "@guilhermetmg",
    "@k4mahl",
    "@Renas_Apenas",
    "@VictorSouza010999",
  ],
};

export function getUserIDs(chatTitle) {
  let users = Chats[chatTitle.toLowerCase()];
  if (!users) return [];
  let userIDs = [];
  for (let userName of users) {
    userIDs.push(Users[userName]);
  }
  return userIDs;
}

export function getUsername(userID) {
  for (let user in Users) {
    if (Users[user] === userID) {
      return user;
    }
  }
  return "not found";
}

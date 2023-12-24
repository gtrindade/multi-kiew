export const USERS = {
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

export function getUserIDs(text) {
  let parts = text.split(" ");
  let mentioned = {};
  for (let i in parts) {
    if (!parts[i].startsWith("@")) {
      continue;
    }
    mentioned[parts[i]] = USERS[parts[i]];
  }
  return mentioned;
}

import Slimbot from 'slimbot'
import Roll from 'roll'

const roll = new Roll()
const slimbot = new Slimbot(process.env[`TELEGRAM_BOT_TOKEN`])

// Commands
const ROLL = `/roll `
const R = `/r `
const SHADOWRUN = `/sr `
const POLEMICA = `/criar_polemica`

const ASSUNTOS = [
  `A terra é redonda!`,
  `PC > VG`,
  `Star Wars I, II, III são bons`,
  `Linux > Windows`,
  `Fone de Ouvido > Caixinha de som`,
  `Meia soquete é top`,
  `Esposa > Amigos`,
  `Dwarf Fortress > God of War`,
  `PT > PSDB`,
  `Batman 3 é bom`,
  `Jessica Jones > Luke Cage`,
  `Android > iOS`,
  `3.5 > 5.0`,
  `Mesa e Cadeira > Sofá/Cama`,
  `Avião > Navio`,
  `Dumbledore > Gandalf`,
  `Goku > Superman`,
  `Batman > Resto`
]

const TIMEOUT = 3000

const aishoUrl = `https://imgur.com/a/kg2TW`
const shiryuUrl = `https://imgur.com/a/GjYYHKB`

function getUserMessage(message) {
  return message.from.username ? message.from.username + ` => ` : ``
}

function shadowrunRoll(message) {
  const {text, chat} = message
  let [, input] = text.split(` `)
  var userMessage = getUserMessage(message)

  let hitMap = {
    rolled: [],
    hit: 0,
    miss: 0,
    critGlitch: false,
    glitch: false
  }
  
  let entry = Number(input)
  if (isNaN(entry) || input === "") {
    slimbot.sendMessage(chat.id, userMessage + `digita os trem direito sô`)
      .catch(console.log)
    return
  }
  if (entry > 99) {
    slimbot.sendMessage(chat.id, message.from.username + `, sério mesmo... sem trollar.`)
      .catch(console.log)
    return
  }

  if (entry === 0) {
    return
  }
  
  let result = roll.roll(entry + "d6");
  hitMap.rolled = result.rolled
  for (let i = 0; i <= entry; i++) {
    let rolled = result.rolled[i]
    if (rolled >= 5) {
      hitMap["hit"] += 1
    }
    if (rolled === 1) {
      hitMap["miss"] += 1
    }
  }
  if (hitMap["miss"] > entry/2) {
    hitMap["glitch"] = true
    if (hitMap["hit"] < 1) {
      hitMap["critGlitch"] = true
    }
  }
  let glitch = ""
  if (hitMap.glitch) {
    if (hitMap.critGlitch) {
      glitch += `C R I T I C A L   `;
    }
    glitch = `\n` + glitch + `G L I T C H`;
  }
  slimbot.sendMessage(chat.id, userMessage + input+`d6:\n\nRolled: [ ` + hitMap.rolled + ` ]\nHits: ` + hitMap.hit + glitch)
    .catch(console.log)
}

function rollDice(command, message) {
  const {text, chat} = message
  var expression = text.substring(command.length, text.length).trim()
  const [rollExpression] = expression.split(` `)

  if (rollExpression.length > 7) {
    slimbot.sendMessage(chat.id, message.from.username + `, sério mesmo... sem trollar.`)
      .catch(console.log)
    return
  }

  var userMessage = getUserMessage(message)
  var output
  try {
    output = roll.roll(rollExpression)
  } catch (e) {
    if (e.name == `InvalidInputError`) {
      slimbot.sendMessage(chat.id, userMessage + `digita os trem direito sô`)
      return
    } else {
      console.log(e)
    }
  }

  slimbot.sendMessage(chat.id, userMessage + expression + `:\n\nRolled: [ ` + output.rolled + ` ]\nTotal: ` + output.result)
    .catch(console.log)
}

// Register listeners
slimbot.on(`message`, async (message) => {
  const {text, chat} = message
  console.log(`chat.id`, chat.id, `message`, text)
  if (text) {
    if (text.indexOf(`(AF)`) >= 0) {
      slimbot.sendPhoto(chat.id, aishoUrl)
        .catch(console.log)
    }
    if (text.indexOf(`(SF)`) >= 0) {
      slimbot.sendPhoto(chat.id, shiryuUrl)
        .catch(console.log)
    }
    else if (text.startsWith(ROLL)) {
      rollDice(ROLL, message)
    } else if (text.startsWith(R)) {
      rollDice(R, message)
    } else if (text.startsWith(POLEMICA)) {
      slimbot.sendMessage(chat.id, `Blz, lá vai:\n\n` + ASSUNTOS[Math.floor(Math.random() * ASSUNTOS.length)])
        .catch(console.log)
    } else if (text.startsWith(SHADOWRUN)) {
      shadowrunRoll(message)
    }
  }
})

// Call API
console.log(`listening...`)
slimbot.startPolling()

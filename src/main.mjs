import Slimbot from 'slimbot'
import Roll from 'roll'

const roll = new Roll()
const slimbot = new Slimbot(process.env[`TELEGRAM_BOT_TOKEN`])

// Commands
const ROLL = `/roll`
const R = `/r`
const POLEMICA = `/criar_polemica`

const ASSUNTOS = [
  `A terra é redonda!`,
  `PC > VG`,
  `Star Wars I, II, III é bom`,
  `Linux > Windows`,
  `Fone de Ouvido > Caixinha de som`,
  `Meia soquete é top`,
  `Esposa > Amigos`,
  `Dwarf Fortress > God of War`,
  `PT > PSDB`,
  `Deus > Buda`,
  `Batman 3 é bom`,
  `Jessica Jones > Luke Cage`,
  `Android > iOS`
]

const TIMEOUT = 3000

const aishoUrl = `https://imgur.com/a/kg2TW`

function rollDice(command, message) {
  const {text, chat} = message
  var expression = text.substring(command.length, text.length).trim()
  const [rollExpression] = expression.split(` `)

  console.log(rollExpression)

  if (rollExpression.length > 7) {
    slimbot.sendMessage(chat.id, message.from.username + `, sério mesmo... sem trollar.`)
      .catch(console.log)
    return
  }

  var userMessage = message.from.username ? message.from.username + ` => ` : ``
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
    else if (text.startsWith(ROLL)) {
      rollDice(ROLL, message)
    } else if (text.startsWith(R)) {
      rollDice(R, message)
    } else if (text.startsWith(POLEMICA)) {
      slimbot.sendMessage(chat.id, `Blz, lá vai:\n\n` + ASSUNTOS[Math.floor(Math.random() * ASSUNTOS.length)])
        .catch(console.log)
    }
  }
})

// Call API
console.log(`listening...`)
slimbot.startPolling()

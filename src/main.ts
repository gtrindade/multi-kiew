import * as Slimbot from 'slimbot'
import * as Roll from 'roll'

const roll = new Roll()
const slimbot = new Slimbot(process.env[`TELEGRAM_BOT_TOKEN`])

// Commands
const ROLL = `/roll`
const POLEMICA = `/criar_polemica`

const ASSUNTOS = [`A terra é redonda!`, `PC > VG`, `Star Wars I, II, III é bom`, `Linux > Windows`, `Fone de Ouvido > Caixinha de som`, `Meia soquete é top`, `Esposa > Amigos`, `Dwarf Fortress > God of War`, `PT > PSDB`, `Deus > Buda`, `Batman 3 é bom`, `Jessica Jones > Luke Cage`, `Android > iOS`]

const TIMEOUT = 3000

const aishoUrl = `https://imgur.com/a/kg2TW`

// Register listeners
slimbot.on(`message`, async (message: any) => {
  const {text, chat} = message
  console.log(`chat.id`, chat.id)
  if (text) {
    if (text.indexOf(`(AF)`) >= 0) {
      slimbot.sendPhoto(chat.id, aishoUrl)
        .catch(console.log)
    }
    else if (text.startsWith(ROLL)) {
      var expression = text.substring(ROLL.length, text.length).trim()
      const [rollExpression] = expression.split(` `)

      if (rollExpression.length > 7) {
        slimbot.sendMessage(chat.id, message.from.username + `, sério mesmo... sem trollar.`)
        return
      }

      var output = roll.roll(rollExpression)
      slimbot.sendMessage(chat.id, message.from.username + ` => ` + expression + `:\n\nRolled: [ ` + output.rolled + ` ]\nTotal: ` + output.result)
    } else if (text.startsWith(POLEMICA)) {
      slimbot.sendMessage(chat.id, `Blz, lá vai:\n\n` + ASSUNTOS[Math.floor(Math.random() * ASSUNTOS.length)])
    }
  }
})

// Call API
console.log(`listening...`)
slimbot.startPolling()

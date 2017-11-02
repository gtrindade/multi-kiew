import * as Slimbot from 'slimbot'
import * as Roll from 'roll'
// import * as fs from 'fs'
import * as net from 'net'

const roll = new Roll()
const slimbot = new Slimbot(process.env[`TELEGRAM_BOT_TOKEN`])

const ROLL = `/roll`
const SERVER_STATUS = `/status`
const POLEMICA = `/criar_polemica`
const ASSUNTOS = [`A terra é redonda!`, `PC > VG`, `Star Wars I, II, III é bom`, `Linux > Windows`, `Fone de Ouvido > Caixinha de som`, `Meia soquete é top`, `Esposa > Amigos`, `Dwarf Fortress > God of War`, `PT > PSDB`, `Deus > Buda`, `Batman 3 é bom`, `Jessica Jones > Luke Cage`, `Android > iOS`]

const MINE_HOST = `73.15.19.24`
const MINE_PORT = 25565
const TIMEOUT = 3000

// Register listeners
slimbot.on(`message`, (message: any) => {
  const {text} = message
  if (text) {
    if (text.startsWith(ROLL)) {
      var expression = text.substring(ROLL.length, text.length).trim()
      const [rollExpression] = expression.split(` `)

      if (rollExpression.length > 7) {
        slimbot.sendMessage(message.chat.id, message.from.username + `, sério mesmo... sem trollar.`)
        return
      }

      var output = roll.roll(rollExpression)
      slimbot.sendMessage(message.chat.id, message.from.username + ` => ` + expression + `:\n\nRolled: [ ` + output.rolled + ` ]\nTotal: ` + output.result)
    } else if (text.startsWith(SERVER_STATUS)) {
      var target = text.substring(SERVER_STATUS.length, text.length).trim()

      switch (target) {
      case `mine`:
      case `minecraft`:
        const msgPrefix = SERVER_STATUS.substring(1, SERVER_STATUS.length) + ` => ` + target
        const client = new net.Socket()
        client.setTimeout(TIMEOUT)

        client.connect(MINE_PORT, MINE_HOST, () => {
          slimbot.sendMessage(message.chat.id, msgPrefix + `:\n\nEstá ligado! =D`)
          client.destroy()
        })
        const errorHandler = () => {
          slimbot.sendMessage(message.chat.id, msgPrefix + `:\n\nEstá desligado... =(`)
          client.destroy()
        }
        client.on(`timeout`, errorHandler)
        client.on(`error`, errorHandler)


        break
      default:
        slimbot.sendMessage(message.chat.id, SERVER_STATUS.substring(1, SERVER_STATUS.length) + ` => ` + target + `:\n\nIsso non ecziste!`)
        break
      }
    } else if (text.startsWith(POLEMICA)) {
      slimbot.sendMessage(message.chat.id, `Blz, lá vai:\n\n` + ASSUNTOS[Math.floor(Math.random() * ASSUNTOS.length)])
    }
  }
})

// Call API

console.log(`listening...`)
slimbot.startPolling()

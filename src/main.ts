import * as Slimbot from 'slimbot'
import * as Roll from 'roll'
import * as net from 'net'
import uscis from './uscis'
import {Repeaters, Repeatable} from './repeater'
import ups from './ups'

const roll = new Roll()
const slimbot = new Slimbot(process.env[`TELEGRAM_BOT_TOKEN`])

// Commands
const ROLL = `/roll`
const SERVER_STATUS = `/status`
const POLEMICA = `/criar_polemica`
const USCIS = `/uscis`
const UPS = `/ups`

const ASSUNTOS = [`A terra é redonda!`, `PC > VG`, `Star Wars I, II, III é bom`, `Linux > Windows`, `Fone de Ouvido > Caixinha de som`, `Meia soquete é top`, `Esposa > Amigos`, `Dwarf Fortress > God of War`, `PT > PSDB`, `Deus > Buda`, `Batman 3 é bom`, `Jessica Jones > Luke Cage`, `Android > iOS`]

const MINE_HOST = `73.15.19.24`
const MINE_PORT = 25565
const TIMEOUT = 3000

const aishoUrl = `https://imgur.com/a/kg2TW`

const repeaters = new Repeaters()

// Register listeners
slimbot.on(`message`, async (message: any) => {
  const {text, chat} = message
  console.log(`chat.id`, chat.id)
  if (text) {
    if (text.indexOf(`(AF)`) >= 0) {
      slimbot.sendPhoto(chat.id, aishoUrl)
        .catch(console.log)
    }
    if (text.startsWith(USCIS)) {
      var name = text.substring(USCIS.length, text.length).trim()
      const request = uscis[name]
      if (request) {
        const response = await request()
        slimbot.sendMessage(chat.id, response)
      } else {
        slimbot.sendMessage(chat.id, `User not found`)
      }
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
    } else if (text.startsWith(SERVER_STATUS)) {
      var target = text.substring(SERVER_STATUS.length, text.length).trim()

      switch (target) {
      case `mine`:
      case `minecraft`:
        const msgPrefix = SERVER_STATUS.substring(1, SERVER_STATUS.length) + ` => ` + target
        const client = new net.Socket()
        client.setTimeout(TIMEOUT)

        client.connect(MINE_PORT, MINE_HOST, () => {
          slimbot.sendMessage(chat.id, msgPrefix + `:\n\nEstá ligado! =D`)
          client.destroy()
        })
        const errorHandler = () => {
          slimbot.sendMessage(chat.id, msgPrefix + `:\n\nEstá desligado... =(`)
          client.destroy()
        }
        client.on(`timeout`, errorHandler)
        client.on(`error`, errorHandler)

        break
      default:
        slimbot.sendMessage(chat.id, SERVER_STATUS.substring(1, SERVER_STATUS.length) + ` => ` + target + `:\n\nIsso non ecziste!`)
        break
      }
    } else if (text.startsWith(UPS)) {
      var directives = text.substring(UPS.length, text.length).trim().split(` `)
      const [command, tracking, interval] = directives
      if (command == `add`) {
        if (!interval || interval < 1) {
          slimbot.sendMessage(chat.id, `Invalid command`)
        } else {
          repeaters.remove(tracking)
          const initialValue = await repeaters.add({
            name: tracking,
            interval,
            chatId: chat.id,
            kind: `ups`,
            success: (result: any) => slimbot.sendMessage(chat.id, `UPS updated!\n${result}`),
            failure: () => console.log(`Nothing changed on tracking ${tracking}`),
            func: () => ups(tracking),
          })
          slimbot.sendMessage(chat.id, `Tracking added for every ${interval} minute(s)\nInitial Result:\n${initialValue}`)
        }
      } else if (command == `remove`) {
        repeaters.remove(tracking)
        slimbot.sendMessage(chat.id, `Successfully removed ${tracking}`) 
      } else if (command == `list`) {
        const trackingNumbers = repeaters.getByKind(`ups`).map((tracker) => `${tracker.name} - every ${tracker.interval} minute(s)`).join(`\n`)
        if (trackingNumbers !== ``) {
          slimbot.sendMessage(chat.id, `Currently Tracking:\n${trackingNumbers}`) 
        } else {
          slimbot.sendMessage(chat.id, `Not tracking anything right now`) 
        }
      } else {
        slimbot.sendMessage(chat.id, `Invalid command.`)
      }
    } else if (text.startsWith(POLEMICA)) {
      slimbot.sendMessage(chat.id, `Blz, lá vai:\n\n` + ASSUNTOS[Math.floor(Math.random() * ASSUNTOS.length)])
    }
  }
})

const archeryChat = -1001057198275
const uscisNames = Object.keys(uscis)
uscisNames.map(async (name: string) => {
  const added = await repeaters.add({
    name,
    kind: `uscis`,
    chatId: archeryChat,
    func: uscis[name],
    success: () => slimbot.sendMessage(archeryChat, `USCIS date updated for ${name}!`),
    failure: () => console.log(`nothing uptated`),
    interval: 1
  })
  console.log(`started tracking uscis for ${name} with initial result:\n${added}`)
})

// Call API
console.log(`listening...`)
slimbot.startPolling()

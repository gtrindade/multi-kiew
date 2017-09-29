var Slimbot = require(`slimbot`)
var net = require(`net`)
var Roll = require(`roll`)
var roll = new Roll()
var slimbot = new Slimbot(`445546217:AAFYhLu9iou0I9VNfb4g4jGs6QPvW5KD5Sg`)

var ROLL = `/roll`
var SERVER_STATUS = `/status`
var POLEMICA = `/criar_polemica`
var ASSUNTOS = [`PC > VG`, `Star Wars I, II, III é bom`, `Linux > Windows`, `Fone de Ouvido > Caixinha de som`, `Meia soquete é top`, `Esposa > Amigos`, `Dwarf Fortress > God of War`, `PT > PSDB`, `Deus > Buda`, `Batman 3 é bom`, `Jessica Jones > Luke Cage`, `Android > iOS`]

var MINE_HOST = `73.15.19.24`
var MINE_PORT = 25565
var TIMEOUT = 3000

// Register listeners
slimbot.on(`message`, (message) => {
  var {text} = message
  var msgPrefix, errorHandler, client
  if (text) {
    if (text.startsWith(ROLL)) {
      var expression = text.substring(ROLL.length, text.length).trim()

      if (expression.length > 7) {
        slimbot.sendMessage(message.chat.id, message.from.username + `, seu palhaço, para com isso`)
        return
      }

      var output = roll.roll(expression)
      slimbot.sendMessage(message.chat.id, message.from.username + ` => ` + expression + `:\n\nRolled: [ ` + output.rolled + ` ]\nTotal: ` + output.result)
    } else if (text.startsWith(SERVER_STATUS)) {
      var target = text.substring(SERVER_STATUS.length, text.length).trim()

      switch (target) {
      case `mine`:
      case `minecraft`:
        msgPrefix = SERVER_STATUS.substring(1, SERVER_STATUS.length) + ` => ` + target
        client = new net.Socket()
        client.setTimeout(TIMEOUT)

        client.connect(MINE_PORT, MINE_HOST, () => {
          slimbot.sendMessage(message.chat.id, msgPrefix + `:\n\nEstá ligado! =D`)
          client.destroy()
        })
        errorHandler = () => {
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

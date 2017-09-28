var Slimbot = require("slimbot")
var slimbot = new Slimbot("445546217:AAFYhLu9iou0I9VNfb4g4jGs6QPvW5KD5Sg")

// Register listeners

slimbot.on("message", function(message) {
  console.log("message", message)
  slimbot.sendMessage(message.chat.id, "Message received")
})

// Call API

console.log("listening...")
slimbot.startPolling()

var express = require("express")
var app = express()
const fs = require("fs")
const sgMail = require("@sendgrid/mail")
var bodyParser = require("body-parser")
var validator = require("validator")
// .env file
require("dotenv").config()

app.set("port", process.env.PORT || 3010)
// to support JSON-encoded bodies
// app.use(bodyParser.json())
// to support URL-encoded bodies
app.use(
  bodyParser.urlencoded({
    extended: true
  })
)

if (process.env.DEBUG) {
  app.get("/", function(req, res) {
    console.log("Server UP")
  })
}

function _debug(text) {
  if (process.env.DEBUG) console.log(text)
}

let addToLog = (text, FILENAME = process.env.FILENAME) => {
  _debug(FILENAME)
  fs.appendFile(FILENAME, "\n" + text, err => {
    if (err) throw err
    _debug("File updated")
  })
}
/*
 * process.env.ALLOWED_IP - Make sure IPs are set up
 */
app.post("/gw", function(req, res) {
  let ip =
    req.ip ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress
  _debug("IP address: " + ip)

  if (ip != process.env.ALLOWED_IP && !process.env.DEBUG) {
    _debug("IP:", ip)

    let log = "[ " + Date() + " ] Unknown IP address :" + ip
    _debug(log)
    addToLog(log)
    res.status(404).send()
  } else {
    _debug(req.body)
    // _debug(req)
    let json = JSON.parse(Object.keys(req.body))
    console.dir(json)

    var { to, from, subject, text, html } = json
    _debug({ to, from, subject, text, html })

    // basic validation
    if (!validator.isEmail(to)) {
      _debug(to)
      res.send("Email is not valid")
    }
    // Source: https://www.npmjs.com/package/@sendgrid/mail
    sgMail.setApiKey(process.env.SENDGRID_API_KEY)
    const msg = {
      to: to,
      from: process.env.EMAIL_FROM_ADDRESS,
      subject: subject,
      text: text,
      html: html
    }
    sgMail.send(msg)
    _debug(sgMail)
    _debug(msg)
    _debug(res.statusCode)
    res.send({ status: res.statusCode })
  }
})

var server = app.listen(app.get("port"), function() {
  console.log("Listening on port %d", server.address().port)
})

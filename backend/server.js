require('dotenv').config() //load all the config variables from env

const express = require('express')
const app = express()
const mongoose = require('mongoose')

const bodyParser = require('body-parser')
const cors = require("cors");

app.use(cors())
mongoose.connect(process.env.DATABASE_URI, {useNewUrlParser: true, useUnifiedTopology: true})

//Checking the DB Connection 
const db = mongoose.connection
db.on('error', (error) => console.error(error)) //If there is an error log the error
db.once('open', () => (console.log('Connected to Database'))) //Once you can open/connect to Database, log that there was a connection

//Let the server accept JSON
app.use(bodyParser.json())

const gameRouter = require("./routes/gameRoute")
app.use('/gameModel', gameRouter)

const userRouter = require("./routes/userRoute");
app.use('/userModel', userRouter)

app.listen(8080, () => console.log('Server Started'))
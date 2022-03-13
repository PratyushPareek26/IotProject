const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

//iot
const dweetClient = require('node-dweetio');
const five = require('johnny-five');

const board = new five.Board();
const dweetio = new dweetClient();
//iot end   

const loginRouter = require('./routes/login');
const registerRouter = require('./routes/register');
const isLoggedInRouter = require('./routes/isLoggedIn');
const dashboardRouter = require('./routes/dashboard');

const app = express();
// app.use(cors())
app.use(express.json());
app.use(express.urlencoded({extended: false})) //bodyparser

//cors temporary stuff
app.use(
    cors({
      origin: "http://localhost:3000", // allow to server to accept request from different origin
      methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
      credentials: true // allow session cookie from browser to pass through
    })
  );


//mongodb connection
var MONGODB_URI = "";
if (process.env.NODE_ENV === 'production'){
    MONGODB_URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@cluster0.f6bee.mongodb.net/soe-project?retryWrites=true&w=majority`;
}
else{
    MONGODB_URI = "mongodb://localhost:27017/soe-project";
}

console.log('db uri', MONGODB_URI);
mongoose.connect(MONGODB_URI, {useNewUrlParser: true, useUnifiedTopology: true});

const db = mongoose.connection
db.once('open', () => console.log("db connection established successfully"));
db.on('err', err => console.log('error with db', err));
//mongodb connection end


app.use('/login', loginRouter)
app.use('/register', registerRouter)
app.use('/loggedin', isLoggedInRouter)
app.use('/dashboard', dashboardRouter)

//iot start
board.on('ready', () => {
  const temperatureSensor = new five.Sensor({
    pin: 'A0',
    threshold: 4
  });

  temperatureSensor.on('change', (value) => {
    const dweetThing = 'node-temperature-monitor';
    let Vo = value;
    const R1 = 10000;
    let logR2, R2, T;
    const c1 = 1.009249522e-03;
    const c2 = 2.378405444e-04;
    const c3 = 2.019202697e-07;
    R2 = R1 * (1023.0 / Vo - 1.0);
    logR2 = Math.log(R2);
    T = (1.0 / (c1 + c2 * logR2 + c3 * logR2 * logR2 * logR2));
    T = T - 273.15;
    T = (T * 9.0) / 5.0 + 32.0;
    T = (T - 32) * (5 / 9);
    const tweetMessage = {
      temperature: +T.toFixed(2)
    };

    dweetio.dweet_for(dweetThing, tweetMessage, (err, dweet) => {
      if (err) {
        console.log('[Error]: ', err);
      }
      if (dweet) {
        console.log(dweet.content);
      }
    });
  });
}); 
//iot end


// const Drinksaphe = require('./models/drinksaphe.model');
// app.post('/createdrinksaphe', (req, res) => {
//   const newd = new Drinksaphe()
//   newd.save().then(res => console.log('created', res)).catch(err => console.log('error in creating', err));
// })

app.listen(8080, () => console.log("server running at port 8080"))
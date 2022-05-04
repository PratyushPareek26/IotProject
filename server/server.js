const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

const loginRouter = require('./routes/login');
const logoutRouter = require('./routes/logout');
const registerRouter = require('./routes/register');
const userDataRouter = require('./routes/userData');
const updateProfileRouter = require('./routes/updateProfile');
const isLoggedInRouter = require('./routes/isLoggedIn');
const dashboardRouter = require('./routes/dashboard');
const alertEmailRouter = require('./routes/alertEmail');
const feedbackRouter = require('./routes/feedback');


const Drinksaphe = require('./models/drinksaphe.model');

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

//use environmental variables throughout the app
dotenv.config()

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
db.once('open', () => console.log("db connection established successfully "));
db.on('err', err => console.log('error with db', err));
//mongodb connection end

//firebase start
const admin = require('firebase-admin');
var serviceAccount = require('./admin.json');
// const { escapeRegExpChars } = require('ejs/lib/utils');
admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
	databaseURL: "https://iot-project-a6215-default-rtdb.firebaseio.com",
	authDomain: "iot-project-a6215-default-rtdb.firebaseio.com"
})
var dbf = admin.database();
var test = dbf.ref("test");

async function getTest(res) {
	let newvals
	await test.once('value', function(snap) {
		res.status(200).json({"test": snap.val()});
		console.log("snapval", snap.val());
		newvals = snap.val()
	})

	return newvals
};

app.post('/dashboard/updatepHFirebase', async function(req, res) {
	//res.send(test);
	
	const {id} = req.body;
	
	let newVals = await getTest(res);

	const currentpH = newVals.pH
	const currentTemp = newVals.Temperature
	const currentTDS = newVals.TDS

	console.log("newvals", newVals)
    console.log("cur", currentpH, currentTDS)

    Drinksaphe.findOne({"name": "drinksaphe"})
        .then(db => {

            //finding index of our cooler
            let idx = -1;
            for(let i=0; i<db.coolers.length; i++){
                if(db.coolers[i]._id.toString() === id.toString()){
                    console.log('i',i);
                    idx = i;
                }
            }
            console.log('cooler idx', idx);
            
            // updating values
            db.coolers[idx].currentpH = newVals.pH;
            db.coolers[idx].currentTemp = newVals.Temperature;
            db.coolers[idx].currentTDS = newVals.TDS;
            db.coolers[idx].numOfTimesMeasured++;
            if(newVals.pH >= db.coolers[idx].highestpH){
                db.coolers[idx].highestpH = newVals.pH;
            }

            //saving changes to db
            db.save()
                .then(data => {
                    console.log('updated and saved', data.coolers[idx])
                    // res.send(data)
                })
                .catch(err => console.log('err while saving', err))    
        })
        .then(data => res.send({data, currentpH, currentTemp, currentTDS}))
        .catch(err => console.log('err after saving', err))

});
//firebase end


app.use('/login', loginRouter)
app.use('/logout', logoutRouter)
app.use('/register', registerRouter)
app.use('/getUserData', userDataRouter)
app.use('/updateProfile', updateProfileRouter)
app.use('/loggedin', isLoggedInRouter)
app.use('/dashboard', dashboardRouter)
app.use('/alertEmail', alertEmailRouter)
app.use('/sendFeedback', feedbackRouter)

app.listen(process.env.PORT || 8080, () => console.log("server running at port 8080"))

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const moment = require('moment');
const { dbConnect, disconnect } = require('./lib/db')
const ClassModel = require('./schema/ClassModel')
const paypal = require('paypal-rest-sdk');
const PaymentModel = require('./schema/PaymentModel')
const ProgressModel = require('./schema/ProgressModel')

const app = express();
app.use(bodyParser.json());

const port = process.env.PORT || 3000;
app.use(cors());

paypal.configure({
    mode: "sandbox", //sandbox or live
    client_id: process.env.PAYPAL_CLIENT_ID,
    client_secret: process.env.PAYPAL_CLIENT_SECERET
});

app.get('/', (req, res) => {
    res.json({ greeting: 'hello World' });
});

app.get('/hi', async (req, res) => {
    try {
        await dbConnect();
        res.json({ message: "success" });
    } catch (error) {
        console.log(error)
        res.json({ message: "error" });
    }
})

app.post('/classes', async (req, res) => {
    try {
        const session = req.body.session;
        const time = req.body.time;
        const date = req.body.date;
        const onlineClass = req.body.class;
        const teacher = req.body.teacher;

        console.log(session, time, date, onlineClass, teacher);

        await dbConnect();

        const data = await ClassModel.create({
            session,
            date,
            time,
            teacher,
            class: onlineClass
        })
        console.log(data)
        res.json({ message: "success" });
    } catch (error) {
        res.json({ message: "error" });
    }

})

app.get('/all-classes', async (req, res) => {
    try {
        await dbConnect();
        const data = await ClassModel.find({})
        console.log(data)
        res.json({ message: "success", data });
    } catch (error) {
        console.log(error)
        res.json({ message: "error" });
    }

})

app.get('/classes', async (req, res) => {
    try {
        await dbConnect();

        const threeDaysFromNow = moment().add(3, 'days').toDate();

        // Query to find classes within 3 days from now
        const data = await ClassModel.find({
            date: {
                $gte: new Date(),
                $lte: threeDaysFromNow
            }
        });

        console.log(data);
        res.json({ message: "success", data });
    } catch (error) {
        console.error(error);
        res.json({ message: "error" });
    }
});

app.get('/classes/:className', async (req, res) => {
    try {
        await dbConnect();

        const className = req.params.className;


        const currentDate = new Date();
        const threeDaysLater = moment(currentDate).add(3, 'days').toDate();


        const data = await ClassModel.find({
            class: className,
            date: {
                $gte: currentDate,
                $lte: threeDaysLater
            }
        });

        console.log(data);
        res.json({ message: "success", data });
    } catch (error) {
        console.log(error);
        res.json({ message: "error" });
    }
});

app.get("/paypal", async (req, res) => {

    var payerID = req.query.payerID;
    var create_payment_json = {
        intent: "sale",
        payer: {
            payment_method: "paypal"
        },
        redirect_urls: {
            return_url: "https://psslr30s-3000.asse.devtunnels.ms/success",
            cancel_url: "https://psslr30s-3000.asse.devtunnels.ms/cancel"
        },
        transactions: [
            {
                item_list: {
                    items: [
                        {
                            name: "item",
                            sku: "item",
                            price: "1.00",
                            currency: "USD",
                            quantity: 1
                        }
                    ]
                },
                amount: {
                    currency: "USD",
                    total: "1.00"
                },
                description: "This is the payment description."
            }
        ]
    };

    paypal.payment.create(create_payment_json, async function (error, payment) {
        if (error) {
            throw error;
        } else {
            console.log("Create Payment Response");
            console.log(payment);
            await dbConnect();
            await PaymentModel.create({
                paymentId: payment.id,
                payerId: payerID,
                paymentState: payment.state,
                amount: payment.transactions[0].amount.total,
                month: moment().format('MMMM')
            })
            res.redirect(payment.links[1].href);
        }
    });
});

app.get("/success", (req, res) => {
    // res.send("Success");
    var PayerID = req.query.PayerID;
    var paymentId = req.query.paymentId;
    var execute_payment_json = {
        payer_id: PayerID,
        transactions: [
            {
                amount: {
                    currency: "USD",
                    total: "1.00"
                }
            }
        ]
    };

    paypal.payment.execute(paymentId, execute_payment_json, async function (
        error,
        payment
    ) {
        if (error) {
            console.log(error.response);
            throw error;
        } else {
            console.log("Get Payment Response");
            console.log(payment);
            await dbConnect();
            //find using paymentId and update state
            await PaymentModel.findOneAndUpdate({
                paymentId: payment.id
            },
                {
                    paymentState: payment.state
                });

            res.json({ message: "success" });
        }
    });
});

app.get("/cancel", (req, res) => {
    res.json({ message: "cancel" });
});

app.get("/checkpay/:payerid", async (req, res) => {
    try {


        const payerId = req.params.payerid;
        const month = moment().format('MMMM')

        await dbConnect();


        //check if there is a record matching for month payerId and  paymentState is approved
        const data = await PaymentModel.findOne(
            {
                payerId,
                month,
                paymentState: "approved"
            }
        );

        if (data) {
            res.json({ message: "success", data });
        }
        else {
            res.json({ message: "not paid yet" });
        }
    } catch (error) {
        console.log(error)
        res.json({ message: "error" });
    }
})

app.post('/progress', async (req, res) => {
    try {
        // Extract student email and progress data from request body
        const { student, subjects, remark } = req.body;

        // Calculate current month using Moment.js
        const currentMonth = moment().format('MMMM');
        await dbConnect();

        // Check if there is a record with the student email and current month
        let progressRecord = await ProgressModel.findOne({ student, month: currentMonth });

        if (progressRecord) {
            // If record exists, update it
            progressRecord.subjects = subjects;
            progressRecord.remark = remark;
            await progressRecord.save();
            res.status(200).json({ message: 'Progress record updated successfully' });
        } else {
            // If record doesn't exist, create a new one
            progressRecord = new ProgressModel({
                student,
                subjects,
                remark,
                month: currentMonth,
            });
            await progressRecord.save();
            res.status(201).json({ message: 'Progress record created successfully' });
        }

    } catch (error) {
        console.error('Error handling progress:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/progress', async (req, res) => {
    try {
        await dbConnect();
        // Fetch all progress records from the database
        const allProgressRecords = await ProgressModel.find();
        res.status(200).json(allProgressRecords);
    } catch (error) {
        console.error('Error fetching progress records:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/progress/:studentEmail', async (req, res) => {
    try {
        const studentEmail = req.params.studentEmail;
        await dbConnect();

        // Fetch latest progress record for the student email
        const studentProgressRecord = await ProgressModel.findOne({ student: studentEmail }).sort({ created: -1 });
        
        res.status(200).json(studentProgressRecord);
    } catch (error) {
        console.error('Error fetching progress records:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/progress/:studentEmail/recent', async (req, res) => {
    try {
        const studentEmail = req.params.studentEmail;
        await dbConnect();

        // Fetch latest 5 progress record for the student email
        const studentProgressRecord = await ProgressModel.find({ student: studentEmail }).sort({ created: -1 }).limit(5);  
        res.status(200).json(studentProgressRecord);
    } catch (error) {
        console.error('Error fetching progress records:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});
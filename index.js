const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const app = express();
require('dotenv').config();
const port = process.env.PORT || 3000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

app.use(cors({
  origin: ['http://localhost:5173'],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.9clsv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

  //  jobs related API's
  const jobsCollection = client.db('jobPortal').collection('jobs');
  const jobApplicationCollection = client.db('jobPortal').collection('job_applications');

  // Auth related api's
  app.post('/jwt', async (req, res) => {
    const user = req.body;
    const token = jwt.sign(user, process.env.JWT_SECRET, {expiresIn: '1h'});
    res
    .cookie('token', token, {
      httpOnly: true,
      secure: false,

    })
    .send({success: true});
  })

  // jobs related API
  app.get('/jobs', async(req, res) => {
     const email = req.query.email;
     let query = {};
     if(email){
        query = { hr_email: email }
     }

     const cursor = jobsCollection.find(query);
     const result = await cursor.toArray();
     res.send(result);
  })

  app.get('/jobs/:id', async (req,res) => {
    const id = req.params.id;
    const query = {_id: new ObjectId(id)}
    const result = await jobsCollection.findOne(query);
    res.send(result);
  })

  app.post('/jobs', async(req, res) => {
    const newJob = req.body;
    const result = await jobsCollection.insertOne(newJob);
    res.send(result)
  })

  // job application apis
  // get all data

  app.get('/job-application', async (req,res) => {
    const email = req.query.email;
    const query = { applicant_email: email }

    console.log('worst Day', req.cookies)

    const result = await jobApplicationCollection.find(query).toArray();

    // worst way to aggregate data
    for(const application of result) {
      console.log(application.job_id)
      const query = {_id: new ObjectId(application.job_id)}
      const job = await jobsCollection.findOne(query);
      if(job){
        application.title = job.title;
        application.company = job.company;
        application.location = job.location;
        application.company_logo = job.company_logo;

      }
    }

    res.send(result);
  })

  app.get('/job-applications/jobs/:job_id', async (req, res) => {
    const jobId = req.params.job_id;
    const query = { job_id: jobId }
    const result = await jobApplicationCollection.find(query).toArray();
    res.send(result)
  })
  
  app.post('/job-applications', async(req,res) =>{
    const application = req.body;
    const result = await jobApplicationCollection.insertOne(application);

    // Worst Way
    const id = application.job_id;
    const query = {_id: new ObjectId(id)}
    const job = await jobsCollection.findOne(query);
    let newCount = 0;
    if(job.applicationCount){
      newCount = job.applicationCount + 1;
    } else{
      newCount = 1;
    }

    // now update the job info
    const filter = {_id: new ObjectId(id)};
    const updatedDoc = {
      $set: {
        applicationCount: newCount
      }
    }

    const updatedResult = await jobsCollection.updateOne(filter, updatedDoc)

    res.send(result);
  });

  app.patch('/job-applications/:id', async(req, res) => {
    const id = req.params.id;
    const data = req.body;
    const filter = {_id: new ObjectId(id)};
    const updatedDoc = {
      $set: {
        status: data.status
      }
    }
    const result = await jobApplicationCollection.updateOne(filter, updatedDoc);
    res.send(result)
  })

  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/',(req, res) => {
  res.send('Job is falling from the sky')
})

app.listen(port, () => {
  console.log(`Job is waiting at: ${port}`)
})
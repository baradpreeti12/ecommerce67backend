const express=require('express');
const cors=require('cors')
const mongoose=require('mongoose');
const bcrypt=require('bcrypt');
const dotenv=require('dotenv');
dotenv.config()
const app=express();
const rateLimit=require('express-rate-limit');
const helmet=require('helmet')
const nodemailer = require('nodemailer');
require('dotenv').config();
const jwt=require('jsonwebtoken')
const port=process.env.PORT
//middleware 
const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
	standardHeaders: 'draft-8', // draft-6: `RateLimit-*` headers; draft-7 & draft-8: combined `RateLimit` header
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
	ipv6Subnet: 56, // Set to 60 or 64 to be less aggressive, or 52 or 48 to be more aggressive
	// store: ... , // Redis, Memcached, etc. See below.
})

// Apply the rate limiting middleware to all requests.
app.use(limiter)
app.use(helmet())
app.use(cors());  
app.use(express.json())

//Step2-->establish a connection  ---> connection string
async function connection(){
   await mongoose.connect(process.env.MONGODBURL)
   console.log('Sever conected')
}

//step3-->create schema
let productschema=new mongoose.Schema({
    name:{type:String,required:true},
    price:{type:Number,required:true},
    qty:{type:Number,required:true},
    image:{type:String,required:true}
})

//s4--create a model
let productmodel=mongoose.model('products',productschema)

//===userschema======/
let userschema=new mongoose.Schema({
    username:{type:String,required:true,unique:true},
    password:{type:String,required:true},
    email:{type:String,required:true}
})

let usermodel=mongoose.model('users',userschema);


//api--1
app.get('/status',function(req,res){
    res.json('server is active')
})

app.get('/userdetails',function(req,res){
    let age=req.query.age;
    let location=req.query.location;
    res.json({
        message:`this person age is ${age} and his/her location is ${location}`
    })
})


//api-2--->store productsa in database
app.post('/products',async function(req,res){
    try {
    const {name,price,image,qty}=req.body
        let products= await productmodel.create({name,price,image,qty})
        res.status(201).json({
            message:"product added successfully"
        })
    } catch (error) {
        res.json({
            message:error.message
        })
    }
})

//api3
app.get('/products',async function(req,res){
    try {
        let products= await productmodel.find();
        res.status(200).json({
            products
        })
        }catch (error) {
         res.json({
            message:error,message
         }) 
 }
})
   //api4--->deletesource
   app.delete('/product',async function(req,res){
    try {
        const {_id}=req.body;
        let product=await productmodel.findByIdAndDelete(_id);
        res.json({
            message:"product deleted successfully"
        })
    } catch (error) {
        res.json({
            message:error.message
        })
    }
   })
      
//api-5--->update a resource
app.put('/products',async function(req,res){
    try {
        const {_id,name}=req.body;
        let product=await productmodel.findByIdAndUpdate(_id,name)
        res.json({
            message:"product is updated successfully"
        })
    } catch (error) {
        res.json({
            message:error.message
        })
    }
})


async function hashing(){
    let password="Rohan@123"
    let finalpassword=await bcrypt.hash(password,5);
    console.log(finalpassword);
}
//api-6-->store registration details
app.post('/register',async function(req,res){
    try {
        const {username,password,email}=req.body;
        let user = await usermodel.findOne({username})
        if(user) return res.json({message:"user already exists"})
        let hashpassword=await bcrypt.hash(password,10);
        let finaluser= await usermodel.create({username,password:hashpassword,email})
        res.json({
            message:"Registration successfull"
        })
    }
     catch (error) {
        res.json({
            message:error.message
        })
    }  
})

//api-7-->login
app.post('/login',async function(req,res){
    try {
        const {username,password}=req.body;
        let user= await usermodel.findOne({username})
      
        if(!user) return res.json({message:"user not found"})
        let authuser=await  bcrypt.compare(password,user.password);
    if(!authuser) return res.json({message:"Invalid credentials"})
    //token generation
    let Secret=rohan123
    let token=await jwt.sign({user:username},Secret,{expiresIn:'1hr'})
      if(!token) return res.json({
        message:"token is required"
      })
        res.json({message:"login successful"},token)
    } catch (error) {
        res.json({
            message:error.message
        })
    }
})
app.listen(port,async function(){
    console.log(`the server is running on ${port}`)
   await connection();
    console.log('Db is connected')
    hashing();
}) 


 
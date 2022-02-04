const express = require('express');
const mongoose = require('mongoose');
const user = require('./userSchema');
const product = require('./productSchema');

const jwt = require('jsonwebtoken');

//Middleware for authenticating the user using JWT
const middleware = require('./Auth');


const cors = require('cors');
const app = express();

//Database connection
mongoose.connect("mongodb+srv://Naveen2001:Naveen8@2001@cluster0.n5oqy.mongodb.net/myFirstDatabase?retryWrites=true&w=majority",{
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useCreateIndex : true
}).then(
    () => console.log('DB Connected...')
)

app.use(express.json());

app.use(cors({origin:"*"}))

//Params
const getUserById = async(req,res,next,userId) => {
    let UserWithId = await user.findById(userId);
    if(!UserWithId){
        return res.status(400).send('User not found');
    }
    req.person = UserWithId;
    next();
}

const getProductById = async(req,res,next,productId) => {
    let productWithId = await product.findById(productId);
    if(!productWithId){
        return res.status(400).send('Product not found');
    }
    req.product = productWithId;
    next();
}

app.param('userId', getUserById);
app.param('productId', getProductById);

///////////////

//User Routes

//Route for new users to register
app.post('/signup', async (req, res) =>{
    try{
        const {username,email,password,confirmpassword} = req.body;
        let exist = await user.findOne({email})
        if(exist){
            return res.status(400).send('User Already Exist')
        }
        if(password !== confirmpassword){
            return res.status(400).send('Passwords are not matching');
        }
        let newUser = new user({
            username,
            email,
            password,
            confirmpassword
        })
        await newUser.save();
        res.status(200).send('Registered Successfully')

    }
    catch(err){
        console.log(err)
        return res.status(500).send('Internel Server Error')
    }
})

//Route for user to login

app.post('/login', async (req, res) => {
    try{
        const {email,password} = req.body;
        let exist = await user.findOne({email});
        if(!exist) {
            return res.status(400).send('User Not Found');
        }
        if(exist.password !== password) {
            return res.status(400).send('Invalid credentials');
        }
        let payload = {
            user:{
                id : exist.id
            }
        }
        jwt.sign(payload,'jwtSecret',{expiresIn:3600000},
          (err,token) =>{
              if (err) throw err;
              return res.json({token})
          }  
        )

    }
    catch(err){
        console.log(err);
        return res.status(500).send('Server Error')
    }
})

//Route to display all the products present in the database

app.get('/products', middleware, async(req, res)=>{
    try{
        let exist = await user.findById(req.user.id);
        if(!exist){
            return res.status(400).send('User not found');
        }

        let products = await product.find();
        res.json(products);
    }
    catch(err){
        console.log(err);
        return res.status(500).send('Server Error')
    }
})

//Route to display particular product with a given product ID

app.get('/products/:productId', middleware, async(req, res)=>{
    try{
        const productWithId = req.product;
        if(!productWithId){
            return res.status(400).send('Product not found');
        }
        res.json(productWithId);
    }
    catch(err){
        console.log(err);
        return res.status(500).send('Server Error')
    }
})

///Admin Routes

//Route for creating new products
app.post('/products/addproduct/:userId', middleware, async(req,res) => {
    if(req.person.role === 0){
        return res.send('Not an Admin!!');
    }
    const {name,price} = req.body;
    const newProduct = new product({
        name,
        price
    })

    await newProduct.save();
    return res.status(200).send('Product added Successfully!!')
})

//Route to delete existing product
app.delete('/products/deleteproduct/:productId/:userId', middleware, async(req,res) => {
    if(req.person.role === 0){
        return res.send('Not an Admin!!');
    }
 
    await product.findByIdAndDelete(req.product._id);
    return res.status(200).send('Product deleted Successfully!!')
})

//Route to update product
app.put('/products/updateproduct/:productId/:userId', middleware, async(req,res) => {
    if(req.person.role === 0){
        return res.send('Not an Admin!!');
    }
 
    await product.findByIdAndUpdate(
    { _id: req.product._id },
    { $set: req.body },
    { new: true, useFindAndModify: false },
    (err, updatedProduct) => {
      if (err) {
        return res.status(400).json({
          error: "You are not authorized to update this user"
        });
      }
      res.json(updatedProduct);
    }
  );
})

///////////

app.listen(5000,()=>{
    console.log('Server running on port 5000')
})
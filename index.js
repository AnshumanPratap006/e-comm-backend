const express = require('express');
const cors = require('cors');
require('./db/config')
const User = require('./db/User')
const Product = require('./db/Product')
const jwt = require('jsonwebtoken')
const jwtKey = 'e-comm'
app = express();
app.use(cors());
app.use(express.json());
app.post("/register", async (req, resp) => {
    const user = new User(req.body)
    let result = await user.save();
    result = result.toObject();
    delete result.password
    jwt.sign({ user }, jwtKey, { expiresIn: "2h" }, (err, token) => {
        if (err) {
            resp.send({ result: 'something went wrong, please try after sometime' })

        } else {
            resp.send({ result, auth: token })

        }

    })
})
app.post('/login', async (req, resp) => {
    if (req.body.password && req.body.email) {
        let user = await User.findOne(req.body).select('-password');
        if (user) {
            jwt.sign({ user }, jwtKey, { expiresIn: "2h" }, (err, token) => {
                if (err) {
                    resp.send({ result: 'something went wrong, please try after sometime' })

                } else {
                    resp.send({ user, auth: token })

                }

            })


        } else {
            resp.send({ result: 'no user found' })
        }
    } else {
        resp.send({ result: 'no user found' })
    }


})

app.post(('/add-product'),verifyToken, async (req, resp) => {
    let product = new Product(req.body)
    let result = await product.save();
    resp.send(result);

})

app.get('/products',verifyToken, async (req, resp) => {
    let products = await Product.find();
    if (products.length > 0) {
        resp.send(products)
    } else {
        resp.send({ result: "no product found" })
    }
})
//
//
app.delete('/product/:id', verifyToken,async (req, resp) => {
    const result = await Product.deleteOne({ _id: req.params.id });
    resp.send(result);
})

app.get('/product/:id', verifyToken,async (req, resp) => {
    let result = await Product.findOne({ _id: req.params.id })
    if (result) {
        resp.send(result);
    } else {
        resp.send({ result: "no record found" })
    }
})

app.put('/product/:id', verifyToken,async (req, resp) => {
    let result = await Product.updateOne(
        { _id: req.params.id },
        {
            $set: req.body
        }
    )
    resp.send(result);
})

app.get('/search/:key', verifyToken, async (req, resp) => {
    let result = await Product.find({
        "$or": [
            { name: { $regex: req.params.key } },
            { company: { $regex: req.params.key } },
            { category: { $regex: req.params.key } }

        ]
    })
    resp.send(result)
})

function verifyToken(req, resp, next) {
    let token = req.headers['authorization']
    if (token) {
        token = token.split(' ')[1];
        jwt.verify(token, jwtKey, (err, valid) => {
            if (err) {
                resp.status(401).send({ result: "please provide vaid token" })

            } else {
                next();
            }

        })

    } else {
        resp.status(403).send({ result: "please add token with header" })

    }


}

const PORT = process.env.PORT || 5000;

app.listen(PORT);

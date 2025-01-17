const express = require('express')
const bcrypt = require('bcryptjs')
const { v4: uuidv4 } = require('uuid')
const { TypedJSON } = require('typedjson')
const { Business } = require('../dist/models/business')
const { parsePhoneNumberFromString } = require('libphonenumber-js')
const validator = require('validator')

const authRouter = express.Router()

const serializer = new TypedJSON(Business)

authRouter.post('/register', async (req, res) => {
    const business = serializer.parse(req.body)
    const requiredFields = [
        { key: 'name', label: 'Name' },
        { key: 'username', label: 'Username' },
        { key: 'email', label: 'Email' },
        { key: 'phone_number', label: 'Phone Number' },
        { key: 'password', label: 'Password' },
    ]

    const missingFields = requiredFields
        .filter((field) => !business[field.key])
        .map((field) => field.label)

    if (missingFields.length > 0) {
        return res
            .status(422)
            .send(`Missing field(s): ${missingFields.join(', ')}`)
    }

    const { session } = req
    const db = req.app.get('db')

    const usernameCheck = await db.auth.getUsernames(business.username)

    if (usernameCheck.length !== 0) {
        return res.status(409).send('Username Already Taken')
    }

    const phoneNumber = parsePhoneNumberFromString(business.phone_number, 'IN')
    if (
        business.phone_number &&
        (!phoneNumber || !phoneNumber.isValid() || phoneNumber.country !== 'IN')
    ) {
        return res
            .status(400)
            .send('Invalid phone number. Ensure it is a valid Indian number.')
    }
    business.phone_number = phoneNumber ? phoneNumber.format('E.164') : null

    if (business.email && !validator.isEmail(business.email)) {
        return res.status(400).send('Invalid email address.')
    }

    const salt = bcrypt.genSaltSync(10)
    const hash = bcrypt.hashSync(business.password, salt)

    business.id = uuidv4()
    console.log(business)
    let newBusiness = await db.auth.register([
        business.id,
        business.name,
        business.username,
        hash,
        business.phone_number || null,
        business.email || null,
    ])
    newBusiness = newBusiness[0]

    delete newBusiness.password
    delete business.password
    session.user = { ...newBusiness }

    res.status(201).send(session.user)
})

authRouter.post('/login', async (req, res) => {
    const business = serializer.parse(req.body)
    const db = req.app.get('db')
    const { session } = req

    let user = await db.auth.getUsernames(business.username)
    user = user[0]

    if (!user) {
        return res.status(404).send('Username does not exist')
    }

    const foundUser = bcrypt.compareSync(business.password, user.password)

    if (foundUser) {
        delete user.password
        delete business.password
        session.user = { ...user }
        return res.status(200).send(session.user)
    } else {
        return res.status(401).send('*Incorrect Password! Try Again')
    }
})

authRouter.post('/logout', (req, res) => {
    try {
        req.session.destroy()
        res.sendStatus(200)
    } catch (err) {
        console.log({ err })
    }
})

authRouter.get('/getUser', (req, res) => {
    const { user } = req.session
    if (user) {
        res.status(200).send(user)
    } else {
        res.sendStatus(401)
    }
})

module.exports = authRouter

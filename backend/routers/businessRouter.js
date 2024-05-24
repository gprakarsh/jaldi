const express = require('express')
const businessRouter = express.Router()
const { v4: uuidv4 } = require('uuid')
businessRouter.use(express.urlencoded({ extended: true }));
const { TypedJSON } = require('typedjson')
const { Business } = require('../dist/models/business')
const { Customer} = require('../dist/models/customer')
const customerSerializer = new TypedJSON(Customer)
const { parsePhoneNumberFromString } = require('libphonenumber-js');

businessRouter
    .route('/')
    .get(async (req, res) => {
        try {
            const { user } = req.session;
            if (!user) {
                return res.redirect(401, '../'); 
            }
            const db = req.app.get('db');
            const users = await db.business.getCustomers(user.id);
            const statusLists = {};
    
            Object.values(StatusEnum).forEach(status => {
                statusLists[status] = [];
            });
    
            users.forEach(({ status, customers }) => {
                if (statusLists[status]) {
                    statusLists[status] = customers;
                }
            });
    
            res.status(200).send(statusLists);
        } catch (error) {
            console.error('Error fetching customers:', error);
            res.status(500).send({ error: 'Internal Server Error' });
        }
    })
    .post(async (req, res) => {
        try {
            const { user } = req.session;
            if (!user) {
                return res.status(401).send('Unauthorized');
            }
    
            const customer = customerSerializer.parse(req.body);
 
            if (!Object.values(StatusEnum).includes(customer.status)) {
                return res.status(400).send('Invalid status provided.');
            }

            const phoneNumber = parsePhoneNumberFromString(customer.phone_number, 'IN');
            if (!phoneNumber || !phoneNumber.isValid() || phoneNumber.country !== 'IN') {
                return res.status(400).send('Invalid phone number. Ensure it is a valid Indian number.');
            }
            customer.phone_number = phoneNumber.format('E.164');
    
            const db = req.app.get('db');
            const phoneExists = await db.business.getCustomerFromPhone(customer.phone_number, user.id);
            if (phoneExists.length !== 0) {
                return res.status(409).send({ error: 'Phone number already exists' });
            }
    
            customer.id = uuidv4();
            let newUser = await db.business.newCustomer(
                customer.id,
                customer.first_name,
                customer.last_name,
                customer.phone_number,
                customer.status,
                user.id,
            );
            newUser = newUser[0];
    
            res.status(201).send(newUser);
        } catch (err) {
            console.error('Error adding new customer:', err);
            res.status(500).send('Internal Server Error');
        }
    })
    .put(async (req, res) => {
        try {
            const { user } = req.session;
            if (!user) {
                return res.status(401).send('Unauthorized');
            }
    
            const customer = customerSerializer.parse(req.body);
            if (!Object.values(StatusEnum).includes(customer.status)) {
                return res.status(400).send('Invalid status provided.');
            }
    
            const phoneNumber = parsePhoneNumberFromString(customer.phone_number, 'IN');
            if (!phoneNumber || !phoneNumber.isValid() || phoneNumber.country !== 'IN') {
                return res.status(400).send('Invalid phone number. Ensure it is a valid Indian number.');
            }
            customer.phone_number = phoneNumber.format('E.164');
    
            const db = req.app.get('db');
            try {
                let updatedCustomer = await db.business.updateCustomer(
                    customer.id,
                    customer.first_name,
                    customer.last_name,
                    customer.phone_number,
                    customer.status,
                    user.id,
                );
                if (updatedCustomer.length === 0) {
                    return res.status(404).send('Customer not found');
                }
                updatedCustomer = updatedCustomer[0];
                return res.status(200).send(updatedCustomer);
            } catch (err) {
                console.error('Error updating customer:', err);
                return res.sendStatus(500);
            }
        } catch (err) {
            console.error('Error processing request:', err);
            return res.status(500).send('Internal Server Error');
        }
    })
    .delete(async (req, res) => {
        try {
            const { user } = req.session;
            const { customer_id } = req.body;
    
            if (!user) {
                return res.status(401).send('Unauthorized');
            }
    
            const db = req.app.get('db');
            const deletedCustomer = await db.business.deleteCustomer(customer_id, user.id);
    
            if (deletedCustomer.length === 0) {
                return res.status(404).send('Customer not found');
            }
    
            return res.status(200).send('Customer deleted successfully');
        } catch (err) {
            console.error('Error deleting customer:', err);
            return res.status(500).send('Internal Server Error');
        }
    })    

    businessRouter.post('/notify', (req, res) => {
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const client = twilio(accountSid, authToken);
        let whatsappTo = req.body.whatsappTo;
        const messageSid = process.env.TWILIO_MESSAGE_SID;
        const contentSid = process.env.TWILIO_CONTENT_SID;
        const { user } = req.session;
    
        if (!user) {
            return res.status(401).send('Unauthorized');
        }
        whatsappTo = parsePhoneNumberFromString(whatsappTo, 'IN');
        if (!whatsappTo || !whatsappTo.isValid()) {
            return res.status(400).send('Invalid phone number for WhatsApp');
        }
    
        try {
            client.messages
                .create({
                    from: messageSid,
                    contentSid: contentSid,
                    contentVariables: JSON.stringify({
                        1: user.name,
                        2: addTelPrefix(user.phone_number) || 'tel:+919903099090',
                    }),
                    to: formatForWhatsapp(whatsappTo),
                })
                .then((message) => {
                    console.log(message);
                    res.sendStatus(200);
                })
                .catch((error) => {
                    console.error('Error sending message:', error);
                    res.status(500).send('Failed to send message');
                });
        } catch (err) {
            console.error('Unexpected error:', err);
            res.status(500).send('Internal Server Error');
        }
    });

    businessRouter.post('/whatsappResponse', async (req, res) => {
        try {
            const { From, Body } = req.body;
            const customer_phone_number = removeWhatsappPrefix(From);
            const phoneNumber = parsePhoneNumberFromString(customer_phone_number, 'IN');
            if (!phoneNumber || !phoneNumber.isValid() || phoneNumber.country !== 'IN') {
                return res.status(400).send({ error: 'Invalid phone number format' });
            }
    
            const db = req.app.get('db');
            let result = await db.business.getPhone(phoneNumber.format('E.164'));
            if (result.length === 0) {
                return res.status(409).send({ error: 'Phone number does not exist' });
            }
            const customer = result[0];
            const messageContent = Body;
            if (messageContent === ResponseEnum.CANCEL) {
                let updatedCustomer = await db.business.updateCustomer(
                    customer.id,
                    customer.first_name,
                    customer.last_name,
                    customer.phone_number,
                    StatusEnum.COMPLETED,
                    customer.business_id,
                );
                if (updatedCustomer.length === 0) {
                    return res.status(404).send('Customer not found');
                }
                updatedCustomer = updatedCustomer[0];
                return res.status(200).send(updatedCustomer);
            }
            
            res.sendStatus(200);
        } catch (err) {
            console.error('Error processing WhatsApp response:', err);
            res.status(500).send('Internal Server Error');
        }
    });
    

const ResponseEnum = {
    CONFIRM: 'Confirm',
    CANCEL: 'Cancel',
}
const StatusEnum = {
    WAITLIST: 'Waitlist',
    SERVING: 'Serving',
    COMPLETED: 'Completed',
    INACTIVE: 'Inactive',
}


const formatForWhatsapp = (number) => `whatsapp:${number.format('E.164')}`;
const addTelPrefix = (number) => `tel:${number}`;
const removeWhatsappPrefix = (number) => number.replace('whatsapp:', '');

module.exports = businessRouter
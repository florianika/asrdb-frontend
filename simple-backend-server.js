const express = require('express')
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken')

const app = express()
const port = 3000
app.use(cors())
app.use(bodyParser.json())

const ADMIN_USER = { id: '1',
  email: 'admin@test.com',
  name: 'Admin',
  surname: 'Administrator',
  role: 'ADMIN'
}
const NORMAL_USER = { id: '1',
  email: 'admin@test.com',
  name: 'Normal',
  surname: 'User',
  role: 'USER'
}

app.get('/', (req, res) => {
  res.send('OK')
})

app.post('/auth/signin', (req, res) => {
  let token = jwt.sign(req.body.email === 'admin@test.com' ? ADMIN_USER: NORMAL_USER, '1741hi3h123h13y123128ue198e1e2u128ej1e2');
  res.send(JSON.stringify(token))
})

app.post('/auth/signup', (req, res) => {
  res.sendStatus(200)
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

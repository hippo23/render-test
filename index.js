const express = require('express')
const morgan = require('morgan')
const app = express()

morgan.token('body', function getBody (req) {
  return JSON.stringify(req.body)
})

app.use(express.json())
app.use(morgan(function (tokens, req, res) {
  return [
    tokens.method(req, res),
    tokens.url(req, res),
    tokens.status(req, res),
    tokens.res(req, res, 'content-length'), '-',
    tokens['response-time'](req, res), 'ms',
    tokens.body(req, res)
  ].join(' ')
}))

let data = [
    { 
      "id": "1",
      "name": "Arto Hellas", 
      "number": "040-123456"
    },
    { 
      "id": "2",
      "name": "Ada Lovelace", 
      "number": "39-44-5323523"
    },
    { 
      "id": "3",
      "name": "Dan Abramov", 
      "number": "12-43-234345"
    },
    { 
      "id": "4",
      "name": "Mary Poppendieck", 
      "number": "39-23-6423122"
    }
]

const generateId = () => {
  const id = data.length > 0 ? Math.max(...data.map(x => Number(x.id))) : 0
  return String(id + 1)
}

app.get('/api/persons', (request, response) => {
  response.json(data)
})

app.get('/api/info', (request, response) => {
  var time = new Date().toLocaleTimeString()
  var no_requests = data.length
  response.send('<p> Phonebook has info for ' + no_requests + ' people </p> <p>' + time + '</p>')
})

app.get('/api/persons/:id', (request, response) => {
  const person = data.find((x) => x.id == request.params.id)
  if (person) {
    response.json(person)
  } else {
    response.status(400).json({
      error: 'no person with matching ID found'
    })
  }
})

app.post('/api/persons', (request, response) => {
  const body = request.body
  console.log(body)

  if (!body.name || !body.number) {
    return response.status(400).json({
      error: 'missing info'
    })
  }

  if (data.map(x => x.name).includes(body.name)) {
    return response.status(400).json({
      error: 'name is already in phonebook'
    })
  }

  const note = {
    id: generateId(),
    name: body.name,
    number: body.number
  }

  data = data.concat(note)

  response.json(note)
})

app.delete('/api/persons/:id', (request, response) => {
  data = data.filter((x) => x.id !== request.params.id)
  response.status(204).end()
})

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}

app.use(unknownEndpoint)

const PORT = 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

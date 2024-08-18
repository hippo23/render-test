require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')

const app = express()
const Person = require('./models/person')

morgan.token('body', function getBody(req) {
  return JSON.stringify(req.body)
})

app.use(express.static('dist'))
app.use(cors())
app.use(express.json())
app.use(
  morgan(function (tokens, req, res) {
    return [
      tokens.method(req, res),
      tokens.url(req, res),
      tokens.status(req, res),
      tokens.res(req, res, 'content-length'),
      '-',
      tokens['response-time'](req, res),
      'ms',
      tokens.body(req, res),
    ].join(' ')
  }),
)

app.get('/api/persons', async (request, response) => {
  Person.find({}).then((people) => {
    response.json(people)
  })
})

app.get('/api/info', async (request, response) => {
  var time = new Date().toLocaleTimeString()
  var no_requests = await Person.estimatedDocumentCount()
  response.send(
    '<p> Phonebook has info for ' +
      no_requests +
      ' people </p> <p>' +
      time +
      '</p>',
  )
})

// app.get('/api/persons/:name', (request, response) => {
//   Person.find({ username: request.params.name }).then(person => {
//     if (person) {
//       response.json(person)
//     } else {
//       response.status(400).json({
//         error: 'no person with matching name found'
//       })
//     }
//   })
// })

app.get('/api/persons/:id', (request, response, next) => {
  Person.findById(request.params.id)
    .then((person) => {
      if (person) {
        response.json(person)
      } else {
        response.status(404).end()
      }
    })
    .catch((error) => next(error))
})

app.post('/api/persons', async (request, response, next) => {
  const body = request.body

  if (!body.name || !body.number) {
    return response.status(400).json({
      error: 'missing info',
    })
  }

  Person.findOne({ username: body.name }).then((person) => {
    if (person) {
      person.number = body.number
      person
        .save({ validateBeforeSave: true })
        .then((updatedPerson) => response.json(updatedPerson))
        .catch((error) => next(error))
    } else {
      const person = new Person({
        username: body.name,
        number: body.number,
      })

      person
        .save()
        .then((savedPerson) => {
          response.json(savedPerson)
        })
        .catch((error) => next(error))
    }
  })
})

app.put('/api/persons/:id', async (request, response, next) => {
  const body = request.body

  if (!body.name || !body.number) {
    return response.status(400).json({
      error: 'missing info',
    })
  }

  Person.findOne({ username: body.name, _id: { $ne: request.params.id } })
    .then((person) => {
      if (person) {
        return response.status(400).json({
          error:
            'There is already a person in this database with the updated name',
        })
      } else {
        Person.findOne({ _id: request.params.id.toString() }).then((person) => {
          if (!person) {
            return response.status(400).json({
              error: 'There is no person with that ID in the database',
            })
          }
          person.username = body.name
          person.number = body.number

          person
            .save({ validateBeforeSave: true })
            .then((updatedPerson) => {
              response.json(updatedPerson)
            })
            .catch((error) => next(error))
        })
      }
    })
    .catch((error) => next(error))
})

app.delete('/api/persons/:id', async (request, response, next) => {
  Person.findByIdAndDelete({ _id: request.params.id })
    .then((person) => {
      if (person) {
        return response.json(person)
      } else {
        console.log('hatdog')
        return response
          .status(404)
          .send({ error: 'Person does not exist in the database' })
      }
    })
    .catch((error) => {
      next(error)
    })
})

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}

app.use(unknownEndpoint)

const errorHandler = (error, request, response, next) => {
  console.error(error.message)

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  } else if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message })
  }

  next(error)
}

app.use(errorHandler)

const PORT = process.env.PORT
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

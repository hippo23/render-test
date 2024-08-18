require('dotenv').config()

const mongoose = require('mongoose')
const url = process.env.MONGODB_URI

const validateNumber = async (number) => {
  number_array = number.split('-')
  if (number_array.length == 2) {
    if (2 <= number_array[0].length <= 3) {
      let is_num = (/^\d+$/.test(number_array[1]) && /^\d+$/.test(number_array[0]))
      if (is_num) {
        return true
      }
    }
  }
  return false
}

mongoose.set('strictQuery',false)

mongoose.connect(url)
  .then(() => {
    console.log('connected to MongoDB')
  })
  .catch(error => {
    console.log('error connecting to MongoDB:', error.message)
  })

const personSchema = new mongoose.Schema({
  username: {
    type: String,
    minLength: 3,
    required: true
  },
  number: {
    type: String,
    validate: {
      validator: validateNumber,
      message: props => `${props.value} is not a valid phone number!`
    },
    required: true
  }
})

personSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  }
})

module.exports = mongoose.model('Person', personSchema)

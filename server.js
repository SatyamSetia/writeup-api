const express = require('express');
const app = express();

app.use(express.json())
app.use(express.urlencoded({
  extended: true
}))

app.use('/',require('./routes/index'))
app.use('/user', require('./routes/user'))

app.listen(8080,() => {
  console.log('Server started on http://localhost:8080')
})

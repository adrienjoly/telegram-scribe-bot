import app from './app'

const { PORT = 8000 } = process.env

app.listen(PORT, () => console.log(`Listening on http://localhost:${PORT}`))

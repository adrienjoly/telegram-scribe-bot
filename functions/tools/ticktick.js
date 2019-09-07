require('dotenv').config({ path: '../../.env' }) // load environment variables
const ticktick = require('ticktick-wrapper')

const { TICKTICK_EMAIL, TICKTICK_PASSWORD } = process.env

const main = async () => {
  try {
    await ticktick.login({
      email: {
        username: TICKTICK_EMAIL,
        password: TICKTICK_PASSWORD,
      },
    })
  } catch (err) {
    throw new Error(`Error while trying to login to ticktick.com: ${err.stack}`)
  }

  const title = 'Automated task'
  const desc = 'This is a task added programatically via ticktick-wrapper'
  await ticktick.Inbox.addSimpleTask(title, desc)
  return { title, desc }
}

main()
  .then(task => {
    console.log('✅  Successfully added task:', task)
  })
  .catch(err => {
    console.error(err)
    process.exit(1)
  })

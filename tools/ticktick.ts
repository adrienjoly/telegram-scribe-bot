require('dotenv').config({ path: `${__dirname}/../.env` }) // load environment variables
import { Ticktick } from './../src/Ticktick'

const { TICKTICK_EMAIL, TICKTICK_PASSWORD } = process.env

const main = async () => {
  const ticktick = new Ticktick(
    TICKTICK_EMAIL as string,
    TICKTICK_PASSWORD as string
  )
  await ticktick.connect()
  const task = {
    title: 'Automated task',
    desc: 'This is a task added programatically via ticktick-wrapper',
  }
  await ticktick.addTask(task.title, task.desc)
  return task
}

main()
  .then(task => {
    console.log('✅  Successfully added task:', task)
  })
  .catch(err => {
    console.error(err)
    process.exit(1)
  })

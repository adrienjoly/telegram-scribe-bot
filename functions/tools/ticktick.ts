#!./node_modules/.bin/ts-node

// To test this API, run this command from the parent directory:
// $ tools/ticktick.ts

import { Ticktick } from '../src/services/Ticktick'

// load credentials from config file
const config = require(`${__dirname}/bot-config.js`) // eslint-disable-line @typescript-eslint/no-var-requires

const main = async (): Promise<{ title: string; desc: string }> => {
  const ticktick = new Ticktick(
    config.ticktick.email as string,
    config.ticktick.password as string
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
  .then((task) => {
    console.log('✅  Successfully added task:', task)
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })

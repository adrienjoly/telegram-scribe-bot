import ticktick from 'ticktick-wrapper'

export class Ticktick {
  emailCreds: { username: string; password: string }

  constructor(email: string, password: string) {
    this.emailCreds = { username: email, password }
  }

  async connect(): Promise<void> {
    try {
      await ticktick.login({ email: this.emailCreds })
    } catch (err) {
      throw new Error(
        `Error while trying to login to ticktick.com: ${err.stack}`
      )
    }
  }

  async addTask(
    title: string,
    desc?: string,
    date?: Date,
    isAllDay?: boolean
  ): Promise<void> {
    try {
      await ticktick.Inbox.addSimpleTask(title, desc, date, isAllDay)
    } catch (err) {
      throw new Error(
        `Error while trying to add a task to ticktick.com: ${err.stack}`
      )
    }
  }
}

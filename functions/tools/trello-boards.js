const { trello } = require('./../lib/trello')
trello.member.searchBoards('me').then(boards => {
  boards.map(({ id, name }) => console.log(`${id} \t ${name}`))
})

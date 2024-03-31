// we ignore index.js in the tests because it is the entry point of the application
// we don't do unit tests on it, only e2e tests

import Todo from "./todo.js"
import TodoRepository from "./todoRepository.js"
import TodoService from "./todoService.js"
import loki from 'lokijs'

// could be in a factory file
const db = new loki('todo', {})
const todoRepository = new TodoRepository({ db })
const todoService = new TodoService({ todoRepository })

await Promise.all(
    [
        new Todo({
            text: 'I must meet Chaves da Silva',
            when: new Date('2021-01-21')
        }),

        new Todo({
            text: 'I must fix my old car',
            when: new Date('2021-02-21')
        }),

        new Todo({
            text: 'I must plan my trip to Europe',
            when: new Date('2021-03-22')
        })
    ]
        .map(todoService.create.bind(todoService))
)

const todoList = await todoService.list()

console.log(
    'todoList', todoList
)
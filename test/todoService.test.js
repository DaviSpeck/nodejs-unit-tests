import { describe, it, beforeEach, before, after, afterEach } from 'node:test'
import assert from 'node:assert'
import crypto from 'node:crypto'
import TodoService from '../src/todoService.js'
import Todo from '../src/todo.js'
import sinon from 'sinon'

// To build a test, first think about the input and output, then the processing. All according to defined business rules.
describe('todoService test Suite', () => {
    describe('#list', () => {
        let _todoService
        let _dependencies
        const mockDatabase = [
            {
                text: 'I must plan my trip to Europe',
                when: new Date('2023-12-01 12:00:00 GMT-0'),
                status: 'late',
                id: 'de175091-e390-420b-b08c-747f72953203'
            }
        ]
        beforeEach((context) => {
            _dependencies = {
                todoRepository: {
                    list: context.mock.fn(async () => mockDatabase)
                }
            }
            _todoService = new TodoService(_dependencies)
        })
        it('should return a list of items with uppercase text', async () => {
            const expected = mockDatabase
                .map(({ text, ...result }) => (new Todo({ text: text.toUpperCase(), ...result })))
            const result = await _todoService.list()
            assert.deepStrictEqual(result, expected)

            // Checking if the function has been called more than once
            const fnMock = _dependencies.todoRepository.list.mock
            assert.strictEqual(fnMock.callCount(), 1)
        })
    })

    describe('#create', () => {
        let _todoService
        let _dependencies
        let _sandbox
        const mockCreateResult = {
            text: 'I must plan my trip to Europe',
            when: new Date('2020-12-01 12:00:00 GMT-0'),
            status: 'late',
            id: 'fec3e17b-6d1b-4b6a-b5b7-dfb824498d31'
        }
        const DEFAULT_ID = mockCreateResult.id
        // Before testing, replace the crypto UUID with the default value so that it doesn't depend on the OS.
        before(() => {
            crypto.randomUUID = () => DEFAULT_ID
            _sandbox = sinon.createSandbox()
        })
        // After the test, return to the usual if any function depends on it.
        after(async () => {
            crypto.randomUUID = (await import('node:crypto')).randomUUID
        })
        afterEach(() => _sandbox.restore())
        beforeEach((context) => {
            _dependencies = {
                todoRepository: {
                    create: context.mock.fn(async () => mockCreateResult)
                }
            }
            _todoService = new TodoService(_dependencies)
        })

        it(`shouldn't save todo item with invalid data`, async () => {
            const input = new Todo({
                text: '',
                when: ''
            })
            const expected = {
                error: {
                    message: 'invalid data',
                    data: {
                        text: '',
                        when: '',
                        status: '',
                        id: DEFAULT_ID
                    }
                }
            }
            const result = await _todoService.create(input)
            assert.deepStrictEqual(JSON.stringify(result), JSON.stringify(expected))
        })

        it(`should save todo item with pending status when the property is in the past`, async () => {
            const properties = {
                text: 'I must plan my trip to Europe',
                when: new Date('2020-12-02 12:00:00 GMT-0')
            }
            const input = new Todo(properties)
            const expected = {
                ...properties,
                status: 'pending',
                id: DEFAULT_ID
            }

            const today = new Date('2020-12-01')
            _sandbox.useFakeTimers(today.getTime())

            await _todoService.create(input)

            const fnMock = _dependencies.todoRepository.create.mock
            assert.strictEqual(fnMock.callCount(), 1)
            assert.deepStrictEqual(fnMock.calls[0].arguments[0], expected)
        })

        it(`should save todo item with late status when the property is in the future`, async () => {
            const properties = {
                text: 'I must plan my trip to Europe',
                when: new Date('2020-12-01 12:00:00 GMT-0')
            }
            const input = new Todo(properties)
            const expected = {
                ...properties,
                status: 'late',
                id: DEFAULT_ID
            }

            const today = new Date('2020-12-02')
            _sandbox.useFakeTimers(today.getTime())

            await _todoService.create(input)

            const fnMock = _dependencies.todoRepository.create.mock
            assert.strictEqual(fnMock.callCount(), 1)
            assert.deepStrictEqual(fnMock.calls[0].arguments[0], expected)
        })
    })
})
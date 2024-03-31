import Todo from "./todo.js";

export default class TodoRepository {
    #schedule
    constructor({ db }) {
        this.#schedule = db.addCollection('schedule')
    }

    async list() {
        // Should use .find().map() to return only data without metadata
        return this.#schedule.find().map(({ meta, $loki, ...result }) => result)
    }

    async create(data) {
        // Destructure $loki and meta from the result object
        const { $loki, meta, ...result } = this.#schedule.insertOne(data)
        return new Todo(result)
    }
}

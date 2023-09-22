import { saveClient } from '../controllers/ContactController.js'

const routes = (fastify: any, options: any, done: any): void => {
  fastify.get('/', async (request: any, reply: any) => {
    return {
      message: 'Welcome to contact API Route !'
    }
  })

  fastify.post('/', saveClient)

  done()
}

export { routes as RouteContact }

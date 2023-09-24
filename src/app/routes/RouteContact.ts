import { checkCode, saveClient, sendMessage } from '../controllers/ContactController.js'

const routes = async (fastify: any, _options: any, done: any): Promise<void> => {
  fastify.get('/', async () => {
    return {
      message: 'Welcome to contact API Route !'
    }
  })

  fastify.post('/', saveClient)

  fastify.post('/code', checkCode)

  fastify.post('/message', sendMessage)

  done()
}

export { routes as RouteContact }

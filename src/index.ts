import Fastify from 'fastify'
import fastifyEnv from '@fastify/env'
import { RouteTest } from './app/routes/RouteTest.js'
import { RouteContact } from './app/routes/RouteContact.js'

const fastify = Fastify({
  logger: true
})

await fastify.register(fastifyEnv, {
  schema: {},
  dotenv: true
})

await fastify.register(import('@fastify/formbody'))

await fastify.register(RouteTest, {
  prefix: '/test'
})

await fastify.register(RouteContact, {
  prefix: '/contact'
})

fastify.get('/', async function handler (request: Fastify.FastifyRequest, reply: Fastify.FastifyReply) {
  return {
    message: 'Welcome to API !'
  }
})

try {
  await fastify.listen({ port: Number(process.env.FASTIFY_PORT) })
} catch (err) {
  fastify.log.error(err)
  process.exit(1)
}

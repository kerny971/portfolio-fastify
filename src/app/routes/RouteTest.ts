const routes = (fastify: any, options: any, done: any): void => {
  fastify.get('/', async (request: any, reply: any) => {
    return {
      hello: 'World'
    }
  })

  done()
}

export { routes as RouteTest }

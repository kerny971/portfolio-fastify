const routes = (fastify: any, options: any, done: any): void => {
  fastify.get('/', async (_request: any, _reply: any) => {
    return {
      hello: 'World'
    }
  })

  done()
}

export { routes as RouteTest }

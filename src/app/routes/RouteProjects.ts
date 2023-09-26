import fastify from "fastify"
import { getProjects } from "../controllers/ProjectsController.js"

const routes = async (fastify: any, _options: any, done: any): Promise<void> => {
  fastify.get('/', getProjects)

  done()
}

export { routes as RouteProject }
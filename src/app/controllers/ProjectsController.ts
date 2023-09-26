import { Prisma, PrismaClient } from "@prisma/client"

async function getProjectsDB (prisma: PrismaClient): Promise<any[]> {
  const projects = prisma.project.findMany({
    orderBy: {
      id: 'desc'
    },
    include: {
      link: true
    }
  })
  return projects
}

export const getProjects = async (_request: any, reply: any): Promise<any> => {

  const prisma = new PrismaClient()

  try {
    await prisma.$connect()
    const projects = await getProjectsDB(prisma)
    prisma.$disconnect()

    const waitFor = (delay: any) => new Promise(resolve => setTimeout(resolve, delay));
    await waitFor(8000);

    reply.statusCode = 200
    return {
      message: "Mes projets",
      data: {
        projects
      }
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      prisma.$disconnect()
    }
    reply.statusCode = 500
    return {
      message: 'Une erreur s\'est produite...'
    }
  }
}
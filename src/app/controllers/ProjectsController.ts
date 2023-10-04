import { Prisma, PrismaClient } from '@prisma/client'

async function getProjectsDB (prisma: PrismaClient): Promise<any[]> {
  const projects = await prisma.project.findMany({
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
    await prisma.$disconnect()

    reply.statusCode = 200
    return {
      message: 'Mes projets',
      data: {
        projects
      }
    }
  } catch (error) {
    console.log(error)
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      await prisma.$disconnect()
    }
    reply.statusCode = 500
    return {
      message: 'Une erreur s\'est produite...'
    }
  }
}

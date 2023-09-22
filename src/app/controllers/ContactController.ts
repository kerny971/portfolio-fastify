import { PrismaClient } from '@prisma/client'
import _ from 'lodash'
import crypto from 'crypto'

import { checkEmail } from '../functions/ValidateEmail.js'
import SendCodeConfirmation from '../functions/SendCodeConfirmation.js'
import { expiredAt, formatDateForMysqlDateTime } from '../functions/date.js'

const prisma = new PrismaClient()

async function saveClientDB ({ email }: { email: string }): Promise<any> {
  const client = await prisma.client.create({
    data: {
      email
    },
    select: {
      id: true,
      email: true
    }
  })
  return client
}

async function getClientDB ({ email }: { email: string }): Promise<any> {
  const client = await prisma.client.findUnique({
    where: {
      email
    },
    include: {
      code: {
        where: {
          expired_at: {
            gte: new Date()
          }
        }
      }
    }
  })
  return client
}

async function saveCodeSentDB ({ code, expiredAt, clientEmail }: { code: string, expiredAt: Date, clientEmail: string }): Promise<any> {
  const codeSent = await prisma.code.create({
    data: {
      code,
      expired_at: formatDateForMysqlDateTime(expiredAt),
      clientEmail
    }
  })
  return codeSent
}

export const saveClient = async (request: any, reply: any): Promise<any> => {
  const { email } = request.body
  if (!checkEmail(email)) {
    reply.statusCode = 400
    return {
      message: 'L\'email n\'est pas valide'
    }
  }

  let user: any

  try {
    user = await getClientDB({ email }).then(async (res) => {
      await prisma.$disconnect()
      return res
    }).catch(async (e) => {
      await prisma.$disconnect()
      throw new Error(e)
    })

    const maxEmailSentForEmailValidation = Number(process.env.MAX_EMAIL_SENT)
    if (user.code.length > maxEmailSentForEmailValidation) {
      reply.statusCode = 429
      return {
        message: 'Un nombre important de mail vous a déjà été envoyée ! Veuillez réessayer sous 24h.'
      }
    }

    if (_.isEmpty(user)) {
      user = await saveClientDB({ email }).then(async (res) => {
        await prisma.$disconnect()
        return res
      }).catch(async (e) => {
        await prisma.$disconnect()
        throw new Error(e)
      })
    }

    console.log(user)

    const hash = crypto.randomBytes(3).toString('hex')
    const expired = expiredAt(Number(process.env.NBR_DAYS_EXPIRED_AT_CODE))
    const sendCodeConfirmation = new SendCodeConfirmation({ email }, hash)
    const response = await sendCodeConfirmation.send()

    if (response.rejected.includes(email) === true) {
      reply.statusCode = 500
      return {
        message: 'Une erreur s\'est produite'
      }
    }

    await saveCodeSentDB({ code: hash, expiredAt: expired, clientEmail: user.email }).then(async (res) => {
      await prisma.$disconnect()
      return res
    }).catch(async (e) => {
      await prisma.$disconnect()
      throw new Error(e)
    })

    reply.statusCode = 200
    return {
      message: 'Un code de vérification à été envoyé à l\'adresse : ' + email,
      data: {}
    }
  } catch (error) {
    console.error(error)
    reply.statusCode = 500
    return {
      message: 'Une erreur s\'est produite'
    }
  }
}

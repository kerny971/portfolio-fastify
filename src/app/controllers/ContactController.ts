import { Prisma, PrismaClient } from '@prisma/client'
import _ from 'lodash'
import crypto from 'crypto'
import ky from 'ky'

import { checkEmail } from '../functions/ValidateEmail.js'
import SendCodeConfirmation from '../functions/SendCodeConfirmation.js'
import { expiredAt, formatDateForMysqlDateTime } from '../functions/date.js'
import { checkMessageHaveErrors } from '../functions/ValidateMessage.js'
import { removeWhiteSpace } from '../functions/string.js'
import SendMessage from '../functions/SendMessage.js'

async function saveClientDB ({ email }: { email: string }, prisma: PrismaClient): Promise<any> {
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

async function getClientDB ({ email }: { email: string }, prisma: PrismaClient): Promise<any> {
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

async function saveCodeSentDB ({ code, expiredAt, clientEmail }: { code: string, expiredAt: Date, clientEmail: string }, prisma: PrismaClient): Promise<any> {
  const codeSent = await prisma.code.create({
    data: {
      code,
      expired_at: formatDateForMysqlDateTime(expiredAt),
      clientEmail
    }
  })
  return codeSent
}

async function saveMessageSentDB ({ message: { fullname, subject, body }, clientId }: { message: { fullname: string, subject: string, body: string }, clientId: number }, prisma: PrismaClient): Promise<any> {
  const messageSent = await prisma.message.create({
    data: {
      subject,
      body,
      clientId,
      full_name: fullname
    }
  })
  return messageSent
}

async function deleteCodeSentDB (id: number, prisma: PrismaClient): Promise<any> {
  const codeSent = await prisma.code.delete({
    where: {
      id
    }
  })

  return codeSent
}

export const saveClient = async (request: any, reply: any): Promise<any> => {
  const prisma = new PrismaClient()
  try {
    const { email, token } = request.body
    if (!checkEmail(email)) {
      reply.statusCode = 400
      return {
        message: 'L\'email n\'est pas valide'
      }
    }

    if (token === '') {
      reply.statusCode = 400
      return {
        message: 'Une erreur s\'est produite...'
      }
    }

    const RecaptchaApiUrl = process.env.RECAPTCHA_URL ?? ''
    const RecaptchaApiSecret = process.env.RECAPTCHA_API_SECRET ?? ''
    const urlEncoded = new URLSearchParams()
    urlEncoded.append('secret', RecaptchaApiSecret)
    urlEncoded.append('response', token)
    const recaptchaApi: any = await ky.post(RecaptchaApiUrl, {
      body: urlEncoded
    }).json()

    if (recaptchaApi.success === false) {
      reply.statusCode = 400
      return {
        message: 'Une erreur s\'est produite...'
      }
    }

    const RecaptchaActionSaveEmail = process.env.RECAPTCHA_ACTION_SAVE_EMAIL
    if (recaptchaApi.action !== RecaptchaActionSaveEmail) {
      reply.statusCode = 400
      return {
        message: 'Une erreur s\'est produite...'
      }
    }

    const RecaptchaActionSaveEmailScore = Number(process.env.RECAPTCHA_ACTION_SAVE_EMAIL_SCORE)
    if (recaptchaApi.score < RecaptchaActionSaveEmailScore) {
      reply.statusCode = 400
      return {
        message: 'Une erreur s\'est produite...'
      }
    }

    await prisma.$connect()

    let user: any
    user = await getClientDB({ email }, prisma)

    if (_.isEmpty(user)) {
      user = await saveClientDB({ email }, prisma)
    } else {
      const maxEmailSentForEmailValidation = Number(process.env.MAX_EMAIL_SENT)
      if (user.code.length > maxEmailSentForEmailValidation) {
        reply.statusCode = 429
        return {
          message: 'Un nombre important de mail vous a déjà été envoyée ! Veuillez réessayer sous 24h.'
        }
      }
    }

    let hashSize = Number(process.env.HASH_SIZE)
    hashSize = hashSize > 3 ? hashSize : 4
    const hash = crypto.randomBytes(hashSize).toString('hex')
    const NBR_DAYS_BEFORE_CODE_EXPIRE = Number(process.env.NBR_DAYS_EXPIRED_AT_CODE)
    const expired = expiredAt(NBR_DAYS_BEFORE_CODE_EXPIRE)
    const sendCodeConfirmation = new SendCodeConfirmation({ email }, hash)
    const response = await sendCodeConfirmation.send()

    if (response.rejected.includes(email) === true) {
      reply.statusCode = 500
      return {
        message: 'Une erreur s\'est produite'
      }
    }

    await saveCodeSentDB({
      code: hash,
      expiredAt: expired,
      clientEmail: user.email
    }, prisma)
    await prisma.$disconnect()

    reply.statusCode = 200
    return {
      message: 'Un code de vérification à été envoyé à l\'adresse : ' + email,
      data: {
        email
      }
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      await prisma.$disconnect()
    }
    console.error(error)
    reply.statusCode = 50
    return {
      message: 'Une erreur s\'est produite'
    }
  }
}

export const checkCode = async (request: any, reply: any): Promise<any> => {
  const prisma = new PrismaClient()
  try {
    const { code, email, token } = request.body

    if (_.isEmpty(code)) {
      reply.statusCode = 400
      return {
        message: 'Un code de validité doit être soumis',
        fields: [
          { name: 'code', message: 'Un code de validité doit-être soumis !' }
        ]
      }
    }

    if (!checkEmail(email)) {
      reply.statusCode = 400
      return {
        message: 'L\'email n\'est pas valide',
        fields: [
          { name: 'email', message: 'L\'email n\'est pas valide !' }
        ]
      }
    }

    if (token === '') {
      reply.statusCode = 400
      return {
        message: 'Une erreur s\'est produite...'
      }
    }

    const RecaptchaApiUrl = process.env.RECAPTCHA_URL ?? ''
    const RecaptchaApiSecret = process.env.RECAPTCHA_API_SECRET ?? ''
    const urlEncoded = new URLSearchParams()
    urlEncoded.append('secret', RecaptchaApiSecret)
    urlEncoded.append('response', token)
    const recaptchaApi: any = await ky.post(RecaptchaApiUrl, {
      body: urlEncoded
    }).json()

    if (recaptchaApi.success === false) {
      reply.statusCode = 400
      return {
        message: 'Une erreur s\'est produite...'
      }
    }

    const RecaptchaActionCheckCode = process.env.RECAPTCHA_ACTION_CHECK_CODE
    if (recaptchaApi.action !== RecaptchaActionCheckCode) {
      reply.statusCode = 400
      return {
        message: 'Une erreur s\'est produite...'
      }
    }

    const RecaptchaActionCheckCodeScore = Number(process.env.RECAPTCHA_ACTION_CHECK_CODE_SCORE ?? 0.2)
    if (recaptchaApi.score < RecaptchaActionCheckCodeScore) {
      reply.statusCode = 400
      return {
        message: 'Une erreur s\'est produite...'
      }
    }

    await prisma.$connect()
    const user = await getClientDB({ email }, prisma)
    await prisma.$disconnect()

    if (_.isEmpty(user)) {
      reply.statusCode = 400
      return {
        message: 'Erreur...'
      }
    }

    const codeCheck = user.code.filter((c: any) => c.code === code)
    if (codeCheck.length <= 0) {
      reply.statusCode = 400
      return {
        message: 'Le code saisi n\'est pas valide'
      }
    }

    reply.statusCode = 200
    return {
      message: 'Le code saisit est le bon !',
      data: {
        email,
        code
      }
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      await prisma.$disconnect()
    }
    reply.statusCode = 500
    return {
      message: 'Une erreur s\'est produite...'
    }
  }
}

export const sendMessage = async (request: any, reply: any): Promise<any> => {
  const prisma = new PrismaClient()
  try {
    const { code, email, token } = request.body
    const message = {
      fullname: request.body.fullname != null ? removeWhiteSpace(request.body.fullname) : '',
      subject: request.body.subject != null ? removeWhiteSpace(request.body.subject) : '',
      body: request.body.body != null ? removeWhiteSpace(request.body.body) : ''
    }

    if (_.isEmpty(code)) {
      reply.statusCode = 400
      return {
        message: 'Un code de validité doit être soumis',
        fields: [
          { name: 'code', message: 'Un code de validité doit-être soumis !' }
        ]
      }
    }

    if (!checkEmail(email)) {
      reply.statusCode = 400
      return {
        message: 'L\'email n\'est pas valide',
        fields: [
          { name: 'email', message: 'L\'email n\'est pas valide !' }
        ]
      }
    }

    if (token === '') {
      reply.statusCode = 400
      return {
        message: 'Une erreur s\'est produite...'
      }
    }

    const checkMessagesErrors = await checkMessageHaveErrors(message)
    if (checkMessagesErrors !== null) {
      reply.statusCode = 400
      return checkMessagesErrors
    }

    const RecaptchaApiUrl = process.env.RECAPTCHA_URL ?? ''
    const RecaptchaApiSecret = process.env.RECAPTCHA_API_SECRET ?? ''
    const urlEncoded = new URLSearchParams()
    urlEncoded.append('secret', RecaptchaApiSecret)
    urlEncoded.append('response', token)
    const recaptchaApi: any = await ky.post(RecaptchaApiUrl, {
      body: urlEncoded
    }).json()

    if (recaptchaApi.success === false) {
      reply.statusCode = 400
      return {
        message: 'Une erreur s\'est produite...'
      }
    }

    const RecaptchaActionSendMessage = process.env.RECAPTCHA_ACTION_SEND_MESSAGE
    if (recaptchaApi.action !== RecaptchaActionSendMessage) {
      reply.statusCode = 400
      return {
        message: 'Une erreur s\'est produite...'
      }
    }

    const RecaptchaActionSendEmailScore = Number(process.env.RECAPTCHA_ACTION_SEND_MESSAGE_SCORE ?? 0.2)
    if (recaptchaApi.score < RecaptchaActionSendEmailScore) {
      reply.statusCode = 400
      return {
        message: 'Une erreur s\'est produite...'
      }
    }

    await prisma.$connect()
    const user = await getClientDB({ email }, prisma)

    if (_.isEmpty(user)) {
      reply.statusCode = 400
      return {
        message: 'Erreur...'
      }
    }

    const codeCheck = user.code.filter((c: any) => c.code === code)
    if (codeCheck.length <= 0) {
      reply.statusCode = 400
      return {
        message: 'Une erreur s\'est produite...'
      }
    }

    await saveMessageSentDB({ message, clientId: user.id }, prisma)

    await deleteCodeSentDB(codeCheck[0].id, prisma)
    await prisma.$disconnect()

    const sendMessage = new SendMessage({
      user: {
        email,
        pseudo: message.fullname
      },
      subject: message.subject,
      body: message.body
    })
    const response = await sendMessage.send()

    if (response.rejected.includes(email) === true) {
      reply.statusCode = 500
      return {
        message: 'Une erreur s\'est produite'
      }
    }

    reply.statusCode = 200
    return {
      message: 'Votre message à bien été envoyée'
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      await prisma.$disconnect()
    }
    reply.statusCode = 500
    return {
      message: 'Une erreur s\'est produite...'
    }
  }
}

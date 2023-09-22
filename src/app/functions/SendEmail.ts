import nodemailer from 'nodemailer'
export default class SendEmail {
  transporter: any
  msg: { from: string, to: string, subject: string, text: string, html: string }

  constructor (user: any, subject: any, text: any, html: any) {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    })

    this.msg = {
      from: `'${process.env.FROM_NAME_EMAIL_CONFIRMATION}' <${process.env.FROM_EMAIL_EMAIL_CONFIRMATION}>`,
      to: `${user.pseudo ?? ''}<${user.email}>`,
      subject,
      text,
      html
    }
  }

  send (): any {
    return this.transporter.sendMail(this.msg)
  }
}

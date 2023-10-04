import SendEmail from './SendEmail.js'

export default class SendMessage {
  private readonly _email = process.env.TO_EMAIL_EMAIL_RECEIPT_MESSAGE ?? 'kerny.laguerre@rody.bio'
  private readonly _user: { email: string, pseudo?: string } = { email: this._email }
  private readonly _subject: string
  private readonly _text: string
  private readonly _html: string
  private _SENDMAIL: any = null

  constructor ({ user, subject, body }: { user: { email: string, pseudo?: string }, subject: string, body: string }) {
    const message = `
      ${body} \n
      \n
      \n
      \n
      From : ${user.pseudo} ${user.email}
    `
    const messageHtml = `
      <p>
        ${body}
      </p>
      <br/>
      <br/>
      From : ${user.pseudo} -- ${user.email}
    `
    this._subject = subject
    this._text = message
    this._html = messageHtml
  }

  public send = (): any => {
    this._SENDMAIL = new SendEmail(this._user, this._subject, this._text, this._html)
    return this._SENDMAIL.send()
  }
}

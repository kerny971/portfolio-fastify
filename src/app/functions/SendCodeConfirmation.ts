import SendEmail from './SendEmail.js'

export default class SendCodeConfirmation {
  private readonly _user: { email: string, pseudo?: string }
  private readonly _code: string
  private readonly _subject: string
  private readonly _text: string
  private readonly _html: string
  private _SENDMAIL: any = null

  constructor (user: { email: string, pseudo?: string }, code: string) {
    this._user = user
    this._code = code
    this._subject = process.env.SUBJECT_EMAIL_CONFIRMATION ?? 'Sujet non indiqué'
    this._text = `
      Chèr(e) ${user.pseudo ?? 'visiteur(se)'}, \n
      \n
      Vérifiez votre adresse email.\n
      Confirmez que l'adresse ${user.email} est bien la vôtre en saisissant le code ci-dessous dans le champs correspondant. \n
      Ce code est valable durant 24 h et jusqu'à la fin du processus du formulaire de contact !\n
      \n
      ${this._code}
      \n
      \n 
      Si vous n'êtes pas à l'origine de ce message, veuillez ne pas prendre en compte les instructions indiquée.
    `
    this._html = `
        <div style="max-width: 500px; font-family: ui-system;">
          <h1>Portfolio Kerny LAGUERRE</h1>
          Chèr(e) ${user.pseudo ?? 'visiteur(se)'},
          <p>
            Vérifiez votre adresse électronique.<br/>
            Confirmez que l'adresse ${user.email} est bien la vôtre en saisissant le code ci-dessous dans le champs correspondant.<br/>
            <br/>
            <span style="font-size: 1.3em; font-weight: 600;">
              ${this._code}
            </span>
          </p>
          <div style="font-size: .7em;">Ce code est valable durant 24 h et jusqu'à la fin du processus du formulaire de contact</div>
          <div style="font-size: .7em;">Si vous n'êtes pas à l'origine de ce message, veuillez ne pas prendre en compte les instructions indiquée.</div>
        </div>
    `
  }

  public send = (): any => {
    this._SENDMAIL = new SendEmail(this._user, this._subject, this._text, this._html)
    return this._SENDMAIL.send()
  }
}

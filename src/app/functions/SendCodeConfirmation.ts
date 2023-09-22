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
      Chèr(e) ${user.pseudo}, \n
      \n
      Vérifiez votre adresse email.\n
      Confirmez que l'adresse ${user.email} est bien la vôtre en saisissant le code ci-dessous dans le champs correspondant. \n
      Ce code sera valable les deux prochaines heures suivant la réception de ce mail !\n
      \n
      \n 
      Si vous n'êtes pas à l'origine de ce message, veuillez ne pas prendre en compte les instructions indiquée.
    `
    this._html = `
      <head>
          <style>
              .btn-email {
                  display: block;
                  margin: 2em auto;
                  padding: 1em;
              }

              div {
                  max-width: 300px;
                  padding: 1em;
                  margin: 1em auto;
                  text-align: center;
              }
          </style>
      </head>
      <body>
          <div>
              <h1>BoxStorage</h1>
              Chèr(e) Client(e),
              <p>
                  Vérifiez votre adresse électronique.<br/>
                  Confirmez que l'adresse ${user.email} est bien la vôtre en saisissant le code ci-dessous dans le champs correspondant.<br/>
                  <em>
                    ${this._code}
                  </em>
              <p>
              <small>Si vous n'êtes pas à l'origine de ce message, veuillez ne pas prendre en compte les instructions indiquée.</small>
          </div>
      </body>
    `
  }

  public send = (): any => {
    this._SENDMAIL = new SendEmail(this._user, this._subject, this._text, this._html)
    return this._SENDMAIL.send()
  }
}

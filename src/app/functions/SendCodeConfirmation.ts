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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;700&display=swap" rel="stylesheet">
        <style>
          body {
            font-family: Inter, sans-serif,
          }

          div {
              max-width: 300px;
              padding: 1em;
              margin: 1em auto;
              text-align: center;
          }

          span {
            margin-top: .75em;
            font-size: 1.3em;
            font-weight: 500;
          }

          small {
            display: block;
          }

          small:last-child() {
            margin-top: 2em;
          } 
        </style>
      </head>
      <body>
          <div>
            <h1>Portfolio Kerny LAGUERRE</h1>
            Chèr(e) ${user.pseudo ?? 'visiteur(se)'},
            <p>
              Vérifiez votre adresse électronique.<br/>
              Confirmez que l'adresse ${user.email} est bien la vôtre en saisissant le code ci-dessous dans le champs correspondant.<br/>
              <span>
                ${this._code}
              </span>
            <p>
            <small>Ce code est valable durant 24 h et jusqu'à la fin du processus du formulaire de contact</small>
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

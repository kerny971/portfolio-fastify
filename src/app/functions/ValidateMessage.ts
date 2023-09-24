export const checkMessageHaveErrors = async ({ fullname, subject, body }: { fullname: string, subject: string, body: string }): Promise<{ message: string, field: string } | null> => {
  const regexFullname: string | undefined = process.env.REGEX_FULLNAME
  if (regexFullname === undefined || !(new RegExp(regexFullname)).test(fullname)) {
    return {
      message: 'La syntaxe du champs Nom Complet est incorrecte',
      field: 'fullname'
    }
  }

  const regexSubject: string | undefined = process.env.REGEX_SUBJECT_MAIL
  if (regexSubject === undefined || !(new RegExp(regexSubject)).test(subject)) {
    return {
      message: 'La syntaxe du champ Sujet est incorrecte',
      field: 'subject'
    }
  }

  const regexBody: string | undefined = process.env.REGEX_BODY_MAIL
  if (regexBody === undefined || !(new RegExp(regexBody)).test(body)) {
    return {
      message: 'La syntaxe du champ corps du message est incorrecte',
      field: 'body'
    }
  }

  return null
}

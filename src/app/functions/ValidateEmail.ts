export const checkEmail = (email: string): boolean => {
  const regexEmail: string | undefined = process.env.REGEX_EMAIL
  if (regexEmail != null) {
    return (new RegExp(regexEmail)).test(email)
  }

  return false
}

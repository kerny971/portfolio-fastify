import _ from 'lodash'

export const expiredAt = (days: number, date?: Date): Date => {
  if (_.isEmpty(date)) {
    date = new Date()
  }
  date.setDate(date.getDate() + days)
  return date
}

export const formatDateForMysqlDateTime = (date: Date): Date | string => {
  return date.toISOString()
}

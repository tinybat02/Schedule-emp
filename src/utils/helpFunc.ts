import { DayOfWeek, Frame } from '../types';
import toDate from 'date-fns/toDate';
import { utcToZonedTime, format } from 'date-fns-tz';

export const hourToString = (start: number, end: number) => {
  const arr = [];
  for (let i = start; i < end; i++) {
    if (i < 10) arr.push('0' + i);
    else arr.push(i.toString());
  }
  return arr;
};

export const process = (
  customersSerie: Frame,
  employee: number,
  open_hour: number,
  close_hour: number,
  timeZone: string
) => {
  console.log('employee ', employee);

  const customerArr = customersSerie.fields[0].values.buffer.filter((i: number) => i > 0);
  const empRatio = customerArr.reduce((total, i) => total + i, 0) / customerArr.length / employee;
  console.log('empRatio ', empRatio);

  const hours = hourToString(open_hour, close_hour);
  const narr = [...Array(employee + 1).keys()].slice(1).reverse();
  const template = narr.map(i => {
    const obj: { emp: number; [key: string]: any } = { emp: i };

    hours.map(hour => {
      obj[hour] = null;
    });

    return obj;
  });

  customersSerie.fields[1].values.buffer.map((timestamp, idx) => {
    const zonedDate = utcToZonedTime(toDate(timestamp), timeZone);
    const dayOfWeek = format(zonedDate, 'eee', { timeZone }) as DayOfWeek;
    const hour = format(zonedDate, 'HH', { timeZone });

    if (dayOfWeek !== 'Sun' && hours.includes(hour)) {
      const ratio = Math.floor(customersSerie.fields[0].values.buffer[idx] / empRatio);
      console.log('hour ', hour, ' cus ', customersSerie.fields[0].values.buffer[idx], ' cus/ratio ', ratio);
      const bound = ratio > employee ? employee : ratio;
      console.log('bound ', bound);
      for (let j = 0; j < bound; j++) {
        template[employee - 1 - j][hour] = 10;
      }

      const topbound = employee - bound;
      for (let k = 0; k < topbound; k++) {
        template[k][hour] = 5;
      }
    }
  });

  return { data: template, keys: hours };
};

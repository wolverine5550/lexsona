export const toDateTime = (secs: number) => {
  const t = new Date('1970-01-01T00:00:00Z');
  t.setSeconds(secs);
  return t;
};

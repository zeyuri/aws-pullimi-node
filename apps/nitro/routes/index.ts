export default eventHandler(async (event) => {
  const ip = getRequestIP(event);
  console.log(`Your IP is ${ip}`);
  return { ip: `your IP IS ${ip} ` };
});

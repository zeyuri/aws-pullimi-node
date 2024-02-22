export default eventHandler(async () => {
  console.log("Health check");
  return { message: "OK" };
});

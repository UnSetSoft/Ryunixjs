export const GET = async (_req: Request): Promise<Response> => {
  return new Response(JSON.stringify({ message: 'Hello World!' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

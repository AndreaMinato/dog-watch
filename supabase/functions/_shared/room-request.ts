export function withRoomId<Context>(handler: (roomId: string, ctx: Context) => Promise<Response>) {
  return async (req: Request, ctx: Context): Promise<Response> => {
    const { roomId } = await req.json()
    if (typeof roomId !== 'string')
      return Response.json({ error: 'invalid_request' }, { status: 400 })
    return handler(roomId, ctx)
  }
}

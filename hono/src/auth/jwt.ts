import { createMiddleware } from "hono/factory";
import { sign, verify } from "hono/jwt";

const secret = process.env.JWT_SECRET!

export async function newToken(name: string, email: string, access_token: string, refresh_token: string, expiresAt: Date): Promise<string> {
    const gradYear = email.match(/[0-9]{2}(?=@)/)
    if (gradYear == null) {
        throw new Error("User email has no graduation year.")
    } 

    const currentYear = new Date().getFullYear()
    const academicYear = currentYear - Math.floor(currentYear/100)*100

    const payload = {
        name: name,
        user_is: +gradYear[0] == academicYear ? 'fresher' : 'parent',
        email: email,
        access_token: access_token,
        exp: Math.floor(expiresAt.getTime()/1000)
    }

    const token = await sign(payload, secret);

    // todo: store [email, refresh_token] in db.

    return token;
}

export const authMiddleware = createMiddleware(async (ctx, next) => {
    const jwt_token = '';
    

    ctx.set("user_is", "parent/student")
    await next() 
})
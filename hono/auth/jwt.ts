import { createMiddleware } from "hono/factory";
import { sign, verify } from "hono/jwt";
import { addOrUpdateAuth } from "../db";

const secret = process.env.JWT_SECRET!

export async function newToken(name: string, email: string, access_token: string, refresh_token: string, expiresAt: Date): Promise<string> {
    const gradYear = email.match(/[0-9]{2}(?=@)/)

    if (gradYear == null) {
        throw new Error("User email has no graduation year.")
    } 

    const now = new Date()
    const academicYear = now.getFullYear() - Math.floor(now.getFullYear()/100)*100
    const user_is = +gradYear[0] == academicYear ? 'fresher' : 'parent'

    const payload = {
        user_is: user_is,
        email: email,
        exp: Math.floor((new Date).getTime()/1000)
    }

    addOrUpdateAuth(email, access_token, refresh_token, expiresAt);

    const token = await sign(payload, secret);

    return token;
}

export const authMiddleware = createMiddleware(async (ctx, next) => {
    const jwt_token = '';
    

    ctx.set("user_is", "parent/student")
    await next() 
})
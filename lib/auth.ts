import { cookies } from 'next/headers'
import { prisma } from './prisma' // We will create this next

const USER_COOKIE_NAME = 'adboost_user_id'

export async function getSessionUser() {
    const cookieStore = await cookies()
    const userIdCookie = cookieStore.get(USER_COOKIE_NAME)

    if (userIdCookie?.value) {
        // Check if user exists in DB
        const user = await prisma.user.findUnique({
            where: { id: userIdCookie.value }
        })

        if (user) {
            return user
        }
    }

    // If no cookie or user not found, create a new mock user
    const newUser = await prisma.user.create({
        data: {} // Uses default cuid() for id
    })

    // Set the cookie for future requests
    // In a real app, this would be a secure, HTTP-only, signed session token
    cookieStore.set(USER_COOKIE_NAME, newUser.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30 // 30 days
    })

    return newUser
}

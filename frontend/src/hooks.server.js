import { redirect } from '@sveltejs/kit';
import { isAuthenticated } from './store';

export const handle = async ({ event, resolve }) => {

    const sessionCookie = event.cookies.get("SESSION");
    if (!sessionCookie) {
        console.log("cookie di sessione non trovato")
        isAuthenticated.set(false);
    }

    if (event.url.pathname != "/login" && !sessionCookie) {
        throw redirect(302, "/login")
    }

    const response = await resolve(event);
    return response;
}

export async function handleFetch({ event, request, fetch }) {
	return await fetch(request);
}
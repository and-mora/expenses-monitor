import { redirect } from '@sveltejs/kit';

/** @type {import('./$types').LayoutServerLoad} */
export async function load({ cookies }) {
    console.log("layout server load");

    const sessionCookie = cookies.get('SESSION');
    if (!sessionCookie) {
        throw redirect(302, "/login");
    }
    const usernameResponse = await fetch('http://localhost:8443/username');
    

	return {user: await usernameResponse.text()};
}